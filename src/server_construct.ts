/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { ChildProcess } from "child_process";
import { Watch, Watch_Abstract } from "./watch.js";
import { Server_Args, Proc_Args, Flux_Param, Colors } from "./interface.js";
import { Proc, str, Debug } from "./interface.js";
import { v4 as __id } from "uuid";
import { Ops_Generator } from "./util/ops.js";
import Core from "./util/core.js";

// Simple class proxy for exporting bypassing the private typedef closure
// abstract class Server_Abstract {
//     constructor(_args: Server_Args) {}
//     abstract restart: () => void;
// }

// export type Server = (args: Server_Args) => Server_Abstract;
export interface Server_Constructor_Watch_Args {
    trigger: (path: str) => void;
    watch: Server_Args["watch"];
    parent_colors: Colors;
}

// Core is logging and utilities
export abstract class Server_Construct extends Core {
    ops: Ops_Generator;
    debug: Debug = 2;
    name?: str;
    label?: str;
    procs: Array<_Proc>; // used to reset stack if trigger_index
    step_procs: Array<_Proc>; // used as current stack
    range_cache: Array<_Proc>;
    last_range_at: number; // is the last range cache valid?
    watch: Array<str>;
    watch_ignore: RegExp;
    watchers: Watch_Abstract;
    trigger_index?: number;
    last_path_triggered: str;
    // uuid of the most recent chain
    tubed?: str = undefined;
    // still incomplete feature
    tube_lock?: true;
    running?: Array<ChildProcess> = [];
    live_functions: Record<str, str> = {};
    // aka wait for port to clear
    kill_delay = 3000; // in ms
    // yet to determine if we need to allow last proc any log time
    exit_delay = 3000; // in ms
    // pulse: {
    //     // WIP chaperone (~watch dist oops)
    //     last_stamps: Array<number>;
    // };
    // hash: any = {};
    constructor(args: Server_Args) {
        super();
        const { name, watch, colors, ...opts } = args;
        if (name?.length) {
            this.name = name;
            this.label = `${name}|Server`;
        }

        if (opts.debug !== undefined) {
            // it's outside the class for some reason, WIP logging support module
            this.debug = opts.debug;
        }
        this.ops = new Ops_Generator({ log_ignore: opts.log_ignore });

        let { procs, proc } = opts;
        this.trigger_index = opts.trigger_index;
        if (this.defi(opts.kill_delay)) {
            if (typeof opts.kill_delay === "number") {
                // o.lightly(1, "" + opts.kill_delay);
                this.kill_delay = opts.kill_delay;
            } else {
                throw new Error("Use a number type to pass kill_delay.");
            }
        }
        this.setup_procs({ procs, proc, trigger_index: this.trigger_index });
    }

    setup_watch({ trigger, watch, parent_colors }: Server_Constructor_Watch_Args) {
        if (watch?.paths?.length) {
            this.watchers = Watch({
                ops: this.ops,
                paths: watch.paths,
                trigger,
                name: this.name,
                debug: this.debug, // overridden if watch.debug
                ignore: watch.ignore,
                colors: {
                    ...(parent_colors && {
                        ...parent_colors,
                    }),
                },
                ...watch,
                // note not passing ops causes some inconsistencies, rather share
            });
        }
    }

    // proc becomes this.procs=[proc] ... &some sensible checks
    setup_procs({ procs: in_procs, proc: in_proc, trigger_index }: _Initialize_Procs_Args) {
        let procs: Array<Proc>;
        if (this.defi(in_procs)) {
            if (this.defi(in_proc)) throw new Error(`Server accepts only one of procs or proc.`);
            if (Array.isArray(in_procs)) {
                procs = in_procs;
            } else {
                procs = [in_procs];
            }
        } else {
            if (Array.isArray(in_proc)) {
                procs = in_proc;
            }
            procs = [in_proc as Proc];
        }

        if (!procs.length)
            throw new Error(`Server requires one of procs or proc, to contain a proc.`);
        if (this.defi(trigger_index) && trigger_index > procs.length)
            throw new Error(`trigger_index must not be larger than procs size.`);
        this.trigger_index = trigger_index;
        let chain_exit;
        // disallow circularly concurrent chain, edit source if you a bold one _lol`
        const and_no_turtles = (proc: Proc | _Proc): _Proc | undefined => {
            if ((proc as _Proc).proc_id) return undefined;
            let label: str;
            if (typeof proc.command === "function") label = this.pretty(proc.command);
            else label = proc.command;
            let as_internal_Proc: _Proc = Object.assign(proc, {
                proc_id: __id(),
                label: `[${proc.type}](${this.truncate(label, 14)})`,
                ...(proc.concurrent && {
                    concurrently: and_no_turtles(proc.concurrent),
                }),
                ...(this.defi(
                    (chain_exit = this.compound_map_to_arg(
                        chain_exit_allowed,
                        proc.chain_exit,
                        undefined,
                    )),
                ) && { chain_exit }),
            });
            // internal only chrono (Todo whats this called? a ~tic/toc er)
            // if (coerced.on_watch) coerced.on_watch = true;
            return as_internal_Proc;
        };
        this.procs = [];
        let jiggler;
        for (let proc of procs) {
            (jiggler = and_no_turtles(proc)) && this.procs.push(jiggler);
        }
        this.set_range(0);
    }
    // at should be undefined on first call, intentionally
    // Shallow clone so flash proc changes {...}
    set_range(at: number) {
        if (at === this.last_range_at) return;
        this.last_range_at = at;
        this.range_cache = [];
        for (let i = at; i < this.procs.length; i++) this.range_cache.push(this.procs[i]);
        this.step_procs = [...this.range_cache];
    }
}
// local stuff for now, 'experimenting' mode with argmaps like this
const chain_exit_allowed: Array<Flux_Param> = ["success", ["always", true]];
export interface _Proc extends Proc {
    belay?: true;
    proc_id: str;
    concurrently: _Proc;
    label: str;
}
export interface _Initialize_Procs_Args {
    procs?: Proc_Args;
    proc?: Proc_Args;
    trigger_index?: number;
}

// `is called like Server(args)` with no new keyword
export default Server_Construct;
