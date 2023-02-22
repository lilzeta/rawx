// module.exports = Proc_Util;
const os = require("node:os");
const platform = os.platform();
const t_kill = require("tree-kill");

// import { ChildProcess } from "child_process";
import { O, str } from "../ops/index";
import { Basic_Proc_Stdio, Setup_Proc_Util_Args } from "./args_types";
import { Proc_Util_C, Proc_Util_I } from "./export_types";
import { P, _P } from "./proc_type_defs";
import { DEBUG_FTR } from "./server";

// const ESCAPE = "\x1B";
// AKA SET no color escape code (in utf mode)
const NO: str = `\x1B[0m`;
interface Inherit {
    inherit_ops: O;
    debug?: number;
}
type PID_HASH = { [pid: string]: true };

// TODO CONF
const max_kill_delay = 7000;

let sys_user: str, spoon_ex: str;
let p_exec: any;
if (platform === "win32") {
    const os = require("os");
    const util = require("util");
    const { exec } = require("child_process");
    p_exec = util.promisify(exec);
    const username = os.userInfo().username;
    let sys_user = `"USERNAME eq ${os.hostname()}\\${username}"`;
    spoon_ex = `tasklist /nh /fo csv /fi ${sys_user}`;
}

// const tk = "C:\\Windows\\SysWOW64\\taskkill.exe";

