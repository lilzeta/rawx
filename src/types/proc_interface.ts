/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { str, _Sidecar_Opts, Exec_Light } from "./interface.js";
export type Type = Proc_Type | Hook_Type;
export type Proc_Type = "exec" | "spawn" | "execFile" | "fork";
export type Hook_Type = "fn" | "exec_fn";
// Core_Proc args used by the daemon
export interface Core_Proc {
    type: Type;
    // immediately start next proc when this proc exits
    // chain another on "success"(exit 0) || any exit
    chain_exit?: "success" | true;
    // Option to goto index instead of next
    chain_next?: number;
    // Set index for next watch trigger on failure
    chain_failure?: number;
    // if not falsey defaults to "success"
    on_watch?: true; // delay start till a watch/trigger
    run_if_file_dne?: str; // only run if file @ path D.N.E.
    goto_on_file_exists?: number; // skip to proc# if_file exists
    concurrent?: A_Proc_Arg; // chain another now
    // where concurrent: {...Proc} <- is a Proc
    delay?: number; // wait to start self, Def: 0ms
    // on trap unwatch all after a self triggered
    trap?: true; // remove filewatch permanently
    silence?: Silencer;
}
// Process Proc Args - No shell arg
export interface Proc_Arg_Exec extends Core_Proc {
    type: "exec"; // child-process[type]...
    command: str; // ...[type](command ...)
}
export interface Proc_Arg_Def extends Core_Proc {
    type: "spawn" | "execFile"; // child-process[type]...
    command: str; // ...[type](command ...)
    args?: Array<str>; // ...](command ...args)
    cwd?: str; // working path (WIP)
    shell?: true; // passthrough  (WIP)
}
// No shell arg
export interface Proc_Arg_Fork extends Core_Proc {
    type: "fork"; // child-process[type]...
    module: "str";
}

// ?: true => don't pass false
// WIP
// cycle?: number;   // WIP - repeat self
// immediate?: true; // no proc courtesy waits
// ~ ~ ~
// possible soon WIP trigger_tree_id(id...)
// ~ ~ ~

// some => just on start&close messages
export type Silencer = "some" | "all";
// This is the Proc input arg variety coerced to _Proc in constructor
export type A_Proc_Arg = Proc_Arg_Def | Proc_Arg_Exec | Proc_Arg_Fork | Hook_Arg;
export type Proc_Args = Array<A_Proc_Arg> | A_Proc_Arg;

// The rest are all _Internal_ Proc Typedefs post constructor (WIP)
export interface _Proc extends Core_Proc {
    // the internal JSON sent to run_proc every time
    // construct: _Proc_Def | _Proc_Exec | _Proc_Fork;
    proc_id: str; // uuid/hash
    concurrently?: _Proc; // not currently supporting concurrent hooks
    // few bits for the wrappers
    sidecar: _Sidecar_Opts;
}
export interface _Run_Proc_Conf {
    type: "spawn" | "execFile";
    command: str;
    args: readonly str[];
    options?: {
        cwd?: str;
        shell?: true;
    };
}
export type _Proc_W_Conf = _Proc_Def | _Proc_Exec | _Proc_Fork;
export interface _Proc_Def extends _Proc {
    type: "spawn" | "execFile";
    construct: _Run_Proc_Conf;
}
// No args[]
export interface _Run_Exec_Conf {
    type: "exec";
    command: str;
    cwd?: str;
    shell?: true;
}
// No shell arg
export interface _Proc_Exec extends _Proc {
    type: "exec";
    command: str;
    // WIP OPTIONS
    construct: _Run_Exec_Conf;
}

export interface _Run_Fork_Conf {
    type: "fork";
    module: str;
    args: readonly str[];
    options: {
        cwd: str;
        execPath?: str | undefined;
        execArgv?: str[] | undefined;
        detached?: boolean | undefined;
    };
}
// No shell arg
export interface _Proc_Fork extends _Proc {
    type: "fork";
    construct: _Run_Fork_Conf;
}

// export interface _Proc extends Core_Proc {
//     // the internal JSON sent to run_proc every time
//     construct: _Run_Proc | _Run_Exec_Proc | _Run_Fork_Proc;
//     proc_id: str; // uuid/hash
//     concurrently?: _Proc; // not currently supporting concurrent hooks
//     // few bits for the wrappers
//     sidecar: _Sidecar_Opts;
// }

// Proc_Fn/Hooks below
// WIP
export interface _Hook_Fn extends Core_Proc {
    proc_id: str; // uuid/hash
    fn: Function;
    concurrently?: _Proc; // not currently supporting concurrent hooks
    sidecar: _Sidecar_Opts;
}
// export type _A_Proc = _Proc | _Hook_Fn;

// WIP! Hooks
// Hook Proc
export interface Hook_Arg extends Core_Proc {
    type: Proc_Hook_Type;
    fn: Fn_W_Callback | Exec_Hook_Args;
    // args?: Array<str>;
}
export type Proc_Hook_Type = "fn" | "exec_fn";
// First Pure fn hook
export type Fn_Callback_W_Code = (code: number) => void;
export type Rej = (err: Error) => void;
export type Fn_W_Callback_Args = { callback: Fn_Callback_W_Code; file_path?: str; fail?: Rej };
export type Fn_W_Callback = (args: Fn_W_Callback_Args) => void;
// hook into exec process with string command
export type Get_Exec_Hook_Args = { callback: Post_Hook_Exec; file_path?: str; fail?: Rej };
export type Exec_Hook_Args = (args: Get_Exec_Hook_Args) => str;
// finally into the exec process step
export type Post_Hook_Exec = (args: Exec_Light) => void;
