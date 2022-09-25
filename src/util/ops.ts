/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { Core } from "./core.js";
import { format } from "util";
import { Arg_Map, str } from "../interface.js";
import { some_colors, Colors, Color_Targets } from "../interface.js";

type Debug = number;
// let DEBUG: Debug;
// \033 in hex
const ESCAPE = "\x1B";
// simple internal helper to distinguish vatieties of same type
interface Escaped_Color_Targets extends Color_Targets {}

type Log_Arg = str | Error | { [k: str]: Log_Arg_ } | Array<Log_Arg_>;
interface Log_Arg_ {
    [dis: str]: Log_Arg;
}
// Final logger, WIP kinda dislike how many layers are doing this
export type Log_Ting = (min_level: number, ...args: [any]) => void;
// Returns Log_Ting based on conf args
export type Rescaffold_Log_Ting = (args: Inner_Rescaffold_Args) => Log_Ting;
export interface Inner_Rescaffold_Args {
    debug?: Debug;
    color?: str;
    pre: IO;
}
// Creates a rescaffold factory for a specified color_target || "default"
export type Log_Factory = (args: Factory_Args) => Log_Ting;
export interface Factory_Args {
    debug: Debug;
    colors: Escaped_Color_Targets;
    pre: IO;
}
// The factory of factory is a war! what is it good for...
// Actual WAR => ->|(args: Rescaffold_Args) => Rescaffold_Factory(args)|<- => Rescaffold_Log
export type WAR = (args: WAR_Args) => Log_Factory;
export interface WAR_Args {
    color_target?: keyof Color_Targets;
}

export type String_Transform = (s: str) => str;

// cross server/same node.js file
let global_nope_next_nl: boolean = false;
// note buffer boundary via chunk isn't line by line or command by command
let global_nopes: { reg: RegExp; replace?: string }[];

const regex: Record<str, RegExp> = {
    cons_newlines_g: /\n[\s\t]*\n/g,
    starts_with_cons_newlines: /^[\s\t]*\n[\s\t]*\n[\s\t\n]*/,
    is_only_newlines_or_ws: /^[\s\t\n]*\n[\s\t\n]*$/g,
    mult_trailing_newlines_or_ws: /[\s\t\n]*\n[\s\t]*\n$/,
    trim_ws_head: /^[\s\t]*/,
    trim_ws_after_newline: /\n[\s\t]*/,
};

