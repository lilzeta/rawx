/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = Server_Constructor;
// externals
const { v4: __id } = require("uuid");
const { format } = require("util");
import { ChildProcess } from "child_process";

// internal modules/classes
const Watch: Watch_C = require("./watch");
const ops_mod: Ops_Module = require("../ops/index");
const Proc_Util: Proc_Util_C = require("./proc_u");
// Typescript json value import tsconfig:{"resolveJsonModule": true}
// import * as server_schema from "../util/validation/schema/server_schema.json";

// internal types
import { Color_Targets, O, Ops_Module } from "../ops/index";
import { Watch_C } from "./watch";
import { P, H, _P } from "./proc_type_defs";
// import { Arg_Validator_Class, Arg_Validator_I } from "../util/validation/validator";
// const Validator: Arg_Validator_Class = require("../util/validation/validator");
import { Server_Args, Watch_Args } from "./args_types";
import { Proc_Util_C, Proc_Util_I, Server_Constructor_I, str, Watch_I } from "./export_types";
import { Arg_Validator_I } from "util/validation/validator";

// set in constructor
let o: O;
// WIP validator class elsewhere
const server_mins: any = {
    kill_delay: 50,
    exit_delay: 50,
    // pulse: 400,
};
const Truncate_Label = 100;
// const Truncate_Label = 60;

