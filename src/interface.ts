/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { ChildProcess } from "child_process";
import { Ops, Ops_Generator } from "./util/ops.js";
// rapid -> .tramp deprecated, use Use watch.trigger_index
export interface Proc extends String_Keyed {
	type: Proc_Type;     // child-process[type]...
    command: str;        // ...[type](command ...)
    args?: Array<str>;   // ...](command ...args)
	// immediately start next proc when this proc exits
    // chain another on "success"(exit 0) || any exit
    chain_exit?: "success" | true; 
	// if not falsey defaults to "success"
	on_watch?: true;     // delay start till a watch/trigger
	if_file_dne?: str;   // only run if file @ path D.N.E.
    concurrent?: Proc;   // chain another now
    // where concurrent: {...Proc} <- is a Proc
    delay?: number;      // wait to start self, Def: 0ms
    // on trap unwatch all after a self triggered
    trap?: true;         // remove filewatch permanently
    silence?: Silencer;  // no stdout/console from Proc
    cwd?: str;           // working path (untested)
    shell?: true;        // passthrough  (untested)
}
// WIP
// ?: true => don't pass false
// cycle?: number;   // WIP - repeat self
// immediate?: true; // no proc courtesy waits
// ~ ~ ~
// possible soon WIP trigger_tree_id(id...)
// ~ ~ ~

// some => just on start&close messages
export type Silencer = "some" | "all";
export type Proc_Args = Array<Proc> | Proc;

export interface Server_Args {
    name: str;            // start/stop labeling
    procs: Proc_Args;     // proc or procs
    proc: Proc_Args;      // both => Throw Error
	// Note: `trigger` means `watch trigger` & replaces .tramp, 
	trigger_index?: number; // restart from index on trigger
    watch: {
        paths: Array<str>;// dir or file full paths
        ignore?: RegExp[];// Regex array to not watch any match
        delay?: number;
        poll: number;
        debug?: Debug;    // or uses Server one
		colors?: Colors;  // or uses Server one
    };
    colors?: Colors;      // or uses defaults
    // true | 0->10 | "verbose" (verbose=10)
    debug?: Debug;
	log_ignore?: {reg: RegExp, replace?: string}[];
    kill_delay?: number; // post kill wait in ms
    // "handled" to not terminate on (Ctrl-C)
    sig?: "handled";
	override_trigger?: ()=>void;
    // WIP ignore delays on Proc exit/kill
    // all_proc_immediate?: true;
}

// aka wait
export type Async_Void_F = () => Promise<void>;

export type Proc_Type = "exec" | "spawn" | "execFile" | "fork";

// Logging
export interface String_Keyed {
    [s: str]: any;
}
// Note: `trigger` means `watch trigger`.
export interface Color_Targets extends String_Keyed {
    // for Server.Name
    label: str;
    default: str;
    lightly: str;
    forky: str;
    errata: str;
    fleck: str;
}
export const Colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
};
// no it's not intentionally confusing, it's tight.
export type str = string;
// A very strange hash 'object'
export interface Num_Keyed {
    [k: number]: any;
}
// 10 for "verbose-est"
export type Debug = number;
// Note: `trigger` means `watch trigger`.
export interface Colors extends String_Keyed {
    label: str;
    default: str;
    lightly: str;
    forky: str;
    errata: str;
    fleck: str;
}
export interface Set_Proc_Logger_Args {
    c_proc: ChildProcess;
    label: str;
    silence?: Silencer;
    env_module?: Ops;
    on_close: (pid: number) => void;
}

// WIP
export type Flux_Param = str | [str, str | boolean] | boolean;
export type Arg_Map = (
	allowed: Array<str | boolean | Flux_Param>, 
	item: str | boolean, 
	default_arg: str | boolean,
) => str | boolean;

export interface Watch_Args {
    name: str;
    ops: Ops_Generator;
    debug?: Debug;
    colors?: Partial<Colors>;
    trigger: any;
    paths: Array<str> | str;
    ignore?: RegExp[];
    delay?: number;
    // poll - in ms, w/min 1000, def: 5000
    poll?: number;
}