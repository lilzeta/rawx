/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { Complex, Matchers } from "../types/interface.js";
import { File_Tree } from "./tree_files.js";
import { Ops } from "../ops/ops.js";

let o: Ops;

export interface Complex_Tree_Args {
    complex: Complex[];
    match?: Matchers;
    max_depth?: number;
}

export class Complex_File_Tree {
    trees: Array<File_Tree>;
    complex_opts: Complex[];
    debug: number = 9;
    constructor({ complex: c_arg, match }: Complex_Tree_Args) {
        // Just a quicky with defaults
        o = Ops();
        this.trees = [];
        this.complex_opts = c_arg;
        c_arg.forEach((complex: Complex) => [
            this.trees.push(
                new File_Tree({
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
    // These are all in a way syncro, TODO async ->{...sq} issues
    async setup_complex_tree() {
        const once_per_complex = async (i = 0): Promise<void> => {
            if (i >= this.trees.length) return;
            const f_tree = this.trees[i];
            await f_tree.setup_tree();
            await once_per_complex(i + 1);
        };
        await once_per_complex();
        if (this.debug > 9)
            o.accent(
                10,
                this.trees.map((tree) => tree.trunks),
            );
    }
}
