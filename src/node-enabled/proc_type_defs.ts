// Procs P. namespace for Child_Process interfacing (Hooks H. below)
// ~ ~ ~ interface note  ~ ~ ~ //
// ?: true => optionally use true, passing false is unnecessary
// ~ ~ ~   ~  ~  ~  ~    ~ ~ ~ //
export declare namespace P {
    export interface Pre_Init_Procs_Arg {
        procs?: Proc_Args;
        proc?: Proc_Args;
    }
    export type Type = P_Type | H.Hook_Type;
    export type P_Type = "exec" | "spawn" | "execFile" | "fork";
    // Core_Proc args used by the daemon
    export interface Core {
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
        concurrent?: P.A_Proc_Arg; // chain another now
        // where concurrent: {...Proc} <- is a Proc
        delay?: number; // wait to start self, Def: 0ms
        // on trap unwatch all after a self triggered
        trap?: true; // remove filewatch permanently
        silence?: P.Silencer;
    }

    // Process Proc Args - No shell arg
    export interface Proc_Arg_Exec extends Core {
        type: "exec"; // child-process[type]...
        command: str; // ...[type](command ...)
    }
    export interface Proc_Arg_Def extends Core {
        type: "spawn" | "execFile"; // child-process[type]...
        command: str; // ...[type](command ...)
        args?: Array<str>; // ...](command ...args)
        cwd?: str; // working path (WIP)
        shell?: true; // passthrough  (WIP)
    }
    // No shell arg
    export interface Proc_Arg_Fork extends Core {
        type: "fork"; // child-process[type]...
        module: "str";
    }

    // some => just on start&close messages
    export type Silencer = "some" | "all";
    // This is the Proc input arg variety coerced to _Proc in constructor
    export type A_Proc_Arg = Proc_Arg_Def | Proc_Arg_Exec | Proc_Arg_Fork | H.Hook;
    export type Proc_Args = Array<A_Proc_Arg> | A_Proc_Arg;

    export type P_Args = readonly str[];
    export type Repeater_Args_Arr = Array<P_Args>;
    type str = string;
}

export declare namespace H {
    // WIP! Hooks
    // Hook Proc
    export type Hook_Type = "fn" | "exec_fn";
    export interface Hook extends P.Core {
        type: Proc_Hook_Type;
        fn: Fn_W_Callback | Exec_Hook_Args;
        // args?: Array<str>;
    }
    export type Proc_Hook_Type = "fn" | "exec_fn";
    // First Pure fn hook
    export type Fn_Callback_W_Code = (code: number) => void;
    export type Fn_W_Callback_Args = {
        callback: Fn_Callback_W_Code;
        file_path?: str;
        fail?: Rej;
    };
    export type Fn_W_Callback = (args: Fn_W_Callback_Args) => void;
    // hook into exec process with string command
    export type Get_Exec_Hook_Args = { callback: Post_Hook_Exec; file_path?: str; fail?: Rej };
    export type Exec_Hook_Args = (args: Get_Exec_Hook_Args) => str;

    // finally into the exec process step
    export type Post_Hook_Exec = (args: Exec_Light) => void;
    // The callback response to trigger the exec process after hook
    export interface Exec_Light {
        command: str;
    }
    export type Rej = (err: Error) => void;
    // Proc_Fn/Hooks below
    // WIP move to _P or new _H?
    export interface _Hook_Fn extends _P._Proc {
        fn: H.Fn_W_Callback | H.Exec_Hook_Args;
    }
    export interface _Hook_Exec_Args {
        proc: _Hook_Fn;
        trigger_file_path?: str;
    }
}
// Private types (internal only), see Server_Construct mapper
export declare namespace _P {
    // _Internal_ Proc Typedefs post constructor (WIP)
    export interface _Proc extends P.Core {
        // the internal version of Proc.concurrent
        _conc: _Proc; // as it is a _Proc type now
        _proc_id: str; // a unique uuid/hash per _Proc
        _sidecar: _Sidecar;
        // Because we only use _Proc as a super, `construct` is a virtual ref
        // construct: _Run_Proc_Conf; - the internal JSON sent to run() every time
    }
    // few bits for the wrappers, delay prop & for specific logging as needed
    export interface _Sidecar {
        label: str;
        silence?: P.Silencer;
        delay?: number;
    }
    // W_Conf = W/construct
    export type _Proc_W_Conf = _Proc_Def | _Proc_Exec | _Proc_Fork;
    export interface _Proc_Def extends _Proc {
        type: "spawn" | "execFile";
        construct: _Run_Proc_Conf;
    }
    // No shell args
    export interface _Proc_Exec extends _Proc {
        type: "exec";
        command: str;
        // WIP OPTIONS
        construct: _Run_Exec_Conf;
    }
    // No shell arg
    export interface _Proc_Fork extends _Proc {
        type: "fork";
        construct: _Run_Fork_Conf;
    }
    // _Run... .construct: arranged as is most effecient for run()
    // Spawn/ExecFile - default _Run_Proc_Conf
    export interface _Run_Proc_Conf {
        type: "spawn" | "execFile";
        command: str;
        args: readonly str[] | P.Repeater_Args_Arr;
        // where `true` just means no warning of no arg on failure (WIP)
        repeater_chain?: true | "success";
        options?: {
            cwd?: str;
            shell?: true;
        };
    }
    // Exec.construct - No args[]
    export interface _Run_Exec_Conf {
        type: "exec";
        command: str;
        cwd?: str;
    }
    // Fork.construct special types (Todo channels?)
    export interface _Run_Fork_Conf {
        type: "fork";
        module: str;
        args: readonly str[];
        options: {
            cwd: str;
            // TODO why the weird type tail?
            execPath?: str | undefined;
            execArgv?: str[] | undefined;
            detached?: boolean | undefined;
        };
    }
}
export type str = string;

// WIP
// cycle?: number;   // WIP - repeat self
// immediate?: true; // no proc courtesy waits
// ~ ~ ~
