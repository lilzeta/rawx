/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import * as child_process from "child_process";
import { ChildProcess } from "child_process";
import { setTimeout as wait } from "timers/promises";
import t_kill from "tree-kill";
import { Watchers, Watchers_Abstract } from "./watchers";
import { Server_Args, Proc_Args, Proc_Type } from "./interface";
import { Proc, Num_Keyed, str, Debug } from "./interface";
import { v4 as __id } from "uuid";
import { Ops_Generator, Ops } from "./util/ops";

// Simple class proxy for exporting bypassing the private typedef closure
abstract class Server_Abstract {
    constructor(_args: Server_Args) {}
}

export type Server = (args: Server_Args) => Server_Abstract;
// Proxy `new Server(args)` calls through a convenience closure ->(o.)
export const Server: Server = (args: Server_Args) => {
    // set in constructor
    let o: Ops;

    // Core is logging and utilities
    class Server implements Server_Abstract {
        debug: Debug = 2;
        procs: Array<_Proc>; // used to reset stack if trigger_index
        step_procs: Array<_Proc>; // used as current stack
        range_cache: Array<_Proc>;
        last_range_at: number; // is the last range cache valid?
        watch: Array<str>;
        watch_ignore: RegExp;
        watchers: Watchers_Abstract;
        trigger_index?: number;
        // uuid of the most recent chain
        tubed?: str = undefined;
        // still incomplete feature
        tube_lock?: true;
        running?: Array<ChildProcess> = [];
        // aka wait for port to clear
        kill_delay = 3000; // in ms
        // pulse: {
        //     // WIP chaperone (~watch dist oops)
        //     last_stamps: Array<number>;
        // };
        // hash: any = {};
        constructor(args: Server_Args) {
            const { name, watch, colors, ...opts } = args;
            let label = "";
            if (name?.length) label = `${name}|Server`;
            if (opts.debug !== undefined) {
                // it's outside the class for some reason, WIP logging support module
                this.debug = opts.debug;
            }
            const ops = new Ops_Generator({ log_ignore: opts.log_ignore });
            o = ops.ops_with_conf({ colors, debug: this.debug, label });

            let { procs, proc } = opts;
            const trigger_index = watch?.trigger_index;
            if (o.defi(opts.kill_delay)) {
                if (typeof opts.kill_delay === "number") {
                    // o.lightly(1, "" + opts.kill_delay);
                    this.kill_delay = opts.kill_delay;
                } else {
                    throw new Error("Use a number type to pass kill_delay.");
                }
            }

            this.setup_procs({ procs, proc, trigger_index });
            this.tubed = __id();
            // start first proc right away
            this.prepare_run({ chain_id: this.tubed }).catch();
            if (watch?.paths?.length) {
                this.watchers = Watchers({
                    ops,
                    trigger: this.watch_trigger_proxy,
                    name,
                    debug: this.debug, // overridden if watch.debug
                    colors,
                    ...(watch && {
                        ...watch,
                    }),
                    // note not passing this causes inconsistencies, rather share LogIt...
                });
            }
            if (opts.sig !== "handled") this.set_sigterm();
            o.lightly(7, `constructor completed`);
        }

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

        // runs the trap (around start)
        prepare_run = async ({ chain_id, direct_trigger, sub_proc }: Prepare_Args) => {
            if (!direct_trigger && this.tubed && this.tubed !== chain_id) return;
            const proc = this.proc_from_stack(direct_trigger);
            // the proc.belay_for_watch type returns once
            if (proc === "wait") return;
            if (!proc) {
                if (!this.step_procs?.length && !o.defi(this.trigger_index)) {
                    o.forky(2, `no procs no trigger_index -> die()`);
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

            let { type, command } = proc;
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

            // start the server - this is the place that child-process[...](...) so the catch should be any
            try {
                o.forky(chain_exit ? 8 : 999, `~ TIC ~`); // KICK...
                if (proc.silence !== "all") {
                    o.forky(1, `<child-process> _// start - ${proc.label}`);
                }
                // syncronously, subproc is false if ! in chain-exit
                const cool = this.run(this.create_run_args_from_proc(proc), proc, sub_proc);

                // syncronously
                if (concurrently) {
                    const conc_proc = concurrently;
                    this.concurrently(conc_proc, chain_id).catch();
                }

                if (chain_exit) {
                    // until build is done or whatever proc.command is
                    cool.once("exit", async (code: number) => {
                        o.forky(8, `~ TOC ~`); // SNARE... haha
                        // we may be finished
                        this.terminate_check();

                        if (chain_exit !== "success" || code === 0) {
                            if (code) {
                                const err = `Consider adding {chain_exit: "success"} to proc: ${proc.label} to halt on error`;
                                o.errata(1, err);
                            }
                            // short post exit delay, TODO actually necessary for safe log flush?
                            await wait(this.kill_delay);

                            // pass same id to next on chain_exit
                            await this.prepare_run({ chain_id, sub_proc: true });
                        } else {
                            o.errata(
                                1,
                                `proc: ${proc.label} did not succeed with code: ${code}, execution stopped`,
                            );
                        }
                    });
                } else {
                    cool.once("exit", async (_) => {
                        this.terminate_check();
                    });
                }
            } catch (err) {
                o.errata(1, `Server | uncaught error -> fatal: ${err}`);

                // TODO? a chaperone timer to prevent a watch_death -> catch (err) -> watch_death loop
                this.kill_all().catch(); // but for now, force all processes to be catch responsible
            }
        };

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
        }

        // Not sure if what mixture of clever and dumb this may get us into, when trued
        async concurrently(proc: _Proc, chain_id: str) {
            if (proc.delay) await wait(proc.delay);
            if (this.tubed !== chain_id) return;
            proc.trap && this.trap(chain_id); // syncronously
            this.run(this.create_run_args_from_proc(proc), proc, true);
            if (proc.concurrently) {
                await this.concurrently(proc.concurrently, chain_id);
            }
        }

        // lets keep this syncronous
        run = (
            { type, command, args = [], options = {}, shell }: Run_Proc_Args,
            proc: _Proc,
            _subproc?: true,
        ): ChildProcess => {
            // https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback
            let new_child_process;
            let arg_s = args.length ? ` ${args.join(" ")}` : "";
            if (type === "exec") {
                new_child_process = child_process.exec(`${command}${arg_s}`, options);
            } else {
                let opt_plus: Options_Plus = {
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
                o.set_logging_etc_c_proc({
                    c_proc: new_child_process,
                    label: proc.label,
                    silence: proc.silence,
                    env_module: o,
                    on_close: (pid: number) => this.flush_clean_exits(pid),
                });
            }
            return new_child_process;
        };

        terminate_check() {
            if (!o.defi(this.trigger_index) && !this.step_procs?.length) {
                this.die();
            }
            // else this.flush_clean_exits(c_proc.pid);
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
        watch_trigger_proxy = async () => {
            await this.restart();
        }; // watchFile can check on unwatch if fn matches the unwatch arg b4 unwatch TODO?

        // note watchers has a direct link to this restart
        restart = async () => {
            o.lightly(7, `restart -> | [_kill_] | -> start`);
            await this.kill_all();
            await wait(this.kill_delay);
            o.lightly(7, `restart -> kill -> | [_start_] |`);
            await this.prepare_run({
                ...((this.tubed = __id()) && { chain_id: this.tubed }),
                direct_trigger: true,
            });
        };

        set_range(at: number) {
            if (at === this.last_range_at) return;
            this.range_cache = [];
            for (let i = at; i < this.procs.length; i++) this.range_cache.push(this.procs[i]);
            this.last_range_at = at;
        }

        kill_all = async (): Promise<void[]> => {
            const inner_promises: Array<Promise<void>> = [];
            const this_running = this.running;
            const run_c = this_running.length;
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

        // is_hashed = (id: str): boolean => {
        //     return this.hash[id] !== undefined;
        // };

        create_run_args_from_proc({ type, command, ...opts }: Proc): Run_Proc_Args {
            const { args, cwd, shell, delay, silence } = opts;
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

        // proc becomes this.procs=[proc] ... &some sensible checks
        setup_procs({ procs: in_procs, proc: in_proc, trigger_index }: Proc_Setup) {
            let procs: Array<Proc>;
            if (o.defi(in_procs)) {
                if (o.defi(in_proc)) throw new Error(`Server accepts only one of procs or proc.`);
                if (Array.isArray(in_procs)) {
                    procs = in_procs;
                } else {
                    procs = [in_procs];
                }
            } else {
                if (Array.isArray(in_proc)) {
                    // throw new Error(`use {procs:...} if using an array of procs`);
                    procs = in_proc;
                }
                procs = [in_proc as Proc];
            }

            if (!procs.length)
                throw new Error(`Server requires one of procs or proc, to contain a proc.`);
            if (o.defi(trigger_index) && trigger_index > procs.length)
                throw new Error(`trigger_index must not be larger than procs size.`);
            this.trigger_index = trigger_index;
            // disallow circularly concurrent chain, edit source if you a bold one _lol`
            const and_no_turtles = (proc: Proc | _Proc): _Proc | undefined => {
                if ((proc as _Proc).proc_id) return undefined;
                let coerced: _Proc = Object.assign(proc, {
                    proc_id: __id(),
                    label: `[${proc.type}](${proc.command}...)`,
                    ...(proc.concurrent && {
                        concurrently: and_no_turtles(proc.concurrent),
                    }),
                });
                // internal only chrono (Todo whats this called? a ~tic/toc er)
                // if (coerced.on_watch) coerced.on_watch = true;
                return coerced;
            };
            this.procs = [];
            let jiggler;
            for (let proc of procs) {
                (jiggler = and_no_turtles(proc)) && this.procs.push(jiggler);
            }
            this.step_procs = [...this.procs]; // Shallow clone so flash proc changes {...}
            if (o.defi(trigger_index)) {
                this.set_range(trigger_index);
            }
        }

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
interface _Proc extends Proc {
    belay?: true;
    proc_id: str;
    concurrently: _Proc;
    label: str;
}
interface Proc_Setup {
    procs?: Proc_Args;
    proc?: Proc_Args;
    trigger_index?: number;
}
interface Prepare_Args {
    chain_id: str;
    direct_trigger?: true;
    sub_proc?: true;
}
export interface Options {
    cwd?: str;
    delay?: number;
}
export interface Options_Plus extends Options {
    shell?: true;
}

export interface Run_Proc_Args {
    type: Proc_Type;
    command: str;
    args?: Array<str>;
    options?: Options;
    shell?: true;
}

// a convenience function for Server node.js files, if one is desired
export function npm_build() {
    return child_process.exec("npm run build");
}

// `is called like Server(args)` with no new keyword
export default Server;
