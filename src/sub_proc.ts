import { ChildProcess } from "child_process";
import { str } from "./types/interface.js";
import { Silencer } from "./types/proc_interface.js";
import { Ops, IO, simple_clean } from "./ops/ops.js";

export interface Setup_Sub_Proc_Args {
    sub_proc: ChildProcess;
    label: str;
    silence?: Silencer;
    on_close: (pid: number) => void;
}

let o: Ops;
export class Sub_Proc {
    constructor(args: { inherit_ops: Ops }) {
        o = args.inherit_ops;
    }
    // There isn't an elegant module for this, it's half Ops/half proc runtime
    // Used after each subproc starts, may move this to another class
    _setup_subproc = ({ sub_proc, silence, on_close }: Setup_Sub_Proc_Args) => {
        let jiggler;
        const colors = o.colors;
        // No <-> deco on normal stdout/stderr - color pass-through
        if (!silence) {
            let sub_pass_through: IO;
            // no label for proc std_out
            if (o.colors.default?.length) sub_pass_through = () => o.stdout(colors.default);
            let post = o.post({ is_defi_IO: sub_pass_through });
            sub_proc.stdout.on("data", (data) => {
                if ((jiggler = simple_clean(data)).length) {
                    sub_pass_through?.();
                    o.stdout(jiggler);
                    post?.();
                }
            });
        }

        if (silence !== "all" && o.debug) {
            let err_sub_pass_through: IO;
            // no label for proc std_out
            if (colors.errata?.length) err_sub_pass_through = () => o.stdout(colors.errata);
            let err_post = o.post({ is_defi_IO: err_sub_pass_through });
            sub_proc.stderr.on("data", (data) => {
                if ((jiggler = simple_clean(data)).length) {
                    err_sub_pass_through?.();
                    console.log(jiggler);
                    err_post?.();
                }
            });
            // WIP - _TODO_ (Multiple subpass labels affixed!)
            let forky_sub_pass_through: IO;
            // no label for proc std_out
            if (colors.forky?.length)
                forky_sub_pass_through = o.prefix({
                    label: o.label,
                    color: colors["label"],
                    fleck: colors["fleck"],
                    main_color: colors["forky"],
                });
            let forky_post = o.post({ is_defi_IO: forky_sub_pass_through });
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
}
