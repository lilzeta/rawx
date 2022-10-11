/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { Ops_Gen, Log } from "../../ops/index";
import { str } from "../../util";
import { Files_Tree_C, Files_Tree_I, Matchers } from "./files_tree";
const Ops: Ops_Gen = require("../../ops/ops.js");
const Files_Tree: Files_Tree_C = require("./files_tree");

export interface Files_Complex_I {
    setup_complex_tree: () => Promise<void>;
    trees(): Array<Files_Tree_I>;
}
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
    // trigger_index | trigger_indices
    trigger_index?: number;
    trigger_indices?: number[];
    // select_procs?: number[];???
}

let accent: Log;
export type Files_Complex_C = new (args: Files_Complex_Args) => Files_Complex_I;
class Files_Complex implements Files_Complex_I {
    _trees: Array<Files_Tree_I>;
    // Will remove from class when done testing
    complex_opts: Complex_Arg[];
    debug: number = 9;
    constructor({ complex: c_arg, match }: Files_Complex_Args) {
        // Just a quicky with defaults
        ({ accent } = new Ops());
        this._trees = [];
        this.complex_opts = c_arg;
        c_arg.forEach((complex: Complex_Arg) => [
            this._trees.push(
                new Files_Tree({
                    root_paths: complex.paths,
                    match: {
                        ...match,
                        ...complex.match,
                    },
                }),
            ),
        ]);
        // o._l(11, `this.trees`);
        // o._l(11, this.trees);
    }
    public trees = () => {
        return this._trees;
    };
    // These are all in a way syncro, TODO async ->{...sq} issues
    async setup_complex_tree() {
        const once_per_complex = async (i = 0): Promise<void> => {
            if (i >= this.trees.length) return;
            const f_tree = this._trees[i];
            await f_tree.setup_tree();
            await once_per_complex(i + 1);
        };
        await once_per_complex();
        if (this.debug > 9)
            accent(
                10,
                this._trees.map((tree) => tree.trunks),
            );
    }
}

module.exports = Files_Complex;
