/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// externals
import { ChildProcess } from "child_process";
import { v4 as __id } from "uuid";
import { format } from "util";
// from self
import { Watch, Watch_Abstract } from "./watch.js";
import { Server_Args, Flux_Param, Color_Targets } from "./types/interface.js";
import { Server_Watch_Arg, Pre_Init_Procs_Arg } from "./types/interface.js";
import { str, Debug } from "./types/interface.js";
// external
import {
    Proc_Arg_Exec,
    Proc_Arg_Def,
    A_Proc_Arg,
    _Proc_W_Conf,
} from "./types/proc_interface.js";
import { Proc_Arg_Fork, Hook_Arg } from "./types/proc_interface.js";
// internal
import { _Proc_Fork, _Proc_Exec, _Proc_Def } from "./types/proc_interface.js";
import { _Run_Proc_Conf, _Proc, _Hook_Fn } from "./types/proc_interface.js";
import { Ops_Gen, Ops } from "./ops/ops.js";
import { Sub_Proc } from "./sub_proc.js";

// set in constructor
let o: Ops;

export const number_mins: Record<str, number> = {
    debug: 0,
    kill_delay: 50,
    exit_delay: 50,
    pulse: 400,
};

const Truncate_Label = 100;
// const Truncate_Label = 60;

// Core is logging and utilities
export abstract class Server_Construct {
    ops: Ops_Gen;
    name: str = "";
    label: str = ""; // Not an arg, name.translated
    debug: Debug = 2;
    // aka wait for port to clear
    kill_delay = 3000; // in ms
    // yet to determine if we need to allow last proc any log time
    exit_delay = 3000; // in ms
    procs: Array<_Proc | _Hook_Fn>; // used to reset stack if trigger_index
    step_procs: Array<_Proc | _Hook_Fn>; // used as current stack
    range_cache: Array<_Proc | _Hook_Fn>;
    last_range_at: number; // is the last range cache valid?

    watch: Watch_Abstract;
    watch_args: Server_Watch_Arg;
    colors: Color_Targets;

    sub_proc: Sub_Proc;

    // These are aliased into Watch for now
    trigger_index?: number;
    trigger_indices?: number[];
    // uuid of the most recent chain
    tubed?: str = undefined;
    // still incomplete feature
    tube_lock?: true;
    running?: Array<ChildProcess> = [];
    live_functions: Record<str, str> = {};
    // likely uncommon first is not 0?
    first_proc: number = 0;
    out?: str;
    // pulse: {
    //     // WIP chaperone (~watch dist oops)
    //     last_stamps: Array<number>;
    // };
    // hash: any = {};
    constructor(args: Server_Args) {
        const { name, watch, colors, ...opts } = args;
        const { trigger_index, trigger_indices } = opts;
        if (args.debug !== undefined) {
            this.debug = args.debug;
        }
        if (args.name?.length) {
            this.name = args.name;
            this.label = `${args.name}|Server`;
        }
        // First global call sets the default cache/base (this is fallback/basis)
        Ops({ log_ignore_reg_repl: opts.log_ignore_reg_repl }); // ignore basis Ops
        // Reuse Generator with full confs
        o = Ops({
            colors: args.colors,
            debug: this.debug,
            label: this.label,
        });

        this.check_valid_and_assign(args);
        let { procs, proc } = opts;
        this.watch_args = watch;
        this.colors = colors;

        this.sub_proc = new Sub_Proc({ inherit_ops: o });

        this.setup_procs({ procs, proc });
        if (watch) {
            this.trigger_index = trigger_index;
            this.trigger_indices = trigger_indices;
            this.validate_triggers();
            this.setup_watch();
        }
        o._l(6, `Server_Construct constructor has completed, without known errors for Server`);
    }
    validate_triggers() {
        if (o.defi(this.trigger_index) && this.trigger_index > this.procs.length)
            throw new Error(`trigger_index must not be larger than procs size.`);
        if (o.defi(this.trigger_indices)) {
            if (this.trigger_index)
                throw new Error(`trigger_index cannot be used with trigger_indices.`);
            const q = "Pass undefined to skip indexes, ";
            // WIP !! complex[0].paths // this.trigger_indices.length
            if (this.watch_args.complex) {
                if (this.watch_args.complex[0].paths.length !== this.trigger_indices.length)
                    throw new Error(
                        `${q}trigger_indices.length must match watch.complex...paths.length.`,
                    );
            } else {
                if (this.watch_args.paths.length !== this.trigger_indices.length) {
                    throw new Error(
                        `${q}trigger_indices.length must match watch.paths.length.`,
                    );
                }
            } // WIP validation
            // throw new Error(`trigger_index must not be larger than procs size.`);
        }
    }

