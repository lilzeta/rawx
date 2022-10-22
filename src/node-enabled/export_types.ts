import { ChildProcess } from "node:child_process";
import { O } from "../ops/export_types";
import { Color_Targets } from "../ops/args_types";
import { Basic_Proc_Stdio, Server_Args, Setup_Proc_Util_Args } from "./args_types";
import { Watch_Args, Watch_Trigger } from "./args_types";
import { H, P, _P } from "./proc_type_defs";

export type Server_Class = new (args: Server_Args) => Server_I;
export interface Server_I extends Server_Constructor_I {
    set_range: (n: number) => void;
    // on_constructed: () => void;
    die: () => void;
}
export interface Server_Constructor_I {
    name: str;
    label: str; // Not an arg, name.translated
    debug: number;
    // aka wait for port to clear
    kill_delay: number; // in ms
    // yet to determine if we need to allow last proc any log time
    exit_delay: number; // in ms
    procs: Array<_P._Proc | H._Hook_Fn>; // used to reset stack if trigger_index
    // likely uncommon first is not 0?
    first_proc: number;
    // These are aliased into Watch for now
    trigger_index?: number;
    trigger_indices?: number[];
    _step_procs: Array<_P._Proc | H._Hook_Fn>; // used as current stack
    _range_cache: Array<_P._Proc | H._Hook_Fn>;
    _last_range_at: number; // is the last range cache valid?
    _proc_util: Proc_Util_I;
    set_range: (n: number) => void;

    _watch: Watch_I;
    watch: Watch_Args;
    colors: Color_Targets;

    // uuid of the most recent chain
    _tubed?: str;
    // still incomplete feature
    // _tube_lock?: true;
    _running?: Array<ChildProcess>;
    _live_functions: Record<str, str>;
}
// Watch_I = type after new Watch(...)
export interface Watch_I {
    watches_clear: () => Promise<void>;
    set_trigger: (fn: Watch_Trigger) => void;
}
export type Proc_Util_C = new (args: { inherit_ops: O }) => Proc_Util_I;
export interface Proc_Util_I {
    is_fn_proc: (proc: P.A_Proc_Arg | _P._Proc) => boolean;
    is_repeater_proc: (proc: _P._Proc_W_Conf) => boolean;
    setup_subproc: (a: Setup_Proc_Util_Args) => void;
    basic_proc_stdio: Basic_Proc_Stdio;
}

export interface Files_Complex_I {
    setup_complex_tree: () => Promise<void>;
    trees(): Array<Files_Tree_I>;
}
export interface Files_Tree_I {
    setup_tree: () => Promise<void>;
    // returns post construction full paths
    trunks: () => Array<Trunk_Paths>;
}
export type Trunk_Paths = readonly str[];

export type str = string;
