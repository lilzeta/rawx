/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
const { join, resolve } = require("path");
const Ops: Ops_Gen = require("../../ops/ops");
import { Files_Tree_Args, Matchers, Match_Item_Arg } from "../args_types";
import { O, Ops_Gen, str } from "../../ops";
import { Files_Tree_I, Trunk_Paths } from "../export_types";

// a made up thing, somebody has no doubt named this before
// Allows inference through null propogation, seems effecient
// aka include?.(string) is correct for false|undefined both_

// experimental gigawhats_test?.() a hollow-able performance `skiv?`
type Juke = ((s: str) => boolean) | undefined;
// the internal version of matchers: Matchers;
interface _Matchers {
    include?: Juke;
    exclude?: Juke;
    include_dir?: Juke;
    exclude_dir?: Juke;
}
// a stateful cursor
interface _Squirrel {
    depth: number;
    pwd: string;
    // TODO :true?
    path_hasher: { [s: str]: any };
}
export type Files_Tree_C = new (args: Files_Tree_Args) => Files_Tree_I;
const files_tree: Files_Tree_C = (() => {
    // externals
    const { readdir, stat } = require("fs/promises");
    // Just a quicky with defaults
    let o: O = new Ops();

    const get_jukes = (match?: Matchers): _Matchers | undefined => {
        if (!match) return undefined;
        // o.accent(1, `match`);
        // o.accent(1, match);
        const _m = map_to_reg_arr(match);
        // o.accent(1, `_m`);
        // o.accent(1, _m);
        /**
         * in the parity that delivers
         * the mostest not not propererist juke
         * true => terminate branch search
         * */
        /**
         * inc_match, true => deny (as in end goal of false to pass)
         * null propogated => false
         * has include, no match => !false
         * has include, any match => true => !true
         * */
        const inc = (s: string, reg_arr: Reg_Arr, i = 0): false | RegExpMatchArray => {
            if (i >= reg_arr.length) return false;
            return reg_arr[i].exec(s) || inc(s, reg_arr, i + 1);
        };
        /**
         * ex_match, true => deny (as in end goal of false to pass)
         * null propogated => false
         * has exclude => no match => false
         * has exclude => any match => true
         * */
        const exl = (s: str, reg_arr: Reg_Arr, i = 0): false | RegExpMatchArray => {
            if (i >= reg_arr.length) return false;
            return reg_arr[i].exec(s) ?? exl(s, reg_arr, i + 1);
        };
        const include = _m.include ? (s: str) => !inc(s, _m.include) : undefined;
        const exclude = _m.exclude ? (s: str) => exl(s, _m.exclude) && true : undefined;
        const include_dir = _m.include_dir ? (s: str) => !inc(s, _m.include_dir) : undefined;
        const exclude_dir = _m.exclude_dir
            ? (s: str) => exl(s, _m.exclude_dir) && true
            : undefined;
        return { include, exclude, include_dir, exclude_dir };
    };

    // backasswards in reverse is not a fish
    const puff = (prop_name: str, q?: Match_Item_Arg) => {
        if (q !== undefined) {
            return { [prop_name]: str_match_to_reg(q) };
        }
        return undefined;
    };
    // strange one, yet extremely satisfying
    const map_to_reg_arr = (match: Matchers): _Matchers_Reg_Arr => {
        return {
            ...puff("include", match.include),
            ...puff("exclude", match.exclude),
            ...puff("include_dir", match.include_dir),
            ...puff("exclude_dir", match.exclude_dir),
        };
    };

    const str_match_to_reg = (
        item: Match_Item_Arg,
        flattened: Array<RegExp> = [],
    ): Array<RegExp> => {
        if (typeof item === "string") {
            return [str_to_reg(item)];
        }
        if (Array.isArray(item)) {
            const sub_map: Array<RegExp> = (item as Array<Match_Item_Arg>).map(
                (sub: Match_Item_Arg) => {
                    if (typeof sub === "string") {
                        return str_to_reg(sub as string);
                    } else return sub;
                },
            ) as Array<RegExp>;
            return sub_map;
        }
        if (typeof item !== "object") {
            throw new Error(`inrecognized match item: ${item}`);
        }
        // if (RegExp.prototype === (item as RegExp).prototype)???
        if ((item as RegExp).exec)
            // a bit hack
            flattened.push(item as RegExp);
        return flattened;
    };

    /**
     * WIP, prob find some util module to do this, ick
     * Converts input arg string w/wildcards to equiv RegExp
     * @param s input arg of the format *.ext
     * @returns equiv RegExp
     */
    //
    const str_to_reg = (s: str) => {
        // \s is space
        const prep = s.replace(" ", "\\s");
        // escape extension .
        const s_joined = prep.split(".").join("\\.");
        // replace wild with any count of word-char/hyphen
        const spl_wild = s_joined.split("*").join("[\\w-]*");
        o.accent(9, `spl_wild`);
        o.accent(9, spl_wild);
        return new RegExp(spl_wild);
    };
    return class File_Tree_Class implements Files_Tree_I {
        _trunks: Array<Trunk_Paths> = [];
        max_depth: number = 8;
        root_resolved_paths: readonly string[];
        _reg?: _Matchers;
        reg_args: Matchers;
        constructor(args: Files_Tree_Args) {
            this.reg_args = args.match;
            if (o.defi(args.max_depth)) this.max_depth = args.max_depth as number;
            o.forky(10, `args.root_paths:`);
            o.forky(10, args.root_paths);
            // try to resolve base paths for a quick throw on misconfigured
            this.root_resolved_paths = args.root_paths.reduce(
                (propogater: Array<str>, root_path: str) => {
                    try {
                        propogater.push(resolve(root_path));
                    } catch (err) {
                        throw new Error(
                            `a path sent as a root or absolute path did not resolve: ${root_path}`,
                        );
                    }
                    return propogater;
                },
                [],
            );
            this._reg = get_jukes(args.match);
            o.accent(10, `this._reg: `);
            o.accent(10, this._reg);
        }
        // These are all in a way syncro, TODO async ->{...sq} issues
        // One Quick Squirrel...
        setup_tree = async () => {
            const once_per_trunk = async (i = 0): Promise<Array<Trunk_Paths>> => {
                const r_path_len = this.root_resolved_paths.length;
                if (i >= r_path_len) return [];
                const sq: _Squirrel = {
                    depth: 0,
                    pwd: this.root_resolved_paths[i],
                    path_hasher: {},
                };
                const returned_trunk = await this.watch_sub_path(sq);
                const rest_of_trunks = await once_per_trunk(i + 1);
                return [returned_trunk, ...rest_of_trunks];
            };
            this._trunks = await once_per_trunk();
            o.accent(8, `this.trunks: `);
            o.accent(8, this._trunks);
        };

        public trunks = () => {
            return this._trunks;
        };

        // TODO catch, this function sees every non root path first
        async watch_sub_path(sq: _Squirrel): Promise<Array<string>> {
            // o.accent(1, `watch_sub_path sq: `);
            // o.accent(1, sq);
            if (sq.depth > this.max_depth) {
                return [];
            }
            const hash: string = encodeURIComponent(sq.pwd);
            if (o.defi(sq.path_hasher[hash])) {
                return [];
            }
            sq.path_hasher = Object.assign(sq.path_hasher, [hash]);
            const stat_info = await stat(sq.pwd);
            if (stat_info.isDirectory()) {
                o.accent(8, `this._reg?.include_dir?.(sq.pwd):`);
                o.accent(8, this._reg?.include_dir?.(sq.pwd));
                o.accent(8, `this._reg?.exclude_dir?.(sq.pwd):`);
                o.accent(8, this._reg?.exclude_dir?.(sq.pwd));
                if (this._reg?.include_dir?.(sq.pwd)) return [];
                if (this._reg?.exclude_dir?.(sq.pwd)) return [];
                if (sq.depth > this.max_depth) {
                    if (ABYSS_DEBUG) {
                        o.log(2, `the members of this deep dir have been ignored: ${sq.pwd}`);
                    }
                    return [];
                }
                return await this.read_dir(sq);
            } else {
                // non-dir done&leaf
                if (this._reg?.include?.(sq.pwd)) return [];
                if (this._reg?.exclude?.(sq.pwd)) return [];
                return [sq.pwd];
            }
        } // TODO catch

        sub_paths_iterator = async (sub_paths: str[], sq: _Squirrel): Promise<Array<str>> => {
            const sq_pwd_enters = sq.pwd;
            const sq_i_enters = sq.depth;
            const for_each_path = async (i = 0): Promise<Array<str>> => {
                if (i >= sub_paths.length) return [];
                // o.errata(1, `sub_paths_iterator - sub_paths[${i}]`);
                // o.errata(1, sub_paths[i]);
                sq.pwd = join(sq_pwd_enters, sub_paths[i]);
                sq.depth = sq_i_enters + 1;
                const inner_paths = await this.watch_sub_path(sq);
                const next_br_returns = await for_each_path(i + 1);
                return [...inner_paths, ...next_br_returns];
            };
            const ret_paths = await for_each_path();
            // sq.pwd = sq_enters;
            return ret_paths;
        };

        async read_dir(sq: _Squirrel): Promise<Array<str>> {
            const files = await readdir(sq.pwd);
            const full_subpaths: str[] = [];
            for (const filename of files) full_subpaths.push(filename);
            return await this.sub_paths_iterator(full_subpaths, sq);
        }
    }; // const files_tree: Files_Tree  <= return class File_Tree_Class (with a closure)
})();

type Reg_Arr = RegExp[];
interface _Matchers_Reg_Arr {
    include?: Reg_Arr;
    exclude?: Reg_Arr;
    include_dir?: Reg_Arr;
    exclude_dir?: Reg_Arr;
}
// TODO WIP removal of String_Keyed, no exports of
// interface String_Keyed {
//     [s: str]: any;
// }
// TODO configurable for
const ABYSS_DEBUG = true;

module.exports = files_tree;
