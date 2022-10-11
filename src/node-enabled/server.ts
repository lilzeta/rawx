/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = Server; Server = _Server inside closure
// External modules/type
const { spawn, fork, exec, execFile } = require("child_process");
const { exists } = require("fs");
const t_kill = require("tree-kill");
const { v4: __id } = require("uuid");
import { ChildProcess } from "child_process";
import { urlToHttpOptions } from "url";
// Internal Modules
import { O, Ops_Gen } from "../ops/index";
import { str } from "../util";
import { P, H, _P } from "./proc_type_defs";
const Ops: Ops_Gen = require("../ops/ops");

import { Server_Args, Server_Struct_Class } from "./server_construct";
const Server_Construct: Server_Struct_Class = require("./server_construct");
/**
 * Note all class vars moved to Server_Construct
 * this file contains runtime methods and is alive till SigTerm or .die()
 * Use Server is Server_Class, signature as a normal class, call with `new Server(args)`
 */
export type Server_Class = new (args: Server_Args) => Server_Struct_Class;
export interface Server_I {
    set_range: (n: number) => void;
    die: () => void;
}
// const Server: Server_Struct_Class = _Server inside closure
const Server: Server_Struct_Class = (() => {
    // set in constructor
    let o: O;

    class _Server extends Server_Construct implements Server_I {
        constructor(args: Server_Args) {
            // Setup our class state using Server_Construct
            super(args);
            // An Env Configured Ops rebased for `Server`
            o = new Ops({
                colors: args.colors,
                debug: this.debug,
                label: this.label,
            });
            if (this.watch) this.watch.set_trigger(this.restart);
            if (args.dry_run) {
                return;
            }

            if (args.sig !== "handled") this.set_sigterm();
            // Set a new chain_id for our first proc
            this.tubed = __id();
            // prepare first proc, if no .on_watch also run
            this.prerun_checks({ chain_id: this.tubed }).catch();
            // TODO test if we need .catch();
            o.accent(7, `constructor completed`);
        }

        prerun_checks = async ({ chain_id, direct_trigger, ...opts }: _Precheck_Args) => {
            const { trigger_file_path, trigger_index } = opts;
            if (!direct_trigger && this.tubed && this.tubed !== chain_id) return;
            let proc_ = this.proc_from_stack({ direct_trigger, trigger_index });
            if (proc_ === "wait") return;
            let proc = proc_ as _P._Proc;
            if (!proc) {
                if (!this.step_procs?.length && !this.has_trigger()) {
                    o.forky(2, `no procs & no trigger_index -> die()`);
                    this.die();
                }
                return;
            }
            // this.tubed = id;
            if (proc.delay) await o.wait(proc.delay);
            // if another watch has retriggered do nothing/return
            if (this.tubed !== chain_id) return;
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

        proc_from_stack({
            direct_trigger = false,
            trigger_index,
        }: {
            direct_trigger?: boolean;
            trigger_index?: number;
        }): _P._Proc | "wait" | undefined {
            if (direct_trigger) {
                if (!o.defi(trigger_index)) {
                    trigger_index = this.trigger_index;
                }
                if (o.defi(trigger_index)) {
                    this.set_range(trigger_index);
                }
            }
            if (!this.step_procs?.length) {
                return;
            }
            if (this.step_procs[0].on_watch && !direct_trigger) return "wait";
            return this.step_procs.shift();
        }

        prepare_run = async ({ proc, chain_id, trigger_file_path }: _Prepare_Args) => {
            o.accent(9, `prepare_run, trigger_file_path?:`);
            o.accent(9, trigger_file_path);
            const { chain_exit, _sidecar } = proc;
            const { run_if_file_dne, goto_on_file_exists } = proc;
            const silence = proc.silence === "all" ? () => 999 : undefined;
            try {
                o.forky(chain_exit ? 8 : 999, `~ TIC ~`); // KICK...
                let cool;
                // TODO this case has some dupe stuff needs fn/promise
                if (run_if_file_dne?.length) {
                    // run_if_file_dne is a filename if it exists
                    try {
                        const f_exists = await exists(run_if_file_dne);
                        if (proc.silence !== "all") {
                            o.forky(
                                silence?.() || 2,
                                `<child-process/> File Exists - ${f_exists} -${_sidecar.label}`,
                            );
                        }
                        if (o.defi(goto_on_file_exists)) {
                            this.set_range(goto_on_file_exists);
                            o.forky(
                                silence?.() || 2,
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
                        o.forky(silence?.() || 9, `File Exist threw - ${_sidecar.label}`);
                    }
                    o.forky(
                        silence?.() || 2,
                        `<child-process>  _// start File DNE Exist - ${_sidecar.label}`,
                    );
                } else {
                    o.forky(silence?.() || 2, `<child-process> _// start - ${_sidecar.label}`);
                }

                cool = this.run_wrapper({ proc, trigger_file_path });

                if (this.tubed !== chain_id) {
                    this.terminate_check();
                    return;
                }

                if (cool) {
                    // If run_process returned a process, TODO typesafe
                    if ((cool as ChildProcess).pid) {
                        cool = cool as ChildProcess;
                        this.running.push(cool);
                        this.proc_util.setup_subproc({
                            sub_proc: cool,
                            label: _sidecar.label,
                            silence: _sidecar.silence,
                            on_close: (pid: number) => this.flush_exits(pid),
                        });
                        if (chain_exit) {
                            cool.once("exit", async (code: number) => {
                                this.terminate_check();
                                this.chain_next({
                                    code,
                                    proc,
                                    chain_option: chain_exit,
                                    chain_id,
                                });
                            });
                        } else {
                            cool.once("exit", async (_) => {
                                this.terminate_check();
                            });
                        }
                    } else {
                        cool = cool as Promise<number>;
                        cool.then((code) => {
                            this.terminate_check();
                            this.chain_next({
                                code,
                                proc,
                                chain_option: chain_exit,
                                chain_id,
                            });
                        }).catch((err: Error) => {
                            o.errata(1, `Hook fn through an error: ${err}`);
                        });
                    }
                }
            } catch (err) {
                // TODO? a chaperone timer to prevent a watch_death -> catch (err) -> watch_death loop
                if (this.has_trigger()) {
                    this.kill_all().catch(); // but for now, force all processes to be catch responsible
                    o.errata(
                        silence?.() || 1,
                        `Server | uncaught error -> chain will restart to trigger_index: ${err}`,
                    );
                    await o.wait(this.kill_delay);
                } else {
                    o.errata(
                        1,
                        `Server | uncaught throw -> no trigger_index, exiting: ${err}`,
                    );
                    this.die();
                }
            }
        };

        // lets keep this syncronous
        run_wrapper = ({
            proc,
            trigger_file_path, // undefined only when chained from constructor
            sub_proc = true,
        }: _Run_Wrapper_Args): ChildProcess | Promise<number> | undefined => {
            const { type } = proc;
            if (this.proc_util.is_fn_proc(proc)) {
                const _proc = proc as H._Hook_Fn;
                if (type === "fn") {
                    return this.call_fn({ proc: _proc }).catch();
                } else if (type === "exec_fn") {
                    return this.call_exec_fn({
                        proc: _proc,
                        trigger_file_path,
                    }).catch();
                }
                return;
            } else {
                const _proc = proc as _P._Proc_W_Conf;
                if (this.proc_util.is_repeater_proc(_proc)) {
                    return this.run_repeater_proc(
                        _proc.construct as _P._Run_Proc_Conf,
                        _proc._sidecar,
                        sub_proc,
                    );
                }
                return this.run_node_proc(_proc.construct, _proc._sidecar, sub_proc);
            }
        };

        run_repeater_proc(
            p_args: _P._Run_Proc_Conf,
            _sidecar: _P._Sidecar,
            _subproc?: true,
        ): Promise<number> {
            return new Promise<number>(async (res) => {
                const { type, command, options } = p_args;
                let sub_args = p_args.args;
                const juke_d: number = _sidecar.silence === "all" ? 999 : 8;
                const rep_args: Array<P.P_Args> = p_args.args as Array<P.P_Args>;
                let repeater_chain = p_args.repeater_chain;
                const subproc = (args: ReadonlyArray<string>): ChildProcess | undefined => {
                    if (type === "execFile") {
                        o.log(
                            juke_d,
                            `execFile ${command} ${o.pretty(sub_args)} ${o.pretty(options)}`,
                        );
                        return execFile(p_args.command, args, options);
                    }
                    if (type === "spawn") {
                        const p_a: _P._Run_Proc_Conf = p_args as _P._Run_Proc_Conf;
                        o.log(
                            juke_d,
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
                    this.proc_util.basic_proc_stdio(c_proc, _sidecar.silence);
                    // o.basic_proc_stdio(c_proc, _sidecar.silence);
                    // TODO this implementation depends on Every c_proc sending an exit or throwing
                    // how incorrect/poorly behaved is this assumption?
                    c_proc?.on("exit", async (code) => {
                        if (code) {
                            if (repeater_chain === "success") {
                                o.errata(1, `repeater chain exitted w/err: ${code}, halting.`);
                                // Is this correct though?
                                res(code);
                                return;
                            } else {
                                o.errata(
                                    1,
                                    `repeater chain exitted w/err: ${code}, w/no repeater_chain: "success" => next`,
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
        }

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
                    o.log(
                        8,
                        `spawn ${command} ${o.pretty(sub_args)} ${o.pretty(p_a.options)}`,
                    );
                    return spawn(command, sub_args, p_a.options);
                }
            }
        };

        call_fn = ({ proc }: { proc: H._Hook_Fn }): Promise<number> => {
            const fn: H.Fn_W_Callback = proc.fn as H.Fn_W_Callback;
            return new Promise((res, rej) => {
                const id = __id();
                Object.assign(this.live_functions, { id });
                // callback/reject
                fn({
                    callback: (code: number) => {
                        o.accent(6, `call_fn callback: ${code}`);
                        if (o.defi(this.live_functions[id])) {
                            delete this.live_functions[id];
                            res(code);
                        }
                    },
                    // file_path: this.last_path_triggered,
                    // next watch trigger will clear live_functions(no cancels)
                    fail: (err: Error) => {
                        delete this.live_functions[id];
                        rej(err);
                    },
                });
            });
        };

        call_exec_fn = ({ proc, trigger_file_path }: H._Hook_Exec_Args): Promise<number> => {
            return new Promise((res, rej) => {
                if (!trigger_file_path) {
                    o.errata(2, `exec_fn is not built to run without on_watch set`);
                    rej();
                }
                const fn: H.Exec_Hook_Args = proc.fn as H.Exec_Hook_Args;
                const id = __id();
                Object.assign(this.live_functions, { id });
                // callback/reject
                const on_close = (pid: number) => {
                    this.flush_exits(pid);
                    // WIP
                    if (o.defi(this.live_functions[id])) {
                        delete this.live_functions[id];
                    }
                    res(0);
                };
                fn({
                    callback: ({ command }: H.Exec_Light) => {
                        const label = `Light exec callback - ${command}`;
                        const new_child_process = exec(command);
                        this.proc_util.setup_subproc({
                            sub_proc: new_child_process,
                            label,
                            silence: proc.silence,
                            on_close,
                        });
                        o.accent(5, `Light exec callback setup: ${label}`);
                    },
                    file_path: trigger_file_path,
                    // next watch trigger will clear live_functions(no cancels)
                    // WIP
                    fail: (err: Error) => {
                        delete this.live_functions[id];
                        rej(err);
                    },
                });
            });
        };

        async chain_next({ code, proc, chain_option, chain_id }: _Chain_Next_Args) {
            if (!o.defi(chain_option)) return;
            o.forky(8, `~ TOC ~`); // SNARE... haha

            if (chain_option !== "success" || code === 0) {
                // if err & not last
                if (code && this.step_procs.length) {
                    const err = `Consider adding {chain_exit: "success"} to proc: ${proc._sidecar.label} to halt on error`;
                    o.errata(1, err);
                }
                // short post exit delay, TODO actually necessary for safe log flush?
                await o.wait(this.kill_delay);

                if (this.tubed !== chain_id) return;
                if (o.defi(proc.chain_next)) this.set_range(proc.chain_next);
                // pass same chain_id to next
                await this.prerun_checks({ chain_id, sub_proc: true });
            } else {
                o.errata(
                    2,
                    `proc: ${proc._sidecar.label} did not succeed with code: ${code}, execution stopped`,
                );
            }
        }

        // TODO better clearing/upkeep/proc checks
        flush_exits(pid: number) {
            // Todo true necessary?
            let remove_i: { [k: number]: any } = {};
            for (let i = 0; i < this.running.length; i++) {
                if (this.running[i].pid === pid) Object.assign(remove_i, { i: true });
                else if (this.running[i].killed) Object.assign(remove_i, { i: true });
            }
            this.running = this.running.reduce(
                (new_r: Array<ChildProcess>, dis: ChildProcess, i: number) => {
                    !remove_i[i] && new_r.push(dis);
                    return new_r;
                },
                [],
            );
            this.terminate_check();
            o.accent(9, `flush_clean_exits is completed. `);
        }

        // Not sure if what mixture of clever and dumb this may get us into, when trued
        // TODO concurrently with hooks, needs some rumination
        async concurrently(proc_: _P._Proc, chain_id: str) {
            if (!this.proc_util.is_fn_proc(proc_)) {
                const proc = proc_ as _P._Proc_W_Conf;
                if (proc.delay) await o.wait(proc.delay);
                if (this.tubed !== chain_id) return;
                proc.trap && this.trap(chain_id); // syncronously

                // note this is not the proc with _conc, but _conc itself
                o.accent(8, `Starting _conc proc: ${proc._sidecar.label}`);
                const sub_proc = this.run_node_proc(proc.construct, proc._sidecar, true);
                this.proc_util.setup_subproc({
                    sub_proc,
                    label: proc_._sidecar.label,
                    silence: proc_._sidecar.silence,
                    on_close: (pid: number) => this.flush_exits(pid),
                });
                // this is yet another _conc
                if (proc._conc) {
                    await this.concurrently(proc._conc, chain_id);
                }
            }
        }

        terminate_check() {
            if (!this.has_trigger() && !this.step_procs?.length) {
                this.die();
            }
        }

        // `exec` with no follow up proc (good for dev-server w/watch server of it's own)
        trap(id: str) {
            this.watch?.watches_clear();
            this.watch = null;
            this.tubed = id; // also enforce precidence if another watch simul.
            // enforced no triggers after .terminate_check() die()
            this.procs = null;
            this.step_procs = null;
        }

        // note watchers has a direct link to this restart
        restart = async (file_path: str, trigger_index: number) => {
            o.errata(9, `restart, triggered by file_path: ${file_path}`);
            o.errata(9, `restart, trigger_index: ${trigger_index}`);
            const tubed = (this.tubed = __id());
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

        kill_all = async (): Promise<void[]> => {
            const inner_promises: Array<Promise<void>> = [];
            const this_running = this.running;
            const run_c = this_running.length;
            this.live_functions = {};
            if (run_c) {
                for (let i = 0; i < run_c; i++) {
                    if (!this_running[i].killed) {
                        inner_promises.push(
                            new Promise((res_, _rej) => {
                                // TODO find way to skip dead this.running[i]
                                t_kill(this_running[i].pid, "SIGKILL", (err: any) => {
                                    // intentionally set above 10
                                    o.errata(11, err); // so noisy
                                    res_(); // no rejecting here on err!
                                });
                            }),
                        );
                    }
                    this.running = [];
                }
            }
            return Promise.all(inner_promises);
        };

        // terminate server, sync
        die() {
            o.forky(6, `Server.die() called, terminating any running`);
            this.tubed = __id();
            this.tube_lock = true;
            this.procs = null;
            this.kill_all().catch(); // No await, because no waiting to complete
            try {
                // if trap didn't clear already
                this.watch?.watches_clear();
                this.watch = null;
            } catch (err) {
                o.errata(1, `Server.die() | this.watchers?.watches_clear(); | THROWN ERROR `);
            }
            o.forky(1, `Server.die() | Kill done, watches_clear - Exit`);
            // TODO test removing POST_KILL_DELAY uses (std_out courtesy for kill())
            setTimeout(() => {
                // WIP line# flags
                // o._l(1, `Server.die() [__L], shutting down complete -> exit`);
                o.log(1, `Server.die(), shutting down complete -> exit`);
                process.exit();
            }, this.kill_delay);
        }
        has_trigger() {
            return o.defi(this.trigger_index) || this.trigger_indices?.length;
        }
        set_sigterm() {
            let log = o.forky;
            const dis = this;
            process.on("SIGINT", function () {
                dis.die();
                log(1, `[L:451], shutting down complete -> exit`);
                process.exit();
            });
        }
    }
    return _Server;
})();
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

// a convenience function for Server node.js files, if one is desired
// function npm_build() {
//     const { exec } = require("child_process");
//     // https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
//     return exec("npm run build", (error: any, stdout: any, stderr: any) => {
//         if (error) {
//             console.error(`exec error: ${error}`);
//             return;
//         }
//         console.log(`stdout: ${stdout}`);
//         console.error(`stderr: ${stderr}`);
//     });
// }

// `is called like Server(args)` with no new keyword
module.exports = Server;
