/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = O_Generator;

// the TLDR, ops is logging operations + util consolidation
// Where import { Ops } from "rawx"
// calling `new Ops(conf)` returns a rebased collection of methods aka an `O`
// where utilized conf is rebased to { ...the_first_conf, ...this_conf }

// External
const format_ = require("node:util").format;
// Internal
import { Base_C, str } from "../util/export_types";
const Base: Base_C = require("../util/base");
import { Some_Colors } from "./color_util";
const color_util_mod = require("./color_util");
const some_colors: Some_Colors = color_util_mod.some_colors;
import { Abstract_Constructor } from "../util";
import { Color_Targets, Ops_Conf } from "./args_types";
import { Log, O, Ops_Gen } from "./export_types";

const def = 2;

// \033 in hex
const ESCAPE = "\x1B";
// AKA the `SET no color` escape code, in utf8
const NO: string = ESCAPE + "[0m";
const default_colors: Escaped_Color_Targets = {
    label: ESCAPE + some_colors.LAVENDER,
    default: ESCAPE + some_colors.TECHNICOLOR_GREEN,
    forky: ESCAPE + some_colors.PURPLE,
    accent: ESCAPE + some_colors.D_BLUE,
    errata: ESCAPE + some_colors.H_RED,
    bar: ESCAPE + some_colors.LAVENDER,
};
const no_colors: Escaped_Color_Targets = {
    label: "",
    default: "",
    forky: "",
    accent: "",
    errata: "",
    bar: "",
};

// Virtually a class (?correct title?), class operates as a class cache with a conf basis override
// Notice new(...) => Ops; returns the above collection of methods when new Ops(conf)
type Ops_Facade = Abstract_Constructor<Ops_Conf | undefined, O>;