export type Server_Constructor_C = new (args: Server_Args) => Server_Constructor_I;
// Server_Facade behaves as would exposed inner _Server
class Server_Constructor_Facade {
    constructor(args: Server_Args) {
        return server_constructor_creator(args);
    }
}
// Now we expose _Server through Server_Facade as if we created it w/vanilla
const Server_Constructor = Server_Constructor_Facade as Server_Constructor_C;
type Server_Constructor_Creator = (args: Server_Args) => Server_Constructor_I;
const server_constructor_creator: Server_Constructor_Creator = (
    // const Server_Constructor_Creator: Class_Proxy_F<Server_Args, Server_Constructor_I> = (
    args: Server_Args,
) => {
    // Server_Creator => return new _Server(args);
    class Server_Constructor_Concrete implements Server_Constructor_I {
        name: str = "";
        label: str = ""; // Not an arg, name.translated
        // 0-10 recommended, sweep the etc critical 11/12...
        debug: number = 2;
        // aka wait for port to clear
        kill_delay = 3000; // in ms
        // yet to determine if we need to allow last proc any log time
        exit_delay = 3000; // in ms
        watch: Watch_Args;
        _watch: Watch_I;
        // These are aliased into Watch for now
        trigger_index?: number;
        trigger_indices?: number[];

        colors: Color_Targets;

        // https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
        procs: Array<_P._Proc | H._Hook_Fn>; // used to reset stack if trigger_index
        // likely uncommon first is not 0
        first_proc: number = 0;
        _step_procs: Array<_P._Proc | H._Hook_Fn>; // used as current stack
        _range_cache: Array<_P._Proc | H._Hook_Fn>;
        _last_range_at: number; // is the last range cache valid?
        _proc_util: Proc_Util_I;

        // uuid of the most recent chain
        _tubed?: str = undefined;
        _running: { [p: number]: any } = {};
        // Currently we use pid at start as parent of whatever pid is in the _root_pids to SIGINT
        _proc_manifest?: { [pid: str]: ChildProcess } = {};
        _root_pids: Array<str> = [];

        _live_functions: Record<str, str>;
        // out?: str;
        _validator: Arg_Validator_I;
        constructor(args: Server_Args) {
            if (!args) throw new Error("No server configuration was provided, nothing to do.");
            // if (args.dry_run) {
            //     // Block is for ./src/scripts/build_json_validator.js (strip on pack?)
            //     o = new ops_mod.Ops();
            //     this._proc_util = new Proc_Util({ inherit_ops: o });
            //     this.setup_procs({ procs: args.procs, proc: args.proc });
            //     this._validator = new Validator("server", server_schema);
            //     this._validator.validate(args);
            //     return;
            // }
            // this._validator = new Validator("server", server_schema);
            // Throws iff any invalid
            // this._validator.validate(args);
            // this._validator.set_validated(this);
            const { name, watch, colors, ...opts } = args;
            const { trigger_index, trigger_indices } = opts;
            if (args.debug !== undefined) {
                this.debug = args.debug;
            }
            if (args.name?.length) {
                this.name = args.name;
                // TODO dynamic padding
                this.label = `${args.name.padEnd(6)}`;
            }
            // First global call sets the default cache/base
            // this sets server args as a default basis
            o = new ops_mod.Ops({
                colors: args.colors,
                debug: this.debug,
                label: this.label,
            });

            this.check_valid_and_assign(args);
            let { procs, proc } = opts;
            this.watch = watch;
            if (o.defi(colors)) this.colors = colors as Color_Targets;

            this._proc_util = new Proc_Util({ inherit_ops: o });

            this.setup_procs({ procs, proc });
            if (watch) {
                this.trigger_index = trigger_index;
                this.trigger_indices = trigger_indices;
                this.validate_triggers();
                this.setup_watch();
            }
            o.log(
                6,
                `Server_Construct constructor has completed, without known errors for Server`,
            );
        }
        validate_triggers() {
            if (
                o.defi(this.trigger_index) &&
                (this.trigger_index as number) > this.procs.length
            )
                throw new Error(`trigger_index must not be larger than procs size.`);
            if (o.defi(this.trigger_indices)) {
                if (this.trigger_index)
                    throw new Error(`trigger_index cannot be used with trigger_indices.`);
                const trigger_indices = this.trigger_indices as Array<number>;
                const q = "Pass undefined to skip indexes, ";
                // WIP !! complex[0].paths // this.trigger_indices.length
                if (this.watch.complex) {
                    // TODO better validator
                    if (this.watch.complex.complex[0].paths.length !== trigger_indices.length)
                        throw new Error(
                            `${q}trigger_indices.length must match watch.complex...paths.length.`,
                        );
                } else {
                    if (this.watch.paths.length !== trigger_indices.length) {
                        throw new Error(
                            `${q}trigger_indices.length must match watch.paths.length.`,
                        );
                    }
                } // WIP validation
                // throw new Error(`trigger_index must not be larger than procs size.`);
            }
        }

        setup_watch() {
            const watch_args = this.watch;
            const parent_colors = this.colors;
            o.log(7, "setup_watch - watch.complex:", watch_args.complex);
            if (watch_args.complex) {
                this.setup_multi_watch();
                return;
            }
            // convert singular path to an array
            if (typeof watch_args?.paths === "string") {
                watch_args.paths = [watch_args.paths];
            }
            if (watch_args?.paths?.length) {
                this._watch = new Watch({
                    name: this.name,
                    debug: this.debug, // overridden if watch.debug
                    ...o.puff("colors", parent_colors),
                    trigger_index: this.trigger_index,
                    trigger_indices: this.trigger_indices,
                    // as in the Server.watch arg
                    ...watch_args,
                });
            }
        }

        setup_multi_watch() {
            this._watch = new Watch({
                name: this.name,
                colors: {
                    ...this.colors,
                },
                ...this.watch,
            });
        }

        // map proc/procs to arr of _Proc ... &some sensible checks
        setup_procs({ procs: input_procs, proc: input_proc }: P.Pre_Init_Procs_Arg) {
            const NO_PROC_ERROR = `Server requires one of procs or proc, to contain a proc.`;
            if (!input_procs && !input_proc) {
                throw new Error(NO_PROC_ERROR);
            }
            if (input_procs && input_proc) {
                throw new Error("Server accepts only one of procs | proc");
            }
            const input = (input_procs || input_proc) as P.Proc_Args;
            let procs: Array<P.A_Proc_Arg>;
            if (Array.isArray(input)) {
                procs = input;
            } else {
                procs = [input];
            }
            if (!procs.length) throw new Error();

            this.procs = [];
            // undefined happens if self/circular ref found (is not allowed _yet_)
            let jiggler: _P._Proc | H._Hook_Fn | undefined;
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
            proc: P.A_Proc_Arg | _P._Proc,
        ): _P._Proc | H._Hook_Fn | undefined => {
            // disallow circularly concurrent chain, edit source if you a bold one _lol`
            if ((proc as _P._Proc)._proc_id) return undefined;
            proc = proc as P.A_Proc_Arg;
            let label: str;
            if (!proc.type) {
                const err = `type && command missing, Fatal proc: ${o.pretty(proc)}`;
                throw new Error(err);
            }

            if (this._proc_util.is_fn_proc(proc)) {
                let fn_proc = proc as H.Hook;
                label = o.pretty(fn_proc.fn);
                label = o.truncate(label, Truncate_Label);
                // shouldn't get a warn if type-safe? - fatal
                if (!fn_proc.fn) {
                    const err = `fn missing from fn proc, Fatal. proc: ${o.pretty(proc)}`;
                    throw new Error(err);
                }
            } else {
                let proc_ = proc as P.Proc_Arg_Exec | P.Proc_Arg_Def;
                if (!proc_.command) {
                    const err = `command missing from proc, Fatal. proc: ${o.pretty(proc)}`;
                    throw new Error(err);
                }
                label = proc_.command;
            }
            return this.Proc_Arg_As_A_Proc(proc as P.A_Proc_Arg, label);
        };
        // I like turtles
        no_circular_tree_map = (
            proc: P.A_Proc_Arg | _P._Proc,
        ): _P._Proc | H._Hook_Fn | undefined => {
            // because A_Proc_Arg.concurrent could be in tree as _A_Proc already
            if ((proc as _P._Proc)._proc_id) return undefined;
            // since no proc_id, proc is a A_Proc_Arg (not circular)
            proc = proc as P.A_Proc_Arg;
            let label: str;
            if (this._proc_util.is_fn_proc(proc)) {
                let fn_proc = proc as H.Hook;
                // util.format for label
                label = format(fn_proc.fn);
            } else {
                // TODO (more like this)
                if (proc.type === "exec") {
                    if ((proc as any).args)
                        throw new Error(`proc.args are not allowed with {type: exec}`);
                    label = o.truncate(`[${proc.type}] - ${proc.command}] `, Truncate_Label);
                } else if (proc.type === "fork") {
                    let _proc: P.Proc_Arg_Fork = proc as P.Proc_Arg_Fork;
                    // TODO
                    label = o.truncate(`[${_proc.type}](${_proc.module}] `, Truncate_Label);
                } else {
                    let _proc: P.Proc_Arg_Def = proc as P.Proc_Arg_Def;
                    let args_s = Array.isArray(_proc.args)
                        ? _proc.args?.join(", ")
                        : _proc.args;
                    label = o.truncate(
                        `[${_proc.type}](${_proc.command} args:[${args_s}]`,
                        Truncate_Label,
                    );
                }
            }
            return this.Proc_Arg_As_A_Proc(proc as P.A_Proc_Arg, label);
        };
        Proc_Arg_As_A_Proc(proc_arg: P.A_Proc_Arg, label: str): _P._Proc {
            let _conc;
            if (proc_arg.concurrent) {
                _conc = this.no_circular_tree_map(proc_arg.concurrent);
                // just for cleaner logging of _Proc
                delete proc_arg.concurrent;
            }
            o.accent(11, `_conc in_tree? : ${_conc}`);
            let as_internal_proc = Object.assign(proc_arg, {
                proc_id: __id(),
                ...(_conc && {
                    _conc,
                }),
                _sidecar: {
                    ...((label.length && {
                        label,
                    }) ||
                        ""),
                    ...o.puff("silence", proc_arg.silence),
                },
                // This may be temporary, rather just do it the right way or throw
                // chain_exit_allowed: Array<Flux_Param> = ["success", ["always", true]];
                // maps "always" to true, allows "success", throws on misconfiguration
                // ...o.puff(
                //     "chain_exit",
                //     o.compound_map_to_arg(chain_exit_allowed, proc_arg.chain_exit, undefined),
                // ),
            });

            // This just preps each proc up front so we only need to once
            if (proc_arg.type === "exec") {
                const process_proc: _P._Proc_Exec =
                    as_internal_proc as unknown as _P._Proc_Exec;
                process_proc.construct = {
                    type: proc_arg.type,
                    command: proc_arg.command,
                };
                return process_proc;
            } else if (!this._proc_util.is_fn_proc(as_internal_proc)) {
                const process_proc: _P._Proc_Def = as_internal_proc as unknown as _P._Proc_Def;
                process_proc.construct = this.set_run_proc_construct(
                    proc_arg as P.Proc_Arg_Def,
                );
                return process_proc;
            }
            // TODO is this complete? no right?
            return as_internal_proc as unknown as H._Hook_Fn;
        }
        // at should be undefined on first call, intentionally
        // Shallow clone so flash proc changes {...}
        set_range(n: number) {
            if (n === this._last_range_at) {
                this._step_procs = [...this._range_cache];
                return;
            }
            this._last_range_at = n;
            this._range_cache = [];
            for (let i = n; i < this.procs.length; i++) this._range_cache.push(this.procs[i]);
            this._step_procs = [...this._range_cache];
        }

        // TODO this is hacky, needs not unsafe setters
        set_self(arg_name: keyof Server_Constructor_I, value: any) {
            (this as any)[arg_name] = value;
        }
        // TODO this is hacky, needs not unsafe setters
        // get_self = (arg_name: keyof Server_Construct) => (this as any)[arg_name].value;
        check_valid_and_assign(args: Server_Args) {
            type Server_Args_K = keyof Server_Args;
            type Server_Construct_K = keyof Server_Constructor_I;
            const str_keyed: Array<keyof Server_Args> = ["name"];
            str_keyed.forEach((arg_name: keyof Server_Args) => {
                if (o.defi(args[arg_name])) {
                    if (typeof args[arg_name] === "string") {
                        this.set_self(arg_name as Server_Construct_K, args[arg_name]);
                    } else {
                        throw new Error(
                            `Use a number type arg to set Server.${String(arg_name)}.`,
                        );
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
                if (args[arg_name] !== undefined) {
                    if (args[arg_name] === null) {
                        // simple shortcut to some minimum set below
                        value = 0;
                    } else if (typeof args[arg_name] === "number") {
                        value = args[arg_name] as number;
                    } else {
                        throw new Error(
                            `Use a number type arg to set Server.${String(arg_name)}.`,
                        );
                    }
                } else return; // default remains
                if (o.defi(value)) {
                    // Safe usage is still the responsibility of the user
                    if (o.defi(server_mins[String(arg_name)])) {
                        value = Math.max(value as number, server_mins[String(arg_name)]);
                    }
                    this.set_self(arg_name as Server_Construct_K, value);
                }
            });
            // TODO that generics trick for methods
            if (o.defi(args.trigger_indices)) {
                if (
                    (args.trigger_indices as Array<number>).length !== args.watch.paths.length
                ) {
                    let err = "args.trigger_indices.length should equal watch.paths.length";
                    err += "passing undefined for a path without a trigger is effective, ";
                    err += "or pass no trigger_indices";
                    throw new Error(err);
                }

                this.trigger_indices = args.trigger_indices;
            }
        }
        set_run_proc_construct({ type, command, ...opts }: P.Proc_Arg_Def): _P._Run_Proc_Conf {
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
    return new Server_Constructor_Concrete(args);
};
module.exports = Server_Constructor;

// WIP/inactive
// _tube_lock?: bool;
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
// pulse: {
//     // WIP chaperone (~watch dist oops)
//     last_stamps: Array<number>;
// };
// hash: any = {};