    setup_watch() {
        const watch_args = this.watch_args;
        const parent_colors = this.colors;
        o._l(7, `setup_watch - watch.complex: `);
        o._l(7, watch_args.complex);
        if (watch_args.complex) {
            this.setup_multi_watch();
            return;
        }
        // convert singular to an array
        if (typeof watch_args?.paths === "string") {
            watch_args.paths = [watch_args.paths];
        }
        if (watch_args?.paths?.length) {
            // if(watch.)
            // this.watchers =
            this.watch = Watch({
                paths: watch_args.paths,
                name: this.name,
                debug: this.debug, // overridden if watch.debug
                ...o.puff("colors", (s: str) => s, parent_colors),
                trigger_index: this.trigger_index,
                trigger_indices: this.trigger_indices,
                // as in the Server.watch arg
                ...watch_args,
                // note not passing ops causes some inconsistencies, rather share
            });
        }
    }

    setup_multi_watch() {
        this.watch = Watch({
            name: this.name,
            colors: {
                ...this.colors,
            },
            ...this.watch_args,
        });
    }

    // map proc/procs to arr of _Proc ... &some sensible checks
    setup_procs({ procs: in_procs, proc: in_proc }: Pre_Init_Procs_Arg) {
        let procs: Array<A_Proc_Arg>;
        if (o.defi(in_procs)) {
            if (o.defi(in_proc)) throw new Error(`Server accepts only one of procs or proc.`);
            if (Array.isArray(in_procs)) {
                procs = in_procs;
            } else {
                procs = [in_procs];
            }
        } else {
            if (Array.isArray(in_proc)) {
                procs = in_proc;
            }
            procs = [in_proc as A_Proc_Arg];
        }

        if (!procs.length)
            throw new Error(`Server requires one of procs or proc, to contain a proc.`);

        this.procs = [];
        let jiggler;
        for (let proc of procs) {
            (jiggler = this.no_circular_tree_map(proc)) && this.procs.push(jiggler);
        }
        if (this.first_proc >= this.procs.length)
            throw new Error(
                `first_proc: ${this.first_proc} is not in range of procs: ${this.procs.length}`,
            );
        this.set_range(this.first_proc);
    }