// Proc_Util_Facade behaves as would exposed inner _Proc_Util
class Proc_Util_Facade {
    constructor(args: Inherit) {
        return proc_util_creator(args) as Proc_Util_I;
    }
}
// Now we expose _Watch through Watch_Facade as if we created it w/vanilla
const Proc_Util = Proc_Util_Facade as Proc_Util_C;
type Proc_Util_Creator = (args: Inherit) => Proc_Util_I;
const proc_util_creator: Proc_Util_Creator = (args: Inherit) => {
    let o: O;

    class Rejector_After {
        completed: boolean = false;
        rejector?: (reason?: any) => void = null;
        public reject_await = async (rej: (reason?: any) => void) => {
            this.rejector = rej;
            await o.wait(max_kill_delay);
            if (!this.completed && this.rejector) {
                rej(); // TODO cleaner catching
            }
            this.completed = false;
        };
        public cancel = (): void => {
            this.rejector = null;
        };
    }
    const rejector = new Rejector_After();

    class _Proc_Util implements Proc_Util_I {
        // debug: number = DEBUG_FTR.KILL;
        debug: number = 3;
        // note above args passed below into new to/into c_args
        constructor(c_args: Inherit) {
            o = c_args.inherit_ops;
            // TODO THIS CONF WIP!
            if (o.defi(c_args.debug)) this.debug = c_args.debug;
        }
        is_fn_proc(proc: P.A_Proc_Arg | _P._Proc) {
            return proc.type === "exec_fn" || proc.type === "fn" || false;
        }
        is_repeater_proc(proc: _P._Proc_W_Conf) {
            return (
                (proc.type === "spawn" || proc.type === "execFile") &&
                Array.isArray((proc as unknown as _P._Proc_Def).construct.args?.[0])
            );
        }
        // There isn't an elegant module for this, it's half Ops/half proc runtime
        // Used after each subproc starts, may move this to another class
        setup_subproc = ({ sub_proc, silence, on_close }: Setup_Proc_Util_Args) => {
            o.log(`setup proc w/pid: ${sub_proc.pid}`);
            let jiggler;
            const colors = o.colors;
            // No <-> deco on normal stdout/stderr - color pass-through
            if (!silence) {
                let sub_pass_through: IO;
                // no label for proc std_out
                if (o.colors.default?.length)
                    sub_pass_through = () => this.stdout(colors.default);
                let post = this.post({ is_defi_IO: sub_pass_through });
                sub_proc.stdout.on("data", (data) => {
                    if ((jiggler = o.simple_clean(data)).length) {
                        sub_pass_through?.();
                        this.stdout(jiggler);
                        post?.();
                    }
                });
            }

            if (silence !== "all" && o.debug) {
                let err_sub_pass_through: IO;
                // no label for proc std_out
                if (colors.errata?.length)
                    err_sub_pass_through = () => this.stdout(colors.errata);
                let err_post = this.post({ is_defi_IO: err_sub_pass_through });
                sub_proc.stderr.on("data", (data) => {
                    if ((jiggler = o.simple_clean(data)).length) {
                        err_sub_pass_through?.();
                        console.log(jiggler);
                        err_post?.();
                    }
                });
                // WIP - _TODO_ (Multiple subpass labels affixed!)
                let forky_sub_pass_through: IO;
                // no label for proc std_out
                if (colors.forky?.length)
                    forky_sub_pass_through = this.prefix({
                        // label: o.label,
                        color: colors["label"],
                        bar: colors["bar"],
                        main_color: colors["forky"],
                    });
                let forky_post = this.post({ is_defi_IO: forky_sub_pass_through });
                sub_proc.on("close", (code) => {
                    // With named label
                    if (o.debug) {
                        forky_sub_pass_through?.();
                        o.forky(`proc \\\\_ closed w/code: ${code}`);
                        forky_post?.();
                    }
                    on_close?.();
                });
            }
        }; // kind

        // in case anyone wants a subproc output like inherited
        basic_proc_stdio: Basic_Proc_Stdio = (proc, silencer) => {
            if (silencer === "all") return;
            if (!silencer)
                proc.stdout.on("data", (data) => {
                    process.stdout._write(data, "utf8", () => {});
                });
            proc.stderr.on("data", (data) => {
                process.stderr._write(data, "utf8", () => {});
            });
            proc.stderr.on("close", () => {
                const out = `>>>process was closed`;
                process.stderr._write(out, "utf8", () => {});
            });
        };

        prefix: LabelWrap = ({ label = "", color, bar, main_color }: LabelWrapArgs) => {
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
            if (bar?.length) {
                if (bar !== _color) {
                    pre += bar;
                }
                _color = bar;
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

        kill_all = async (running: str[]): Promise<void> => {
            o.accent(`platform: ${platform}`);
            if (platform === "win32") {
                await this.kill_all_win(running);
                return;
            }
            // TODO testing on OSX, Linux ...!!!
            return new Promise((res, rej) => {
                let run_c = running.length;
                let d = this.debug;
                if (run_c) {
                    for (let i = 0; i < run_c; i++) {
                        t_kill(running[i], "SIGKILL", (err: any) => {
                            if (d === DEBUG_FTR.KILL) {
                                o.errata(err); // so noisy
                            }
                            run_c--;
                            if (!run_c) {
                                rejector.cancel();
                                res();
                            }
                        });
                    }
                }
                rejector.reject_await(rej);
            });
        };
        kill_all_win = async (running: str[]) => {
            // object `hashish`
            let k_: PID_HASH = {};
            running.forEach((s: str) => {
                k_[s] = true;
            });
            if (this.debug === DEBUG_FTR.KILL) {
                o.log(`kill_all_win, k_: `, k_);
            }
            if (!running.length) {
                return;
            }

            // win_user = "COMPUTERNAME\USER"
            let kill: str[] = [];
            const get_kill_list = async () => {
                const { stdout, stderr } = await p_exec(spoon_ex);

                let spoon_lines = stdout.split("\n");
                for (let i = 0; i < spoon_lines.length - 1; i++) {
                    // o.log(spoon_lines[i]);
                    const some_pid = spoon_lines[i].split('","')[1];
                    // found active self processes
                    if (k_[some_pid]) {
                        kill.push(some_pid);
                    }
                }
            };
            await get_kill_list();
            const kill_kill = async () => {
                const k_command = `taskkill ${[...kill.flatMap((pid) => ["/PID", pid])].join(
                    " ",
                )} /f /t`;
                const { stdout, stderr } = await p_exec(k_command);
                if (this.debug === DEBUG_FTR.KILL) {
                    o.log(stdout);
                    o.errata(stderr);
                }
            };
            if (kill.length) {
                await kill_kill();
            }
        };
    }
    return new _Proc_Util(args);
};
type IO = () => void | undefined;
type Std_IO = (s: str) => void;
// type Arg_Formatter = (args: any[]) => str;
type LabelWrap = (args: LabelWrapArgs) => IO | undefined;
type LabelWrapArgs = { label?: str; color?: str; bar?: str; main_color: str };
type PostWrap = (args: { is_defi_IO?: IO }) => IO | undefined;
// // The following 4 may move out of this
// prefix: LabelWrap; // subproc ops...
// post: PostWrap;
// sub_proc_prefix: IO;
// stdout: Std_IO;

module.exports = Proc_Util;
