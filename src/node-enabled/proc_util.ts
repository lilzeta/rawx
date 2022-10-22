// module.exports = Proc_Util;
import { ChildProcess } from "child_process";
import { O, str } from "../ops/index";
import { Basic_Proc_Stdio, Setup_Proc_Util_Args } from "./args_types";
import { Proc_Util_C, Proc_Util_I } from "./export_types";
import { P, _P } from "./proc_type_defs";

// const ESCAPE = "\x1B";
// AKA SET no color escape code (in utf mode)
const NO: str = `\x1B[0m`;
interface Inherit {
    inherit_ops: O;
}

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
    class _Proc_Util implements Proc_Util_I {
        constructor(args: { inherit_ops: O }) {
            o = args.inherit_ops;
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
                        fleck: colors["fleck"],
                        main_color: colors["forky"],
                    });
                let forky_post = this.post({ is_defi_IO: forky_sub_pass_through });
                sub_proc.on("close", (code) => {
                    // With named label
                    if (o.debug) {
                        forky_sub_pass_through?.();
                        o.forky(2, `</child-process> \\\\_ closed w/code: ${code}`);
                        forky_post?.();
                    }
                    on_close(sub_proc.pid);
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
    }
    return new _Proc_Util(args);
};
type IO = () => void | undefined;
type Std_IO = (s: str) => void;
// type Arg_Formatter = (args: any[]) => str;
type LabelWrap = (args: LabelWrapArgs) => IO | undefined;
type LabelWrapArgs = { label?: str; color?: str; fleck?: str; main_color: str };
type PostWrap = (args: { is_defi_IO?: IO }) => IO | undefined;
// // The following 4 may move out of this
// prefix: LabelWrap; // subproc ops...
// post: PostWrap;
// sub_proc_prefix: IO;
// stdout: Std_IO;

module.exports = Proc_Util;