    // Proc to _Proc
    check_proc_valid_then_coerce = (
        proc: A_Proc_Arg | _Proc,
    ): _Proc | _Hook_Fn | undefined => {
        // disallow circularly concurrent chain, edit source if you a bold one _lol`
        if ((proc as _Proc).proc_id) return undefined;
        proc = proc as A_Proc_Arg;
        let label: str;
        if (!proc.type) {
            const err = `Server [142] - type && command missing, Fatal proc: ${o.pretty(
                proc,
            )}`;
            throw new Error(err);
        }

        if (this.is_fn_proc(proc)) {
            let fn_proc = proc as Hook_Arg;
            label = o.pretty(fn_proc.fn);
            label = o.truncate(label, Truncate_Label);
            // shouldn't get a warn if type-safe? - fatal
            if (!fn_proc.fn) {
                const err = `Server [142] - fn missing from fn proc, Fatal. proc: ${o.pretty(
                    proc,
                )}`;
                throw new Error(err);
            }
        } else {
            let proc_ = proc as Proc_Arg_Exec | Proc_Arg_Def;
            if (!proc_.command) {
                const err = `Server [142] - command missing from proc, Fatal. proc: ${o.pretty(
                    proc,
                )}`;
                throw new Error(err);
            }
            label = proc_.command;
        }
        return this.Proc_Arg_As_A_Proc(proc as A_Proc_Arg, label);
    };
    // I like turtles
    no_circular_tree_map = (proc: A_Proc_Arg | _Proc): _Proc | _Hook_Fn | undefined => {
        // because A_Proc_Arg.concurrently could be in tree as _A_Proc already
        if ((proc as _Proc).proc_id) return undefined;
        // since no proc_id, proc is a A_Proc_Arg (not circular)
        proc = proc as A_Proc_Arg;
        let label: str;
        if (this.is_fn_proc(proc)) {
            let fn_proc = proc as Hook_Arg;
            // util.format for label
            label = format(fn_proc.fn);
        } else {
            // TODO (more like this)
            if (proc.type === "exec") {
                if ((proc as any).args)
                    throw new Error(`proc.args are not allowed with {type: exec}`);
                label = o.truncate(`[${proc.type}] - ${proc.command}] `, Truncate_Label);
            } else if (proc.type === "fork") {
                let _proc: Proc_Arg_Fork = proc as Proc_Arg_Fork;
                // TODO
                label = o.truncate(`[${_proc.type}](${_proc.module}] `, Truncate_Label);
            } else {
                let _proc: Proc_Arg_Def = proc as Proc_Arg_Def;
                let args_s = Array.isArray(_proc.args) ? _proc.args?.join(", ") : _proc.args;
                label = o.truncate(
                    `[${_proc.type}](${_proc.command} args:[${args_s}]`,
                    Truncate_Label,
                );
            }
        }
        return this.Proc_Arg_As_A_Proc(proc as A_Proc_Arg, label);
    };
    Proc_Arg_As_A_Proc(proc_arg: A_Proc_Arg, label: str): _Proc {
        let chain_exit; // jiggler
        let _conc = proc_arg.concurrent && this.no_circular_tree_map(proc_arg.concurrent);
        let as_internal_proc = Object.assign(proc_arg, {
            proc_id: __id(),
            ...(_conc && {
                _conc,
            }),
            sidecar: {
                ...((label.length && {
                    label,
                }) ||
                    ""),
                ...(proc_arg.silence && { silence: proc_arg.silence }),
            },
            // This may be temporary, rather just do it the right way or throw
            // chain_exit_allowed: Array<Flux_Param> = ["success", ["always", true]];
            // maps "always" to true, allows "success", throws on misconfiguration
            ...(o.defi(
                (chain_exit = o.compound_map_to_arg(
                    chain_exit_allowed,
                    proc_arg.chain_exit,
                    undefined,
                )),
            ) && { chain_exit }),
        });

        // This just preps each proc up front so we only need to once
        if (proc_arg.type === "exec") {
            const process_proc: _Proc_Exec = as_internal_proc as unknown as _Proc_Exec;
            process_proc.construct = {
                type: proc_arg.type,
                command: proc_arg.command,
            };
            return process_proc;
        } else if (!this.is_fn_proc(as_internal_proc)) {
            const process_proc: _Proc_Def = as_internal_proc as unknown as _Proc_Def;
            process_proc.construct = this.set_run_proc_construct(proc_arg as Proc_Arg_Def);
            return process_proc;
        }
        return as_internal_proc as _Hook_Fn;
    }
    // at should be undefined on first call, intentionally
    // Shallow clone so flash proc changes {...}
    set_range(at: number) {
        if (at === this.last_range_at) {
            this.step_procs = [...this.range_cache];
            return;
        }
        this.last_range_at = at;
        this.range_cache = [];
        for (let i = at; i < this.procs.length; i++) this.range_cache.push(this.procs[i]);
        this.step_procs = [...this.range_cache];
    }
    is_fn_proc(proc: A_Proc_Arg | _Proc) {
        return proc.type === "exec_fn" || proc.type === "fn";
    }
    is_repeater_proc(proc: _Proc_W_Conf) {
        return (
            (proc.type === "spawn" || proc.type === "execFile") &&
            Array.isArray((proc as unknown as _Proc_Def).construct.args?.[0])
        );
    }
    // TODO this is hacky, needs not unsafe setters
    set_self(arg_name: keyof Server_Construct, value: any) {
        (this as any)[arg_name] = value;
    }
    // TODO this is hacky, needs not unsafe setters
    // get_self = (arg_name: keyof Server_Construct) => (this as any)[arg_name].value;
    check_valid_and_assign(args: Server_Args) {
        type Server_Args_K = keyof Server_Args;
        type Server_Construct_K = keyof Server_Construct;
        const str_keyed: Array<keyof Server_Args> = ["name"];
        str_keyed.forEach((arg_name: keyof Server_Args) => {
            if (o.defi(args[arg_name])) {
                if (typeof args[arg_name] === "string") {
                    this.set_self(arg_name as Server_Construct_K, args[arg_name]);
                } else {
                    throw new Error(`Use a number type arg to set Server.${arg_name}.`);
                }
            } else {
                if (args[arg_name] === null) {
                    this.set_self(arg_name as Server_Construct_K, undefined);
                }
            }
            // else ignore undefined/false
        });

        const numeric: Array<keyof Server_Args> = [
            "debug",
            "trigger_index",
            "kill_delay",
            "first_proc",
        ];
        numeric.forEach((arg_name: Server_Args_K) => {
            let value: number;
            if (o.defi(args[arg_name])) {
                if (typeof args[arg_name] === "number") {
                    value = args[arg_name] as number;
                } else {
                    throw new Error(`Use a number type arg to set Server.${arg_name}.`);
                }
            } else {
                if (args[arg_name] === null) {
                    value = 0;
                }
            }
            if (o.defi(value)) {
                // Safe usage is still the responsibility of the user
                if (o.defi(number_mins[arg_name])) {
                    value = Math.max(value, number_mins[arg_name]);
                }
                this.set_self(arg_name as Server_Construct_K, value);
            }
        });
        if (o.defi(args.trigger_indices)) {
            if (args.trigger_indices.length !== args.watch.paths.length) {
                let err = "args.trigger_indices.length should equal watch.paths.length";
                err += "passing undefined for a path without a trigger is effective, ";
                err += "or pass no trigger_indices";
                throw new Error(err);
            }

            this.trigger_indices = args.trigger_indices;
        }
    }
    set_run_proc_construct({ type, command, ...opts }: Proc_Arg_Def): _Run_Proc_Conf {
        let { cwd, shell } = opts;
        let { args } = opts;
        if (o.defi(args)) {
            if (!Array.isArray(args)) {
                if (typeof args !== "string")
                    throw new Error(`proc.args is not an array, or string`);
                args = [args];
            }
        } else {
            args = [];
        }
        // TODO test
        // https://stackoverflow.com/questions/37459717/error-spawn-enoent-on-windows)
        shell = shell ?? process.platform == "win32" ? true : undefined;
        // TODO testing
        return {
            type,
            command,
            args,
            ...((cwd || shell) && {
                options: {
                    ...(cwd && { cwd }),
                    ...(shell && { shell }),
                },
            }),
        };
    }
}

// local stuff for now, 'experimenting' mode with argmaps like this
const chain_exit_allowed: Array<Flux_Param> = ["success", ["always", true]];

// `is called like Server(args)` with no new keyword
export default Server_Construct;

// Experimental stuff
// if (this.defi(args.override_trigger)) {
//     this.restart = async (file_path: str) => {
//         await this.kill_all();
//         await wait(this.kill_delay);
//         if (o.defi(this.trigger_index)) {
//             this.set_range(this.trigger_index);
//             this.step_procs = [...this.range_cache];
//         }
//         args.override_trigger(file_path);
//     };
// }