const O_Generator: Ops_Gen = (() => {
    // There is only 1 of these closures globally
    // stores a singleton instance of _Ops_Gen_Inner
    let ops_gen_cached: _Ops_Gen_Inner;
    // Call ops() with no args to get this ops_cache
    // ops_cache is instanced by the first `new Ops()`
    let ops_cache: O;

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
    // let jig: any;
    let d: number;

    // Instantiated once/only-first new Ops(...) call
    class _Ops_Gen_Inner extends Base {
        name: str;
        debug = 2;
        // our local default basis, updated only once
        colors = default_colors;
        // default
        log: Log;
        accent: Log;
        forky: Log;
        errata: Log;
        // set_logging_etc_c_proc: (args: Set_Proc_Logger_Args) => void;

        constructor(conf?: Ops_Conf) {
            super();
            if (conf) {
                let { colors: color_conf, debug, log_ignore_reg_repl } = conf;
                // Add custom log cleanup
                if (log_ignore_reg_repl) global_nope_reg_repl = log_ignore_reg_repl;
                // union args over the default w/args.colors as a new default
                if (color_conf) {
                    if (color_conf === "no") {
                        this.colors = no_colors;
                    } else {
                        this.colors = {
                            ...this.colors,
                            ...this.escape_colors(color_conf),
                        };
                    }
                }
                if (this.defi(debug)) this.debug = debug as number;
            }
            // This is mostly logging to test our new generator instanced properly
            setTimeout(() => {
                // where args.debug > 6
                ops_cache.log(6, `Core utilities setup completed`);
            }, 100);
        }

        k = Object.keys;
        e = Object.entries;

        // Partial in case of operation over conf. input
        escape_colors = (
            conf_colors: Partial<Color_Targets> = {},
        ): Partial<Escaped_Color_Targets> => {
            let escaped: Partial<Escaped_Color_Targets> = {};
            for (const [k, color] of this.e(conf_colors)) {
                if (color?.length) escaped[k as Color_Targets_K] = ESCAPE + color;
                else escaped[k as Color_Targets_K] = ""; // aka white or passthrough
            }
            return escaped;
        };

        // as in clone the basis _fns with conf
        public ops({
            colors: colors_arg = {},
            debug: debug_conf,
            label = "",
        }: Ops_Conf = {}): O {
            let conf_colors: Color_Targets;
            if (colors_arg === "no") {
                conf_colors = no_colors;
            } else {
                conf_colors = {
                    ...this.colors,
                    ...this.escape_colors(colors_arg),
                };
            }
            // console.log(`recolored_basis: `);
            // console.log(recolored_basis);
            const debug = this.defi(debug_conf) ? debug_conf : this.debug;
            return {
                debug,
                colors: conf_colors,
                // label,
                log: this.log_default_industrial({
                    colors: conf_colors,
                    debug,
                    pre: this.prefix({
                        label,
                        color: conf_colors["label"],
                        bar: conf_colors["bar"],
                        main_color: conf_colors["default"],
                    }),
                }),
                accent: this.log_accent_industrial({
                    colors: conf_colors,
                    debug,
                    pre: this.prefix({
                        label,
                        color: conf_colors["label"],
                        bar: conf_colors["bar"],
                        main_color: conf_colors["accent"],
                    }),
                }),
                forky: this.log_forky_industrial({
                    colors: conf_colors,
                    debug,
                    pre: this.prefix({
                        label,
                        color: conf_colors["label"],
                        bar: conf_colors["bar"],
                        main_color: conf_colors["forky"],
                    }),
                }),
                errata: this.log_errata_industrial({
                    colors: conf_colors,
                    debug,
                    pre: this.prefix({
                        label,
                        color: conf_colors["label"],
                        bar: conf_colors["bar"],
                        main_color: conf_colors["errata"],
                    }),
                }),
                // aliases of Core (super) methods
                defi: this.defi,
                empty: this.empty,
                keys: this.keys,
                entries: this.entries,
                truncate: this.truncate,
                wait: this.wait,
                pretty: this.pretty,
                simple_clean: this.simple_clean,
                puff: this.puff,
                fuzzy_true: this.fuzzy_true,
                fuzzy_false: this.fuzzy_false,
                // if_in_get_index: this.if_in_get_index,
            };
        }
        format: Arg_Formatter = (...args: any[]) => {
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
            scaf_args: Partial<Inner_Rescaffold_Args>,
        ) => {
            const { debug = this.debug, pre } = scaf_args;
            const post = this.post({ is_defi_IO: pre });
            return (...args: any[]) => {
                typeof args[0] === "number" ? ([d, ...args] = args) : (d = def);
                if (d > debug) return;
                // can't use o.log at beginning of constructors
                if (debug > 10) console.log(`_l local called w/type: ${typeof args[0]}`);
                if (args.length > 0) {
                    pre?.();
                    // WIP flags for work area notation - console.log(get_flag(dis));
                    console.log(this.format.apply(null, args));
                    post?.();
                }
            };
        }; // kind

        // curry the color type, to a new factory w/pure passthrough, inner is the config curry
        boom: Boom = ({ color_target = "default" }: Boom_Args) => {
            const factory: Log_Factory = ({ debug, colors, pre }: Factory_Args) => {
                const color = colors[color_target];
                return this._logger_rescaffold({
                    debug,
                    color,
                    ...this.puff("pre", pre),
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
        prefix: LabelWrap = ({ label = "", color, bar, main_color }: LabelWrapArgs) => {
            let _color;
            if (!label.length) {
                if (main_color?.length) return () => this.stdout(main_color);
                // else should already be NO color
                return undefined;
            }
            // let pre = `<${label}>`;
            let pre = label;
            if (color?.length) {
                _color = color;
                pre = color?.length ? color + pre : pre;
            }
            pre += "| ";
            // color bar="" -> also no fleck
            if (bar?.length) {
                if (bar !== _color) {
                    pre += bar;
                }
                _color = bar;
                // pre += "- ";
            }

            if (_color !== main_color) {
                if (main_color.length) pre += main_color;
                else pre += NO;
            }
            // return () => this.stdout(pre + "___");
            return () => this.stdout(pre);
        };
        post: PostWrap = ({ is_defi_IO }) => {
            if (is_defi_IO) return () => this.stdout(NO);
            // => else return undefined
        };

        // Console.log with no newline
        stdout: Std_IO = (some_str?: str) => {
            if (some_str?.length) process.stdout._write(some_str, "utf8", () => {});
        }; // kind
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
        constructor(conf?: Ops_Conf) {
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

// Where import { Ops } from "rawx"
// calling `new Ops(conf)` returns a rebased collection of methods aka a `: IO`
// rebasing conf to { ...the_first_conf, ...this_conf }
module.exports = O_Generator;

// ............. Local Types mostly for the config factories
type I_O = () => void | undefined;
type Std_IO = (s: string) => void;
type Arg_Formatter = (args: any[]) => string;
type LabelWrap = (args: LabelWrapArgs) => I_O | undefined;
type LabelWrapArgs = { label?: string; color?: string; bar?: string; main_color: string };
type PostWrap = (args: { is_defi_IO?: I_O }) => I_O | undefined;
// simple internal helper to distinguish varieties of same str type
interface Escaped_Color_Targets extends Color_Targets {}
type Color_Targets_K = keyof Escaped_Color_Targets;
type Log_Arg = str | Error | { [k: string]: Log_Arg_ } | Array<Log_Arg_>;
interface Log_Arg_ {
    [dis: string]: Log_Arg;
}
// Returns Log_Ting based on conf args
type Rescaffold_Log_Ting = (args: Inner_Rescaffold_Args) => Log;
interface Inner_Rescaffold_Args {
    debug?: number;
    color?: str;
    pre?: I_O;
}
// Creates a rescaffold factory for a specified color_target || "default"
type Log_Factory = (args: Factory_Args) => Log;
interface Factory_Args {
    debug: number;
    colors: Escaped_Color_Targets;
    pre?: I_O;
}
// The factory of factory is a war! what is it good for...
// Actual Boom => ->|(args: Rescaffold_Args) => Rescaffold_Factory(args)|<- => Rescaffold_Log
type Boom = (args: Boom_Args) => Log_Factory;
interface Boom_Args {
    color_target?: keyof Color_Targets;
}