// Basically Passthrough \n\n spammers blitzd
export const simple_clean = (data: string = ""): string => {
    // data is sometimes null - TODO what?
    if (!data?.length) return "";
    data = String(data);
    if (global_nopes?.length) {
        global_nopes.forEach(({ reg, replace = "" }) => {
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
        if (global_nope_next_nl) data = data.replace(regex.starts_with_cons_newlines, "\n");
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

interface Ops_Args {
    debug?: Debug;
    colors?: Partial<Colors>;
    label?: str;
    log_ignore?: { reg: RegExp; replace?: string }[];
}
export interface Ops {
    debug: Debug;
    colors: Colors;
    label: str;
    _l: Log_Ting;
    lightly: Log_Ting;
    forky: Log_Ting;
    errata: Log_Ting;
    defi: (obj: any) => boolean;
    pretty: (obj: any) => str;
    compound_map_to_arg: Arg_Map;
    prefix: LabelWrap;
    post: PostWrap;
    sub_proc_prefix: IO;
    stdout: Std_IO;
}

// set in constructor
let o: Ops;

// Helper to check corruption on union type functions ... this is insane
// https://stackoverflow.com/questions/53387838/how-to-ensure-an-arrays-values-the-keys-of-a-typescript-interface/53395649#53395649
// type Invalid<T> = ["Needs to be all of", T];
// const arrayOfAll =
//     <T>() =>
//     <U extends T>(...array: U[] & (T extends U ? unknown : Invalid<T>[])) =>
//         array[0];
// let arrayOfAllColorConf = arrayOfAll<keyof Color_Targets>();
// using static base for now

// AKA SET no color escape code (in utf mode)
const NO: str = `\x1B[0m`;

export class Ops_Generator extends Core {
    name: str;
    debug: Debug = 2;
    // our local default basis
    colors: Escaped_Color_Targets = {
        label: ESCAPE + some_colors.LAVENDER,
        default: ESCAPE + some_colors.TECHNICOLOR_GREEN,
        forky: ESCAPE + some_colors.PURPLE,
        lightly: ESCAPE + some_colors.D_BLUE, // TODO oops darkly
        errata: ESCAPE + some_colors.H_RED,
        // fleck: ESCAPE + some_colors.D_BLUE,
        fleck: ESCAPE + some_colors.LAVENDER,
    };
    _l: Log_Ting;
    lightly: Log_Ting;
    forky: Log_Ting;
    errata: Log_Ting;
    // set_logging_etc_c_proc: (args: Set_Proc_Logger_Args) => void;

    constructor(args?: Ops_Args) {
        super();
        let { colors, debug, label, log_ignore } = args || {};
        if (log_ignore) global_nopes = log_ignore;
        // union over default basis w/our constructor args colors (a new default)
        if (colors) {
            colors = this.escape_and_update_colors(colors);
            this.colors = colors as Escaped_Color_Targets;
        }
        if (debug) this.debug = debug;

        // Example if you want to use flat ops in a descaffolded var in any inheritor/class
        o = this.ops_with_conf({ colors, debug: this.debug, label });
        // o.colors is union of args over current basis
        // so an implementor/inheritor can vary it's o.colors and its this.colors if desired
        o.lightly(6, `Core utilities setup completed`);
    }

    // get_ops(opts?: Ops_Env): Ops {
    //     return this.ops_with_conf(opts);
    // }

    keys = Object.keys;

    // Partial in case of operation over conf. input
    escape_and_update_colors = (colors: Partial<Color_Targets> = {}): Escaped_Color_Targets => {
        const union = this.keys(colors).reduce((propogater, key) => {
            if (colors[key].length) propogater[key] = ESCAPE + colors[key];
            else propogater[key] = ""; // aka white or passthrough child proc colors
            return propogater;
        }, { ...this.colors } || ({} as Partial<Color_Targets>));
        return union as Escaped_Color_Targets;
    };

    // as in clone basis fn_'s
    public ops_with_conf({
        colors: colors_conf = {},
        debug: debug_conf,
        label = "",
    }: Ops_Args = {}): Ops {
        let recolored_basis: Colors = {
            // ...this.colors,
            ...this.escape_and_update_colors(colors_conf),
        };
        // console.log(`recolored_basis: `);
        // console.log(recolored_basis);
        const debug = this.defi(debug_conf) ? debug_conf : this.debug;
        const pre = this.prefix({
            label,
            color: recolored_basis["label"],
            fleck: recolored_basis["fleck"],
            main_color: recolored_basis["default"],
        });
        return {
            debug,
            colors: recolored_basis,
            label,
            sub_proc_prefix: pre,
            pretty: this.pretty,
            defi: this.defi,
            _l: this.log_default_industrial({
                colors: recolored_basis,
                debug,
                pre: this.prefix({
                    label,
                    color: recolored_basis["label"],
                    fleck: recolored_basis["fleck"],
                    main_color: recolored_basis["default"],
                }),
            }),

            lightly: this.log_lightly_industrial({
                colors: recolored_basis,
                debug,
                pre: this.prefix({
                    label,
                    color: recolored_basis["label"],
                    fleck: recolored_basis["fleck"],
                    main_color: recolored_basis["lightly"],
                }),
            }),
            forky: this.log_forky_industrial({
                colors: recolored_basis,
                debug,
                pre: this.prefix({
                    label,
                    color: recolored_basis["label"],
                    fleck: recolored_basis["fleck"],
                    main_color: recolored_basis["forky"],
                }),
            }),
            errata: this.log_errata_industrial({
                colors: recolored_basis,
                debug,
                pre: this.prefix({
                    label,
                    color: recolored_basis["label"],
                    fleck: recolored_basis["fleck"],
                    main_color: recolored_basis["errata"],
                }),
            }),
            prefix: this.prefix,
            stdout: this.stdout,
            post: this.post,
            compound_map_to_arg: this.compound_map_to_arg,
        };
    } // kind

    // arg_default_false: Arg_Default_False = (item: str | boolean, allowed: Array<str | boolean>) => {
    //     if (!item || this.fuzzy_false(item)) return false;
    //     if (this.fuzzy_true(item)) return true;
    //     if (this.in_array(allowed, item)) {
    //         return item;
    //     }
    //     return false;
    // };

    format: Arg_Formatter = (...args: [any]) => {
        const is_num = (arg: any) => typeof arg === "number" || typeof arg === "bigint";
        const is_a_format_o = (arg: any) => Array.isArray(arg) || typeof arg === "object";
        const arg_f = (arg: any) => {
            if (typeof arg === "string") return simple_clean(arg);
            if (is_num(arg)) return "" + arg;
            if (is_a_format_o(arg)) return format("%o", arg);
            else return format(arg);
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
        return (min_level: number, ...args: [any]) => {
            if (min_level > debug) return;
            // can't use o.log at beginning of constructors
            if (debug > 10) console.log(`_l local called w/type: ${typeof args[0]}`);
            if (args.length > 0) {
                pre?.();
                // WIP flags for work area notation - console.log(get_flag(dis));
                console.log(this.format(...args));
                post?.();
            }
        };
    }; // kind

    prefix: LabelWrap = ({ label = "", color, fleck, main_color }: LabelWrapArgs) => {
        let _color;
        if (!label.length) {
            if (main_color?.length) return () => this.stdout(main_color);
            // else should already be NO color
            return undefined;
        }
        let pre = `<${label}>`;
        if (color?.length) {
            _color = color;
            pre = color?.length ? color + pre : pre;
        }
        pre += " ";
        // color fleck="" -> also no fleck
        if (fleck?.length) {
            if (fleck !== _color) {
                pre += fleck;
            }
            _color = fleck;
            pre += "- ";
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

    // curry the color type, to a new factory w/pure passthrough, inner is the config curry
    war: WAR = ({ color_target = "default" }: WAR_Args) => {
        const factory: Log_Factory = ({ debug, colors, pre }: Factory_Args) => {
            const color = colors[color_target];
            return this._logger_rescaffold({
                debug,
                color,
                pre,
            });
        };
        return factory;
    }; // ~ kind ~
    // What is it good for?

    // these colorizers are rescaffold factory shortcut factories
    log_default_industrial: Log_Factory = this.war({
        color_target: "default",
    }); // kind

    log_forky_industrial: Log_Factory = this.war({
        color_target: "forky",
    }); // kind

    log_lightly_industrial: Log_Factory = this.war({
        color_target: "lightly",
    }); // kind

    log_errata_industrial: Log_Factory = this.war({
        color_target: "errata",
    }); // kind
}

// __internal (stripped post build)
// This thing just logs dividers around the work focus area
// type FlagLookup = (dis: str) => str | undefined;
// const get_flag: FlagLookup = (dis: str) => {
// 	if (typeof dis === typeof "string" && /^__flag/.exec(dis)) {
// 		if (/^__flag0/.exec(dis)) {
// 			console.log(flag0);
// 			// they are carrots
// 		} else if (/^__flag1/.exec(dis)) {
// 			console.log(flag1);
// 		} else {
// 			const err = `<Core>[42] get_flag called with unsupported flag: ${dis}`;
// 			// console.log(err);
// 			if (DEBUG > 9) {
// 				throw new Error(err);
// 			}
// 			return err;
// 		}
// 		return dis.replace(/^__flag\d?/, "");
// 	}
// 	return dis;
// }; // kind
// const flag0 = `<~~~~~~~~~~~~~~˅˅˅>`;
// const flag1 = `</^^^~~~~~~~~~~~~~>`;
// kind they are carrots, (stripped post build? WIP sed) internal__
// Internal only, types mostly for typing intemediary functs for logging
export type IO = () => void | undefined;
type LabelWrap = (args: LabelWrapArgs) => IO | undefined;
type LabelWrapArgs = { label?: str; color?: str; fleck?: str; main_color: str };
type PostWrap = (args: { is_defi_IO?: IO }) => IO | undefined;
export type Std_IO = (s: str) => void;
type Arg_Formatter = (args: any[]) => str;
