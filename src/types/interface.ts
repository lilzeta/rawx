/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { Proc_Args, Silencer } from "./proc_interface.js";

export interface Server_Args {
    name: str; // start/stop labeling
    procs: Proc_Args; // proc or procs
    proc: Proc_Args; // both => Throw Error
    // Note: `trigger` means `watch trigger`
    trigger_index?: number; // restart from index on trigger
    trigger_indices?: number[]; // length should match watch.paths
    watch: {
        paths: Array<str>; // dir or file full paths
        // WIP `complex` Modality
        // prototype working for full trigger explication
        complex?: Array<Complex>;
        match?: Matchers;
        delay?: number;
        poll: number;
        debug?: Debug; // or uses Server one
        colors?: Color_Targets; // or uses Server one
    };
    colors?: Color_Targets; // or uses defaults
    //  silent 0 <-> 10 verbose
    debug?: Debug;
    log_ignore_reg_repl?: { reg: RegExp; replace?: string }[];
    kill_delay?: number; // post kill wait in ms
    output_dir?: str; // multi path helper
    first_proc?: number; // default: 0
    // "handled" to not terminate on (Ctrl-C)
    sig?: "handled"; // not recommended
}
// WIP
// override_trigger?: (path: str) => void;
// WIP ignore delays on Proc exit/kill
// all_proc_immediate?: true;

// not intentionally confusing, it tightens sigs
export type str = string;
// 10 for "verbose-est"
export type Debug = number;
// Note: `trigger` means `watch trigger`.
export interface Color_Targets {
    // Class name color
    label: str; // "" for no labeling
    // All sub-proc labelling
    default: str;
    // Accented for attention
    accent: str;
    // Start/Close/Proc specific
    forky: str;
    errata: str;
    // The `-` between label & log
    fleck: str; // "" for no fleck
}
export type Color_Target = keyof Color_Targets;
// internally I append "\x1B"
// "\x1B" + string is a versatile thing!

export interface Watch_Args {
    name: str; // Log Labelling ("" fon none)
    // 0 for silent, 10 verbostest, 3 default
    debug?: Debug; // occasionally things at 11
    // Partial means of any subset or none
    colors?: Partial<Color_Targets>;
    trigger_index?: number; // restart from index on trigger
    complex?: Array<Complex>;
    trigger_indices?: number[]; // length should match watch.paths
    paths: Array<str>; // Root dir that are treed, or singular files
    match?: Matchers; // See typedef below
    // if using a spin HD set above 5000???
    delay?: number; // ssd is default at ~2500
    // will shorten delay when filetree becomes proper async
    // poll - in ms, w/min 1000, def: 5000
    poll?: number;
}

export interface Watch_Complex_Args extends Watch_Args {
    type: "complex";
}

export interface Watch_Tree_Args extends Watch_Args {
    type: "tree";
}

// New style, conf per specific subsets of match
// explicates triggers & include/exclude
export interface Complex {
    paths: Array<str>; // WIP
    // higher precedece than root watch.match
    match?: Matchers;
    // trigger_index | trigger_indices
    trigger_index?: number;
    trigger_indices?: number[];
    select_procs?: number[];
}

export interface Matchers {
    include?: Match_Item;
    exclude?: Match_Item;
    include_dir?: Match_Item;
    exclude_dir?: Match_Item;
}
// str - Only of the format of dirname or
// *.ext or file-name.ext. no \\ \/ for now
// RegExp can have \/ & \\ (use your sys one)
// is each checked against the full path file OR dir
export type Match_Item = RegExp | Array<RegExp> | str | Array<str>;

export interface _Sidecar_Opts {
    label: str;
    silence?: Silencer;
    delay?: number;
}
// WIP on other args
export interface All_Opts {
    cwd?: str;
    shell?: true;
}

// The callback response to trigger the exec process after hook
export interface Exec_Light {
    command: str;
}

// WIP Arg_Map
export type Flux_Param = str | [str, str | boolean] | boolean;
export type Arg_Map = (
    allowed: Array<str | boolean | Flux_Param>,
    item: str | boolean,
    default_arg: str | boolean,
) => str | boolean;
// WIP

// Will possibly remove & replace proc => throw
// Temporarily allow use of proc as procs
export interface Pre_Init_Procs_Arg {
    procs?: Proc_Args;
    proc?: Proc_Args;
}
export type Server_Watch_Arg = Server_Args["watch"];

// A very strange hash 'object'
export interface Num_Keyed {
    [k: number]: any;
}
