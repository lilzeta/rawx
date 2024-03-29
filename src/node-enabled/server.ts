/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = Server;
// Server <= _Server class inside closure
// External modules/type
const { spawn, fork, exec, execFile } = require("child_process");
const { exists } = require("fs");
const t_kill = require("tree-kill");
const { v4: __id } = require("uuid");

import { ChildProcess } from "child_process";

// Internal Modules
import { O, Ops_Gen } from "../ops/index";
import { Server_Args } from "./args_types";
import { Server_I, str } from "./export_types";
import { P, H, _P } from "./proc_type_defs";
const Ops: Ops_Gen = require("../ops/ops");
export enum DEBUG_FTR {
    KILL = 13,
}
const max_term_delay = 5000;

import { Server_Constructor_C } from "./server_c";
const Server_Constructor: Server_Constructor_C = require("./server_c");
/**
 * Note all class vars moved to Server_Construct
 * this file contains runtime methods and is alive till SigTerm or .die()
 * Use Server is Server_Class, signature as a normal class, call with `new Server(args)`
 */

// Server_Facade behaves as would exposed inner _Server
class Server_Facade {
    constructor(args: Server_Args) {
        return server_creator(args);
    }
    set_range: (n: number) => void;
    die: () => void;
}
// Now we expose _Server through Server_Facade as if we created it w/vanilla
const Server = Server_Facade;
type Server_Creator = (args: Server_Args) => Server_I;
const server_creator: Server_Creator = (args: Server_Args) => {
    // server_creator => return new _Server(args);

    // set in constructor
    let o: O;

    class Server_Concrete_Class extends Server_Constructor implements Server_I {
        constructor(args: Server_Args) {
            super(args);
            // An Env Configured Ops rebased for `Server`
            o = new Ops({
                colors: args.colors,
                debug: this.debug,
                label: this.label,
            });
            if (this.watch) this._watch.set_trigger(this.restart);
            if (args.dry_run) {
                return;
            }
            if (args.sig !== "handled") this.set_sigterm();
            // Set a new chain_id for our first proc
            this._tubed = __id();
            // prepare first proc, if no .on_watch also run
            this.prerun_checks({ chain_id: this._tubed }).catch();
            // TODO test if we need .catch();
            o.accent(7, "constructor completed");
        }
        // TypeError: this.set_sigterm is not a function (Typescript bug?)
        // on_constructed = (args: s) => {
        //     if (args.sig !== "handled") this.set_sigterm();
        //     // Set a new chain_id for our first proc
        //     this._tubed = __id();
        //     // prepare first proc, if no .on_watch also run
        //     this.prerun_checks({ chain_id: this._tubed }).catch();
        //     // TODO test if we need .catch();
        //     o.accent(7, `constructor completed`);
        // }

        prerun_checks = async ({ chain_id, direct_trigger, ...opts }: _Precheck_Args) => {
            const { trigger_file_path, trigger_index } = opts;
            if (!direct_trigger && this._tubed && this._tubed !== chain_id) return;
            let proc_ = this.proc_from_stack({ direct_trigger, trigger_index });
            if (proc_ === "wait") return;
            let proc = proc_ as _P._Proc;
            if (!proc) {
                if (!this._step_procs?.length && !this.has_trigger()) {
                    o.forky(`no procs & no trigger_index -> die()`);
                    this.die();
                }
                return;
            }
            // this.tubed = id;
            if (proc.delay) await o.wait(proc.delay);
            // if another watch has retriggered do nothing/return
            if (this._tubed !== chain_id) return;
            o.forky(10, "proc:");
            o.forky(10, o.pretty(proc));
            // if proc.trap -> last <Server_Proc> - a one shot, remove watchers -> run command
            proc.trap && this.trap(chain_id); // syncronously
            // ignoring result, can throw
            this.prepare_run({ proc, chain_id, trigger_file_path });
            if (proc._conc) {
                // const conc_proc = proc.concurrent;
                // ignoring result, can throw
                this.concurrently(proc._conc, chain_id).catch();
            }
        };

        proc_from_stack = ({
            direct_trigger = false,
            trigger_index,
        }: {
            direct_trigger?: boolean;
            trigger_index?: number;
        }): _P._Proc | "wait" | undefined => {
            if (direct_trigger) {
                if (!o.defi(trigger_index)) {
                    trigger_index = this.trigger_index;
                }
                if (o.defi(trigger_index)) {
                    this.set_range(trigger_index);
                }
            }
            if (!this._step_procs?.length) {
                return;
            }
            if (this._step_procs[0].on_watch && !direct_trigger) return "wait";
            return this._step_procs.shift();
        };

        prepare_run = async ({ proc, chain_id, trigger_file_path }: _Prepare_Args) => {
            o.accent(9, `prepare_run, trigger_file_path?:`);
            o.accent(9, trigger_file_path);
            const { chain_exit, _sidecar } = proc;
            const { run_if_file_dne, goto_on_file_exists } = proc;
            // const silence = proc.silence === "all" ? () => 999 : undefined;
            const log_level = proc.silence === "all" ? 999 : 2;
            try {
                o.forky(chain_exit ? 8 : 999, `~ TIC ~`); // KICK...
                let cool: _Run_Wrapper_Return;
                // TODO this case has some dupe stuff needs fn/promise
                if (run_if_file_dne?.length) {
                    // run_if_file_dne is a filename if it exists
                    try {
                        const f_exists = await exists(run_if_file_dne);
                        if (proc.silence !== "all") {
                            o.forky(
                                log_level,
                                `<child-process/> File Exists - ${f_exists} -${_sidecar.label}`,
                            );
                        }
                        if (o.defi(goto_on_file_exists)) {
                            this.set_range(goto_on_file_exists);
                            o.forky(
                                log_level,
                                `<child-process/> Setting Next Proc: ${goto_on_file_exists}`,
                            );
                            // assume goto_on_file_exists means chain_next @goto
                            this.chain_next({
                                code: 0,
                                proc,
                                // juke chain
                                chain_option: true,
                                chain_id,
                            });
                            return;
                        }
                    } catch (err) {
                        o.forky(log_level, `File Exist threw - ${_sidecar.label}`);
                    }
                    o.forky(log_level, `proc  _// start File DNE Exist - ${_sidecar.label}`);
                } else {
                    o.forky(log_level, `proc _// start - ${_sidecar.label}`);
                }

                cool = this.run_wrapper({ proc, trigger_file_path });

                if (this._tubed !== chain_id) {
                    this.terminate_check();
                    return;
                }

                if (cool) {
                    // If run_process returned a process, TODO typesafe
                    if (cool.p) {
                        const r_proc = cool.p;
                        const r_pid = r_proc.pid;
                        if (!r_pid) {
                            this.terminate_check();
                            o.forky(log_level, `proc did not start - ${_sidecar.label}`);
                        } else {
                            const s_pid = "" + r_pid;
                            this._proc_manifest[s_pid] = r_proc;
                            this._root_pids.push(s_pid);
                            this._proc_util.setup_subproc({
                                sub_proc: r_proc,
                                label: _sidecar.label,
                                silence: _sidecar.silence,
                                on_close: () => this.cleanup(s_pid),
                            });
                        }
                        if (chain_exit) {
                            if (r_pid) {
                                r_proc.once("exit", async (code: number) => {
                                    this.terminate_check();
                                    this.chain_next({
                                        code,
                                        proc,
                                        chain_option: chain_exit,
                                        chain_id,
                                    });
                                });
                            } else {
                                this.chain_next({
                                    code: 1,
                                    proc,
                                    chain_option: chain_exit,
                                    chain_id,
                                });
                            }
                        } else {
                            r_proc.once("exit", async (_) => {
                                this.terminate_check();
                            });
                        }
                    } else if (cool.f || cool.r) {
                        const done = cool.f || (cool.r as Promise<number>);
                        done.then((code) => {
                            this.terminate_check();
                            this.chain_next({
                                code,
                                proc,
                                chain_option: chain_exit,
                                chain_id,
                            });
                        }).catch((err: Error) => {
                            const title = cool.f ? "Hook fn" : "Repeater";
                            o.errata(1, `${title} threw an error: ${err}`);
                        });
                    }
                }
            } catch (err) {
                // TODO? a chaperone timer to prevent a watch_death -> catch (err) -> watch_death loop
                if (this.has_trigger()) {
                    this.kill_all().catch(); // but for now, force all processes to be catch responsible
                    o.errata(
                        log_level,
                        `uncaught error -> chain will restart to trigger_index: ${err}`,
                    );
                    await o.wait(this.kill_delay);
                } else {
                    o.errata(`uncaught throw -> no trigger_index, exiting: ${err}`);
                    this.die();
                }
            }
        };

        // lets keep this syncronous
        run_wrapper = ({
            proc,
            trigger_file_path, // undefined only when chained from constructor
            sub_proc = true,
        }: _Run_Wrapper_Args): _Run_Wrapper_Return => {
            const { type } = proc;
            if (this._proc_util.is_fn_proc(proc)) {
                const _proc = proc as H._Hook_Fn;
                if (type === "fn") {
                    return { f: this.call_fn({ proc: _proc }).catch() };
                } else if (type === "exec_fn") {
                    return {
                        f: this.call_exec_fn({
                            proc: _proc,
                            trigger_file_path,
                        }).catch(),
                    };
                }
                return;
            } else {
                const _proc = proc as _P._Proc_W_Conf;
                if (this._proc_util.is_repeater_proc(_proc)) {
                    return {
                        r: this.run_repeater_proc(
                            _proc.construct as _P._Run_Proc_Conf,
                            _proc._sidecar,
                            sub_proc,
                        ),
                    };
                }
                return { p: this.run_node_proc(_proc.construct, _proc._sidecar, sub_proc) };
            }
        };

        run_repeater_proc = (
            p_args: _P._Run_Proc_Conf,
            _sidecar: _P._Sidecar,
            _subproc?: true,
        ): Promise<number> => {
            return new Promise<number>(async (res) => {
                const { type, command, options } = p_args;
                let sub_args = p_args.args;
                const log_lev: number = _sidecar.silence === "all" ? 999 : 8;
                const rep_args: Array<P.P_Args> = p_args.args as Array<P.P_Args>;
                let repeater_chain = p_args.repeater_chain;
                const subproc = (args: ReadonlyArray<string>): ChildProcess | undefined => {
                    if (type === "execFile") {
                        o.log(
                            log_lev,
                            `execFile ${command} ${o.pretty(sub_args)} ${o.pretty(options)}`,
                        );
                        return execFile(p_args.command, args, options);
                    }
                    if (type === "spawn") {
                        const p_a: _P._Run_Proc_Conf = p_args as _P._Run_Proc_Conf;
                        o.log(
                            log_lev,
                            `spawn ${command} ${o.pretty(sub_args)} ${o.pretty(p_a.options)}`,
                        );
                        return spawn(command, args, p_a.options);
                    }
                };

                const repeater = async (i = 0) => {
                    // TODO pre_validate, lets assume at least 1, res(at last index or fail)
                    // if (i >= sub_args.length) {
                    //     return 0;
                    // }
                    const c_proc = subproc(rep_args[i]);
                    this._proc_util.basic_proc_stdio(c_proc, _sidecar.silence);
                    // o.basic_proc_stdio(c_proc, _sidecar.silence);
                    // TODO this implementation depends on Every c_proc sending an exit or throwing
                    // how incorrect/poorly behaved is this assumption?
                    c_proc?.on("exit", async (code) => {
                        if (code) {
                            if (repeater_chain === "success") {
                                o.errata(`repeater chain exited w/err: ${code}, halting.`);
                                // Is this correct though?
                                res(code);
                                return;
                            } else {
                                o.errata(
                                    `repeater chain exited w/err: ${code}, w/no repeater_chain: "success" => next`,
                                );
                            }
                        }
                        if (i + 1 >= sub_args.length) {
                            res(code || 0);
                            return;
                        }
                        await repeater(i + 1);
                    });
                };
                await repeater();
            });
        };

        // lets keep this syncronous
        run_node_proc = (
            p_args: _P._Run_Proc_Conf | _P._Run_Fork_Conf | _P._Run_Exec_Conf,
            _sidecar: _P._Proc["_sidecar"],
            _subproc?: true,
        ): ChildProcess | undefined => {
            // https://nodejs.org/api/child_process.html#child_process
            const { type } = p_args;
            // shell: true,
            // if (process.platform == "win32") {
            if (type === "exec") {
                o.accent(9, `exec(command):`);
                o.accent(9, p_args.command);
                return exec(p_args.command);
            }
            let sub_args = p_args.args;
            if (type === "fork") {
                const fork_args: ReadonlyArray<string> = sub_args as ReadonlyArray<string>;
                p_args = p_args as _P._Run_Fork_Conf;
                const { module, options } = p_args;
                return fork(module, fork_args, options);
            }
            p_args = p_args as _P._Run_Proc_Conf;
            const { command, options } = p_args;
            // TODO put in new function?
            if (sub_args?.[0] && Array.isArray(sub_args[0])) {
            } else {
                sub_args = p_args.args as ReadonlyArray<string>;
                if (type === "execFile") {
                    o.log(8, `execFile ${command} ${o.pretty(sub_args)} ${o.pretty(options)}`);
                    return execFile(p_args.command, sub_args, options);
                }
                if (type === "spawn") {
                    const p_a: _P._Run_Proc_Conf = p_args as _P._Run_Proc_Conf;
                    o.log(8, `spawn ${command} `, sub_args, p_a.options);
                    return spawn(command, sub_args, p_a.options);
                }
            }
        };

        call_fn = ({ proc }: { proc: H._Hook_Fn }): Promise<number> => {
            const fn: H.Fn_W_Callback = proc.fn as H.Fn_W_Callback;
            return new Promise((res, rej) => {
                const id = __id();
                Object.assign(this._live_functions, { id });
                // callback/reject
                fn({
                    callback: (code: number) => {
                        o.accent(6, `call_fn callback: ${code}`);
                        if (o.defi(this._live_functions[id])) {
                            delete this._live_functions[id];
                            res(code);
                        }
                    },
                    // file_path: this.last_path_triggered,
                    // next watch trigger will clear live_functions(no cancels)
                    fail: (err: Error) => {
                        delete this._live_functions[id];
                        rej(err);
                    },
                });
            });
        };

        call_exec_fn = ({ proc, trigger_file_path }: H._Hook_Exec_Args): Promise<number> => {
            return new Promise((res, rej) => {
                if (!trigger_file_path) {
                    o.errata(`exec_fn is not built to run without on_watch set`);
                    rej();
                }
                const fn: H.Exec_Hook_Args = proc.fn as H.Exec_Hook_Args;
                const id = __id();
                Object.assign(this._live_functions, { id });
                // callback/reject
                const sub_done = (pid: str) => () => {
                    this.cleanup(pid);
                    // WIP
                    if (o.defi(this._live_functions[id])) {
                        delete this._live_functions[id];
                    }
                    res(0);
                };
                fn({
                    callback: ({ command }: H.Exec_Light) => {
                        const label = `Light exec callback - ${command}`;
                        const new_child_process = exec(command);
                        this._proc_util.setup_subproc({
                            sub_proc: new_child_process,
                            label,
                            silence: proc.silence,
                            on_close: sub_done(new_child_process.pid),
                        });
                        o.accent(5, `Light exec callback setup: ${label}`);
                    },
                    file_path: trigger_file_path,
                    // next watch trigger will clear live_functions(no cancels)
                    // WIP
                    fail: (err: Error) => {
                        delete this._live_functions[id];
                        rej(err);
                    },
                });
            });
        };

        chain_next = async ({ code, proc, chain_option, chain_id }: _Chain_Next_Args) => {
            if (!o.defi(chain_option)) return;
            o.forky(8, `~ TOC ~`); // SNARE... haha

            if (chain_option !== "success" || code === 0) {
                // if err & not last
                if (code && this._step_procs.length) {
                    const err = `Consider adding {chain_exit: "success"} to proc: ${proc._sidecar.label} to halt on error`;
                    o.errata(1, err);
                }
                // short post exit delay, TODO actually necessary for safe log flush?
                await o.wait(this.kill_delay);

                if (this._tubed !== chain_id) return;
                if (o.defi(proc.chain_next)) this.set_range(proc.chain_next);
                // pass same chain_id to next
                await this.prerun_checks({ chain_id, sub_proc: true });
            } else {
                o.errata(
                    `proc: ${proc._sidecar.label} did not succeed with code: ${code}, execution stopped`,
                );
            }
        };

        // no terminations
        cleanup = (pid: str) => {
            o.accent(9, `cleanup pid:${pid}`);
            const str_pid = "" + pid;
            let to_remove: { [k: string]: true } = {};
            for (const k of Object.keys(this._proc_manifest)) {
                o.accent(9, `cleanup check k:${k}`);
                // cause thats what it is...
                if (k == pid) {
                    o.accent(9, `cleanup match e_pid:${str_pid}`);
                    to_remove[k] = true;
                    delete this._proc_manifest[k];
                } else if (this._proc_manifest[k].killed) {
                    to_remove[k] = true;
                    delete this._proc_manifest[k];
                }
            }
            o.accent(9, `cleanup remove arr:`, to_remove);
            this._root_pids = this._root_pids.reduce((new_pids, a_pid: str) => {
                if (!to_remove[a_pid]) new_pids.push(a_pid);
                else o.accent(9, `cleanup purged pid:${a_pid}`);
                return new_pids;
            }, []);
            this.terminate_check();
            o.accent(9, `cleanup on exit is completed. r:${this._root_pids.length}`);
        };

        // Not sure if what mixture of clever and dumb this may get us into, when trued
        // TODO concurrently with hooks, needs some rumination
        concurrently = async (proc_: _P._Proc, chain_id: str) => {
            if (!this._proc_util.is_fn_proc(proc_)) {
                const proc = proc_ as _P._Proc_W_Conf;
                if (proc.delay) await o.wait(proc.delay);
                if (this._tubed !== chain_id) return;
                proc.trap && this.trap(chain_id); // syncronously

                // note this is not the proc with _conc, but _conc itself
                o.accent(8, `Starting _conc proc: ${proc._sidecar.label}`);
                const sub_proc = this.run_node_proc(proc.construct, proc._sidecar, true);
                this._proc_util.setup_subproc({
                    sub_proc,
                    label: proc_._sidecar.label,
                    silence: proc_._sidecar.silence,
                    on_close: () => this.cleanup("" + sub_proc.pid),
                });
                // this is yet another _conc
                if (proc._conc) {
                    await this.concurrently(proc._conc, chain_id);
                }
            }
        };

        terminate_check = () => {
            if (!this.has_trigger() && !this._step_procs?.length) {
                if (!this._root_pids.length) {
                    this.die();
                }
            }
        };

        // `exec` with no follow up proc (good for dev-server w/watch server of it's own)
        trap = (id: str) => {
            this._watch?.watches_clear();
            this.watch = null;
            this._tubed = id; // also enforce precidence if another watch simul.
            // enforced no triggers after .terminate_check() die()
            this.procs = null;
            this._step_procs = null;
        };

        // note watchers has a direct link to this restart
        restart = async (file_path: str, trigger_index: number) => {
            o.errata(9, `restart, triggered by file_path: ${file_path}`);
            o.errata(9, `restart, trigger_index: ${trigger_index}`);
            const tubed = (this._tubed = __id());
            o.accent(5, `restart -> | [_kill_] | -> start`);
            await this.kill_all();
            await o.wait(this.kill_delay);
            o.accent(5, `restart -> kill -> | [_start_] |`);
            await this.prerun_checks({
                chain_id: tubed,
                direct_trigger: true,
                ...(file_path && { trigger_file_path: file_path }),
                trigger_index,
            });
        };

        kill_all = async () => {
            this._live_functions = {};
            // TODO how can a proc be dead if not closed? (hygiene imp.)
            // const r_pids = this._root_pids.map((p) => p.pid);

            // FYI kill_all is fairly noisy now,
            // the logging is only on if set specifically to DEBUG_FTR.KILL
            await this._proc_util.kill_all(this._root_pids, this._proc_manifest);
            this._proc_manifest = {};
            this._root_pids = [];
        };
        has_trigger = () => {
            return o.defi(this.trigger_index) || this.trigger_indices?.length;
        };

        // terminate server, sync because stdout overflows otherwise
        die = () => {
            // let zombie = false;
            o.forky(6, "Server.die() called, terminating any running");
            this._tubed = __id();
            // this._tube_lock = true;
            this.procs = null;
            // const kill_please =
            const killer = this.kill_all().catch((err) => {
                o.forky(`Server.die() | Kill all threw, err: ${err}`);
            });
            // const watch_clear =
            this._watch
                ?.watches_clear()
                .catch((err) => {
                    o.forky(`Server.die() | watches_clear() threw, err: ${err}`);
                })
                .finally(async () => {
                    await killer;
                    process.exit();
                });
            this.watch = null;
            o.forky("Server.die() | Kill signals and watch clears initiated -> Exit");
            // setTimeout(() => {
            //     if (!zombie) {
            //         o.log("shutting down hung -> exit anyway");
            //         process.exit();
            //     }
            // }, max_term_delay);
        };
        set_sigterm = () => {
            const dis = this;
            process.on("SIGINT", async () => {
                await dis.die();
            });
            process.on("SIGTERM", async () => {
                await dis.die();
            });
        };
    }
    return new Server_Concrete_Class(args);
};

// Server internal method interfacing
interface _Chain_Next_Args {
    code: number;
    proc: _P._Proc; // just completed one
    chain_option: _P._Proc["chain_exit"];
    chain_id: str;
}
interface _Precheck_Args {
    direct_trigger?: true;
    chain_id: str;
    sub_proc?: true;
    trigger_file_path?: str;
    trigger_index?: number;
}
interface _Prepare_Args {
    proc: _P._Proc;
    chain_id: str;
    trigger_file_path?: str;
}
interface _Run_Wrapper_Args {
    proc: _P._Proc;
    // undefined only in first chain, starts from the constructor
    trigger_file_path?: str;
    sub_proc?: true;
}
interface _Run_Wrapper_Return {
    // normal proc (.pid !defi for fail)
    p?: ChildProcess;
    // where 0=success, otherwise a virtual exit code
    f?: Promise<number>;
    // emulates exit code behavior, for repeater proc chains
    r?: Promise<number>;
}
module.exports = Server;
