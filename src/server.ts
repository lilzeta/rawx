/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import * as child_process from "child_process";
import { ChildProcess } from "child_process";
import { setTimeout as wait } from "timers/promises";
import fs from "fs";
import t_kill from "tree-kill";
import { v4 as __id } from "uuid";
import { Server_Args, Proc_Type_Or_Fn, Fn_W_Callback } from "./interface.js";
import { Num_Keyed, str, Silencer } from "./interface.js";
import { Ops, simple_clean, IO } from "./util/ops.js";
import { Server_Construct, _Proc } from "./server_construct.js";

export type Server = (args: Server_Args) => Server_Construct;
// Proxy `new Server(args)` calls through a convenience closure for->(o.)
export const Server: Server = (args: Server_Args) => {
    // set in constructor
    let o: Ops;
    /**
     * Note all class vars moved to Server_Construct, this file is runtime relevant
     */
    class Server extends Server_Construct {
        constructor(args: Server_Args) {
            super(args);
            // Experimental feature mostly for internal use
            if (this.defi(args.override_trigger)) {
                this.restart = async (file_path: str) => {
                    await this.kill_all();
                    await wait(this.kill_delay);
                    if (o.defi(this.trigger_index)) {
                        this.set_range(this.trigger_index);
                        this.step_procs = [...this.range_cache];
                    }
                    args.override_trigger(file_path);
                };
            }
            super.setup_watch({
                trigger: this.restart,
                watch: args.watch,
                parent_colors: args.colors,
            });
            // An Env Configured Ops rebased for `Server`
            o = this.ops.ops_with_conf({
                colors: args.colors,
                debug: this.debug,
                label: this.label,
            });

            if (this.defi(this.trigger_index)) {
                this.set_range(this.trigger_index);
            }

            if (args.sig !== "handled") this.set_sigterm();
            this.tubed = __id();
            // prepare first proc, run if no on_watch then run
            this.prepare_run({ chain_id: this.tubed }).catch();

            if (args.sig !== "handled") this.set_sigterm();
            o.lightly(7, `constructor completed`);
        }

        // lets keep this syncronous
        run_process = (
            { type, command, args = [], options = {}, shell }: _Run_Proc_Args,
            proc: _Proc,
            _subproc?: true,
        ): ChildProcess => {
            // https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
            let new_child_process;
            let arg_s = args.length ? ` ${args.join(" ")}` : "";
            if (type === "exec") {
                new_child_process = child_process.exec(`${command}${arg_s}`, options);
            } else {
                let opt_plus: _Options_Plus = {
                    ...options,
                    ...(shell && { shell }),
                };
                if (type === "execFile") {
                    new_child_process = child_process.execFile(`${command}${arg_s}`, opt_plus);
                } else if (type === "spawn") {
                    new_child_process = child_process.spawn(`${command}${arg_s}`, opt_plus);
                } else if (type === "fork") {
                    new_child_process = child_process.fork(`${command}${arg_s}`, opt_plus);
                }
            }
            if (new_child_process) {
                this.running.push(new_child_process);
                this._setup_subproc({
                    sub_proc: new_child_process,
                    label: proc.label,
                    silence: proc.silence,
                    on_close: (pid: number) => this.flush_clean_exits(pid),
                });
            }
            return new_child_process;
        };

        // lets keep this syncronous
        call_fn = async ({ command, proc, chain_option, chain_id }: _Run_Fn_Args) => {
            return new Promise((res, rej) => {
                if (typeof command !== "function") {
                    throw new Error("proc.fn command is not a function");
                } else {
                    const id = __id();
                    Object.assign(this.live_functions, { id });
                    // callback/reject
                    command({
                        callback: (code: number) => {
                            o.lightly(5, `call_fn callback: ${code}`);
                            if (this.defi(this.live_functions[id])) {
                                delete this.live_functions[id];
                                res(code);
                                this.chain_next({
                                    code,
                                    last_proc: proc,
                                    chain_option,
                                    chain_id,
                                });
                            }
                        },
                        path: this.last_path_triggered,
                        // next watch trigger will clear live_functions(no cancels)
                        fail: (err: Error) => {
                            delete this.live_functions[id];
                            rej(err);
                        },
                    });
                }
            });
        };

        // runs the trap (around start)
        prepare_run = async ({ chain_id, direct_trigger, sub_proc }: _Prepare_Args) => {
            if (!direct_trigger && this.tubed && this.tubed !== chain_id) return;
            const proc = this.proc_from_stack(direct_trigger);
            // the proc.belay_for_watch type returns once
            if (proc === "wait") return;
            if (!proc) {
                if (!this.step_procs?.length && !o.defi(this.trigger_index)) {
                    o.forky(2, `no procs & no trigger_index -> die()`);
                    this.die();
                }
                return;
            }
            // this.tubed = id;
            if (proc.delay) await wait(proc.delay);

            // if another watch has retriggered do nothing/return
            if (this.tubed !== chain_id) return;

            o.forky(9, "proc:");
            o.forky(9, o.pretty(proc));

            let { type, command, if_file_dne, on_file_exists } = proc;
            let { chain_exit, trap, concurrently } = proc;

            // shouldn't get a warn if type-safe? - fatal
            if (!type || !command) {
                const err = `Server [142] - type && command missing, Fatal proc: ${o.pretty(proc)}`;
                o.errata(1, err);
                this.die();
                return;
            }

            // if proc.trap -> last <Server_Proc> - a one shot proc so remove watchers -> run command
            trap && this.trap(chain_id); // syncronously

            // syncronously, ignoring result
            if (concurrently) {
                const conc_proc = concurrently;
                this.concurrently(conc_proc, chain_id).catch();
            }

            // start the server - this is the place that child-process[...](...) so the catch should be any
            try {
                o.forky(chain_exit ? 8 : 999, `~ TIC ~`); // KICK...

                let cool;
                if (if_file_dne?.length) {
                    if (fs.existsSync(if_file_dne)) {
                        o.errata(10, `File Exists`);
                        if (proc.silence !== "all") {
                            o.forky(2, `<child-process/> File Exists - ${proc.label}`);
                        }
                        if (this.defi(on_file_exists)) {
                            o.forky(2, `<child-process/> Setting Next Proc: ${on_file_exists}`);
                            this.set_range(on_file_exists);
                        }
                        // very weird if this next line is needed
                        this.terminate_check();

                        // don't need to run self here

                        if (chain_exit) {
                            o.errata(10, `File Exists, Next`);
                            this.chain_next({
                                code: 0,
                                last_proc: proc,
                                chain_option: chain_exit,
                                chain_id,
                            });
                        }
                        return;
                    } else {
                        if (proc.silence !== "all") {
                            o.forky(2, `<child-process>  _// start File DNE Exist - ${proc.label}`);
                        }
                    }
                } else {
                    if (proc.silence !== "all") {
                        o.forky(2, `<child-process> _// start - ${proc.label}`);
                    }
                }
                if (type === "fn") {
                    await this.call_fn({ command, proc, chain_option: chain_exit, chain_id });
                    if (this.tubed !== chain_id) return;
                } else {
                    cool = this.run_process(this.create_run_args_from_proc(proc), proc, sub_proc);
                }

                if (chain_exit) {
                    cool.once("exit", async (code: number) => {
                        this.terminate_check();
                        this.chain_next({
                            code,
                            last_proc: proc,
                            chain_option: chain_exit,
                            chain_id,
                        });
                    });
                } else {
                    cool.once("exit", async (_) => {
                        this.terminate_check();
                    });
                }
            } catch (err) {
                // TODO? a chaperone timer to prevent a watch_death -> catch (err) -> watch_death loop

                if (o.defi(this.trigger_index)) {
                    this.kill_all().catch(); // but for now, force all processes to be catch responsible
                    o.errata(
                        1,
                        `Server | uncaught error -> chain will restart to trigger_index: ${err}`,
                    );
                    await wait(this.kill_delay);
                } else {
                    o.errata(1, `Server | uncaught throw -> no trigger_index, exiting: ${err}`);
                    this.die();
                }
            }
        };

        proc_from_stack(trigger = false): _Proc | "wait" {
            if (trigger && o.defi(this.trigger_index)) {
                this.set_range(this.trigger_index);
                this.step_procs = [...this.range_cache];
            }
            let procs = this.step_procs;
            o.lightly(10, `proc_from_stack procs:`);
            o.lightly(10, procs);

            // Will die() in parent start_proc() if no trigger_index
            if (!procs?.length) {
                return;
            }
            let dis: _Proc;
            dis = procs[0];

            // Assuming that we reach dis by popping last || being the first || only proc
            if (dis.on_watch && !trigger) return "wait";
            // note: procs.shift === dis
            return this.step_procs.shift();
        }

        async chain_next({ code, last_proc, chain_option, chain_id }: Chain_Next_Args) {
            if (!this.defi(chain_option)) return;
            o.forky(8, `~ TOC ~`); // SNARE... haha

            if (chain_option !== "success" || code === 0) {
                // if err & not last
                if (code && this.step_procs.length) {
                    const err = `Consider adding {chain_exit: "success"} to proc: ${last_proc.label} to halt on error`;
                    o.errata(1, err);
                }
                // short post exit delay, TODO actually necessary for safe log flush?
                await wait(this.kill_delay);

                // pass same chain_id to next on chain_exit
                await this.prepare_run({ chain_id, sub_proc: true });
            } else {
                o.errata(
                    1,
                    `proc: ${last_proc.label} did not succeed with code: ${code}, execution stopped`,
                );
            }
            if (last_proc.if_file_dne && !this.defi(this.trigger_index)) {
                o.errata(
                    4,
                    `Likely you want to set trigger_index or proc failure will not run proc`,
                );
            }
        }

        flush_clean_exits(pid: number) {
            let remove_i: Num_Keyed = {};
            for (let i = 0; i < this.running.length; i++) {
                if (this.running[i].pid === pid) Object.assign(remove_i, { i: true });
                else if (this.running[i].killed) Object.assign(remove_i, { i: true });
            }
            this.running = this.running.reduce((new_r, dis, i) => {
                !remove_i[i] && new_r.push(dis);
                return new_r;
            }, []);
            this.terminate_check();
        }

        // Not sure if what mixture of clever and dumb this may get us into, when trued
        async concurrently(proc: _Proc, chain_id: str) {
            if (proc.delay) await wait(proc.delay);
            if (this.tubed !== chain_id) return;
            proc.trap && this.trap(chain_id); // syncronously
            this.run_process(this.create_run_args_from_proc(proc), proc, true);
            if (proc.concurrently) {
                await this.concurrently(proc.concurrently, chain_id);
            }
        }

        terminate_check() {
            if (!o.defi(this.trigger_index) && !this.step_procs?.length) {
                this.die();
            }
        }

        // `exec` with no follow up proc (good for dev-server w/watch server of it's own)
        trap(id: str) {
            this.watchers?.watches_clear();
            this.watchers = null;
            this.tubed = id; // also enforce precidence if another watch simul.
            // enforced no triggers after .terminate_check() die()
            this.procs = null;
            this.step_procs = null;
        }

        // WIP
        // watch_trigger_proxy = async () => {
        //     await this.restart();
        // }; // watchFile can check on unwatch if fn matches the unwatch arg b4 unwatch TODO?

        // note watchers has a direct link to this restart
        restart = async (file_path: str) => {
            this.last_path_triggered = file_path;
            o.lightly(7, `restart -> | [_kill_] | -> start`);
            await this.kill_all();
            await wait(this.kill_delay);
            o.lightly(7, `restart -> kill -> | [_start_] |`);
            await this.prepare_run({
                ...((this.tubed = __id()) && { chain_id: this.tubed }),
                direct_trigger: true,
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
                                t_kill(this_running[i].pid, "SIGKILL", (err) => {
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

        // There isn't an elegant module for this, it's half Ops/half proc runtime
        // Used after each subproc starts, may move this to another class
        _setup_subproc = ({ sub_proc, silence, on_close }: Setup_Proc_Args) => {
            let jiggler;
            const colors = o.colors;
            // No <-> deco on normal stdout/stderr - color passthrough
            if (!silence) {
                let sub_passthrough: IO;
                // no label for proc std_out
                if (o.colors.default?.length) sub_passthrough = () => o.stdout(colors.default);
                let post = o.post({ is_defi_IO: sub_passthrough });
                sub_proc.stdout.on("data", (data) => {
                    if ((jiggler = simple_clean(data)).length) {
                        sub_passthrough?.();
                        o.stdout(jiggler);
                        post?.();
                    }
                });
            }

            if (silence !== "all" && o.debug) {
                let err_sub_passthrough: IO;
                // no label for proc std_out
                if (colors.errata?.length) err_sub_passthrough = () => o.stdout(colors.errata);
                let err_post = o.post({ is_defi_IO: err_sub_passthrough });
                sub_proc.stderr.on("data", (data) => {
                    if ((jiggler = simple_clean(data)).length) {
                        err_sub_passthrough?.();
                        console.log(jiggler);
                        err_post?.();
                    }
                });
                // let forky_sub_passthrough: IO;
                // no label for proc std_out
                // if (colors.forky?.length)
                //     forky_sub_passthrough = o.prefix({
                //         label: o.label,
                //         color: colors["label"],
                //         fleck: colors["fleck"],
                //         main_color: colors["forky"],
                //     });
                sub_proc.on("close", (code) => {
                    // With named label
                    if (o.debug) {
                        // this.stdout(o.colors.forky);
                        o.forky(2, `</child-process> \\\\_ closed w/code: ${code}`);
                    }
                    on_close(sub_proc.pid);
                });
            }
        }; // kind

        // is_hashed = (id: str): boolean => {
        //     return this.hash[id] !== undefined;
        // };

        create_run_args_from_proc({ type, command, ...opts }: _Proc): _Run_Proc_Args {
            const { args, cwd, shell, delay, silence } = opts;
            command = command as str;
            return {
                type,
                command,
                args,
                ...((cwd || shell) && {
                    options: {
                        ...(cwd && { cwd }),
                        ...(shell && { shell }),
                        ...(delay && { delay }),
                        ...(silence && { silence }),
                    },
                }),
            };
        } // i used to hate js, propogating deconstructors - so clutch

        // terminate server, sync
        die() {
            o.forky(6, `Server.die() called, terminating any running`);
            this.tubed = __id();
            this.tube_lock = true;
            this.procs = null;
            this.kill_all().catch(); // No await, because no waiting to complete
            try {
                // if trap didn't clear already
                this.watchers?.watches_clear();
                this.watchers = null;
            } catch (err) {
                o.errata(1, `Server.die() | this.watchers?.watches_clear(); | THROWN ERROR `);
            }
            o.forky(1, `Server.die() | Kill done, watches_clear - Exit`);
            // TODO test removing POST_KILL_DELAY uses (std_out courtesy for kill())
            setTimeout(() => {
                // WIP line# flags
                // o._l(1, `Server.die() [__L], shutting down complete -> exit`);
                o._l(1, `Server.die(), shutting down complete -> exit`);
                process.exit();
            }, this.kill_delay);
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
    return new Server(args);
};
interface Chain_Next_Args {
    code: number;
    last_proc: _Proc;
    chain_option: _Proc["chain_exit"];
    chain_id: str;
}
// export type Set_Proc_Callbacks = (args: Setup_Proc_Args) => void;
interface Setup_Proc_Args {
    sub_proc: ChildProcess;
    label: str;
    silence?: Silencer;
    on_close: (pid: number) => void;
}
interface _Prepare_Args {
    chain_id: str;
    direct_trigger?: true;
    sub_proc?: true;
}
interface _Options {
    cwd?: str;
    delay?: number;
}
interface _Options_Plus extends _Options {
    shell?: true;
}
interface _Run_Proc_Args {
    type: Proc_Type_Or_Fn;
    command: str;
    args?: Array<str>;
    options?: _Options;
    shell?: true;
}

interface _Run_Fn_Args {
    command: Fn_W_Callback | str;
    proc: _Proc;
    chain_option: _Proc["chain_exit"];
    chain_id: str;
}

// a convenience function for Server node.js files, if one is desired
export function npm_build() {
    // https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
    return child_process.exec("npm run build", (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

// `is called like Server(args)` with no new keyword
export default Server;
