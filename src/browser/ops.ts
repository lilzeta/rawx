/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// External modules
const format_ = require("util").format;
// Internal modules
import { Some_Colors } from "./some_colors";
const Base: Base_C = require("../util/base");
const some_colors: Some_Colors = require("./some_colors");
// Internal Types
import { Base_C, Base_I } from "../util";
import { Abstract_Constructor } from "../util";
import { Conf, Color_Targets, Log } from "../ops/index";

// The examples demonstrate `const o = Ops({...});` provides usage of Ops_I as o
export interface O extends Base_I {
    debug: number;
    colors: Color_Targets;
    log: Log;
    accent: Log;
    forky: Log;
    errata: Log;
    keys: typeof Object.keys;
    simple_clean(s: str): str;
}

const no_colors: Color_Targets = {
    label: "",
    default: "",
    forky: "",
    accent: "",
    errata: "",
    fleck: "",
};

// Ops_Gen only virtually a class (?correct title?),
// class operates with a instance gen cache and a conf cache
// Notice new(...) => Ops; returns the above collection of methods `O` to/into new Ops(conf) calls
export type Ops_Gen = new (conf?: Conf) => O;
export type Ops_Facade = Abstract_Constructor<Conf | undefined, O>;
const Ops: Ops_Facade = (() => {
    // There is only 1 of these closures globally
    // stores a singleton instance of _Ops_Gen_Inner
    let ops_gen_cached: _Ops_Gen_Inner;
    // Call ops() with no args to get this ops_cache
    // ops_cache is instanced by the first `new Ops()`
    let ops_cache: O;

    // Notice, after a whole lot of class code this function
    // => returns ops_gen which is afterwards exported as the default module
    // Some singleton variables for simple_clean which cleans output
    // Where each output call is a buffer chunk of STD_OUT
    let global_nope_next_nl: boolean = false;
    // note: buffer boundaries aren't always line by line or command by command
    let global_nope_reg_repl: { reg: RegExp; replace?: string }[];

    const regex: Record<str, RegExp> = {
        // newline spam reduction regex (reduce consecucutive newlines to 2)
        // 2 consecucutive means 1 blank line
        cons_newlines_g: /\n[\s\t]*\n/g,
        starts_with_cons_newlines: /^[\s\t]*\n[\s\t]*\n[\s\t\n]*/,
        is_only_newlines_or_ws: /^[\s\t\n]*\n[\s\t\n]*$/g,
        mult_trailing_newlines_or_ws: /[\s\t\n]*\n[\s\t]*\n$/,

        // no start buffer space
        trim_ws_head: /^[\s\t]*/,
        // no start newline space
        trim_ws_after_newline: /\n[\s\t]*/,
    };

    class _Ops_Gen_Inner extends Base {
        name: str;
        debug: number = 2;
        // our local default basis
        colors: Color_Targets = {
            label: some_colors.LAVENDER,
            default: some_colors.TECHNICOLOR_GREEN,
            forky: some_colors.PURPLE,
            accent: some_colors.NEON_YELLOW,
            errata: some_colors.H_RED,
            fleck: some_colors.LAVENDER,
        };
        // log is colors[default]
        log: Log;
        accent: Log;
        forky: Log;
        errata: Log;
        // set_logging_etc_c_proc: (args: Set_Proc_Logger_Args) => void;

        constructor(conf?: Conf) {
            super();
            if (conf) {
                let { colors, debug, log_ignore_reg_repl } = conf;
                if (log_ignore_reg_repl) global_nope_reg_repl = log_ignore_reg_repl;
                // union over default basis w/our constructor args colors (a new default)
                if (colors) {
                    if (colors === "no") {
                        this.colors = no_colors;
                    } else {
                        this.colors = {
                            ...this.colors,
                            ...colors,
                        };
                    }
                }
                if (this.defi(debug)) this.debug = debug as number;
            }
        }

        // as in clone the basis _fns with conf
        public ops({ colors: colors_conf = {}, debug: debug_conf }: Conf = {}): O {
            let recolored_basis: Color_Targets;
            if (colors_conf === "no") {
                recolored_basis = no_colors;
            } else {
                recolored_basis = {
                    ...this.colors,
                    ...colors_conf,
                };
            }
            // console.log(`recolored_basis: `);
            // console.log(recolored_basis);
            const debug: number = (this.defi(debug_conf) ? debug_conf : this.debug) as number;
            return {
                debug,
                colors: recolored_basis,
                // label,
                // sub_proc_prefix: pre,
                log: this.log_default_industrial({
                    colors: recolored_basis,
                    debug,
                }),

                accent: this.log_accent_industrial({
                    colors: recolored_basis,
                    debug,
                }),
                forky: this.log_forky_industrial({
                    colors: recolored_basis,
                    debug,
                }),
                errata: this.log_errata_industrial({
                    colors: recolored_basis,
                    debug,
                }),

                // aliases of Core super methods
                defi: this.defi,
                empty: this.empty,
                truncate: this.truncate,
                keys: this.keys,
                entries: this.entries,
                wait: this.wait,
                pretty: this.pretty,
                puff: this.puff,
                fuzzy_true: this.fuzzy_true,
                fuzzy_false: this.fuzzy_false,
                // if_in_get_index: this.if_in_get_index,
                simple_clean: this.simple_clean,
            };
        }

        format: Arg_Formatter = (...args: [any]) => {
            const is_num = (arg: any) => typeof arg === "number" || typeof arg === "bigint";
            const is_a_format_o = (arg: any) => Array.isArray(arg) || typeof arg === "object";
            const arg_f = (arg: any) => {
                if (arg === undefined) return "`undef`";
                if (typeof arg === "string") return this.simple_clean(arg);
                if (is_num(arg)) return "" + arg;
                if (is_a_format_o(arg)) return format_("%o", arg);
                else return format_(arg);
            };
            let jiggler;
            const f_args = args.reduce((propogater: str[], arg) => {
                (jiggler = arg_f(arg)).length && propogater.push(jiggler);
                return propogater;
            }, []);
            return f_args.join(" ");
        };

        // private because color is escaped!
        // use default="" to not change color of passthrough
        // This would be important if sub-server has desired color
        private _logger_rescaffold: Rescaffold_Log_Ting = (
            scaf_args: Inner_Rescaffold_Args,
        ) => {
            const { debug = this.debug, io } = scaf_args;
            return (min_level: number, ...args: [any]) => {
                if (min_level > debug) return;
                // can't use o.log at beginning of constructors
                if (debug > 10) console.log(`_l local called w/type: ${typeof args[0]}`);
                if (args.length > 0) {
                    // WIP flags for work area notation - console.log(get_flag(dis));
                    io(this.format(...args));
                }
            };
        }; // kind

        // curry the color type, to a new factory w/pure passthrough, inner is the config curry
        boom: Boom = ({ color_target = "default" }: Boom_Args) => {
            const factory: Log_Factory = ({ debug, colors }: Factory_Args) => {
                const color = colors[color_target];
                let io: IO;
                if (color.length) io = (s: str) => console.log(`%c ${s}`, `color: ${color}`);
                else io = (s: str) => console.log(s);
                return this._logger_rescaffold({
                    debug,
                    color,
                    io,
                });
            };
            return factory;
        }; // ~ kind ~

        // these colorizers are rescaffold factory shortcut factories
        log_default_industrial: Log_Factory = this.boom({
            color_target: "default",
        }); // kind

        log_forky_industrial: Log_Factory = this.boom({
            color_target: "forky",
        }); // kind

        log_accent_industrial: Log_Factory = this.boom({
            color_target: "accent",
        }); // kind

        log_errata_industrial: Log_Factory = this.boom({
            color_target: "errata",
        }); // kind
        // Basically Passthrough \n\n spammers blitzd
        simple_clean = (data: string = ""): string => {
            // data is sometimes null - TODO what?
            if (!data?.length) return "";
            data = String(data);
            if (global_nope_reg_repl?.length) {
                global_nope_reg_repl.forEach(({ reg, replace = "" }) => {
                    data = data.replace(reg, replace);
                });
            }
            // use empty for cons newlines allow one \n
            if (regex.is_only_newlines_or_ws.exec(data)) {
                if (global_nope_next_nl) return "";
                global_nope_next_nl = true;
                return "\n";
            }
            if (global_nope_next_nl && regex.starts_with_cons_newlines.exec(data)) {
                if (global_nope_next_nl)
                    data = data.replace(regex.starts_with_cons_newlines, "\n");
                // because there's etc in data
                global_nope_next_nl = false;
            }
            if (regex.mult_trailing_newlines_or_ws.exec(data)) {
                global_nope_next_nl = true;
                data = data.replace(regex.mult_trailing_newlines_or_ws, "\n\n");
            }
            data = data.replace(regex.trim_ws_head, "");
            return data.replace(regex.trim_ws_after_newline, "\n");
        };
    }
    // a spoofed class, anonymous and strange, facade for _Ops_Gen_Inner cache
    return class IO_Facade {
        constructor(conf?: Conf) {
            if (ops_gen_cached) {
                if (!conf) return ops_cache;
                return ops_gen_cached.ops(conf);
            }
            // This happens once
            ops_gen_cached = new _Ops_Gen_Inner(conf);
            ops_cache = ops_gen_cached.ops(conf);
            return ops_cache;
        }
    } as Ops_Gen; // It's not Ops_Gen implements, but it is still an Ops_Gen interface
})();

module.exports = Ops;

// Local Types for the config factories
type IO = (s: str) => void;
type Arg_Formatter = (args: any[]) => string;
type Log_Arg = str | Error | { [k: string]: Log_Arg_ } | Array<Log_Arg_>;
interface Log_Arg_ {
    [dis: string]: Log_Arg;
}
// Returns Log_Ting based on conf args
type Rescaffold_Log_Ting = (args: Inner_Rescaffold_Args) => Log;
interface Inner_Rescaffold_Args {
    io: IO;
    debug?: number;
    color?: str;
}
// Creates a rescaffold factory for a specified color_target || "default"
type Log_Factory = (args: Factory_Args) => Log;
interface Factory_Args {
    debug: number;
    colors: Color_Targets;
    // tag: str;
}
// The factory of factory is a war! what is it good for...
// Actual Boom => ->|(args: Rescaffold_Args) => Rescaffold_Factory(args)|<- => Rescaffold_Log
type Boom = (args: Boom_Args) => Log_Factory;
interface Boom_Args {
    color_target?: keyof Color_Targets;
}
type str = string;
