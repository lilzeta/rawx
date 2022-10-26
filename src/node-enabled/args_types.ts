import { ChildProcess } from "child_process";
import { str } from "./export_types";
import { P, H } from "./proc_type_defs";
import { Require_Only_One } from "../util/validation/validator";
import { Color_Targets } from "../ops/args_types";
export type Server_Args = Require_Only_One<Server_Args_, "procs" | "proc">;
export interface Server_Args_ {
    name?: str; // start/stop labeling
    procs?: P.Proc_Args; // proc or procs
    proc?: P.Proc_Args; // both => Throw Error
    // Note: `trigger` means `watch trigger`
    trigger_index?: number; // restart from index on trigger
    trigger_indices?: number[]; // length should match watch.paths
    watch?: Watch_Args;
    colors?: Color_Targets; // or uses defaults
    //  silent 0 <-> 10 verbose
    debug: number;
    log_ignore_reg_repl?: { reg: RegExp; replace?: string }[];
    kill_delay?: number; // post kill wait in ms
    output_dir?: str; // multi path helper
    first_proc?: number; // default: 0
    // "handled" to not terminate on (Ctrl-C)
    sig?: "handled"; // not recommended
    dry_run?: true; // construct w/no execution (for debugging)
}

// Watch_Args_ but require one of...
export type Watch_Args = Require_Only_One<Watch_Args_, "trigger_index" | "trigger_indices">;
export interface Watch_Args_ {
    paths: Array<str>; // dir or file full paths
    name?: str; // log labeling
    // Aliased from Server, Note: `trigger` means `watch trigger`
    trigger_index?: number; // restart from index on trigger
    trigger_indices?: number[]; // length should match watch.paths
    // WIP `complex` Modality
    match?: Matchers;
    // prototype working for full trigger explication
    complex?: Files_Complex_Args; // w/? Higher precedence match inside
    delay?: number;
    poll: number;
    debug?: number; // or uses Server one
    colors?: Color_Targets; // or uses Server one
}

// Some watch args[] typedefs
export type Watch_Trigger = (path: str, target?: number) => void;
export type Trigger = number | undefined;
export type Trigger_Map = Array<Trigger>;
export type Full_Trigger_Map = Array<Trigger_Map>;

export interface Setup_Proc_Util_Args {
    sub_proc: ChildProcess;
    label: str;
    silence?: P.Silencer;
    on_close?: () => void;
}
export type Basic_Proc_Stdio = (proc: ChildProcess, silence?: P.Silencer) => void;

export interface Files_Tree_Args {
    root_paths: str[];
    match: Matchers;
    max_depth?: number;
}

export interface Matchers {
    include?: Match_Item_Arg;
    exclude?: Match_Item_Arg;
    include_dir?: Match_Item_Arg;
    exclude_dir?: Match_Item_Arg;
}

// str - Only of the format of dirname or
// *.ext or file-name.ext no \\ \/ for now
// RegExp will use exactly what you pass
export type Match_Item_Arg = RegExp | Array<RegExp> | str | Array<str>;

export interface Files_Complex_Args {
    complex: Complex_Arg[];
    match?: Matchers;
    max_depth?: number;
}

// TODO Mess...
export interface Complex_Arg {
    paths: Array<str>; // WIP
    // higher precedece than root watch.match
    match?: Matchers;
}

// TODO Mess...
export interface Complex_Arg {
    paths: Array<str>; // WIP
    // higher precedece than root watch.match
    match?: Matchers;
}
