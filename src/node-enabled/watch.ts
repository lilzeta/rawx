/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = Watch;
// externals
const { watchFile, unwatchFile, Stats } = require("fs");

// Types
import { Require_Only_One } from "../util/validation/validator";
import { Color_Targets, O, Ops_Gen } from "../ops/index";
import { Files_Tree_C, Files_Tree_I, Matchers } from "./files_tree/index";
import { Complex_Arg, Files_Complex_Args, Files_Complex_I } from "./files_tree/index";
import { Class_Proxy_F, str } from "../util";

// modulez require
const Ops: Ops_Gen = require("../ops/ops");
const Files_Tree: Files_Tree_C = require("./files_tree/files_tree");
const Complex_File_Tree = require("./files_tree/files_complex");

// Watch_I = type after new Watch(...)
export interface Watch_I {
    watches_clear: () => Promise<void>;
    set_trigger: (fn: Watch_Trigger) => void;
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
// Some args[] typedefs
export type Watch_Trigger = (path: str, target?: number) => void;
export type Trigger = number | undefined;
export type Trigger_Map = Array<Trigger>;
export type Full_Trigger_Map = Array<Trigger_Map>;

// pause before monitoring the file_tree
const DEFAULT_INITIAL_WATCH_DELAY = 3500;

// Wrappers for a _Watch closure w/Ops env
export type Watch_C = new (args: Watch_Args) => Watch_I;
// Server_Facade behaves as would exposed inner _Server
class Watch_Facade {
    constructor(args: Watch_Args) {
        return watch_creator(args) as Watch_I;
    }
}
// Now we expose _Watch through Watch_Facade as if we created it w/vanilla
const Watch = Watch_Facade as Watch_C;
type Watch_Creator = (args: Watch_Args) => Watch_I;
const watch_creator: Watch_Creator = (args: Watch_Args) => {
    // set in constructor
    let o: O;

    // const Watch: Watch_Class = class _Watch <= return into w/a closure
    class _Watch implements Watch_I {
        debug: number = 2;
        // for both _file_tree/_complex
        // trigger: (path: str, target?: number) => void;
        // fallback or default if no specifily aligned trigger
        trigger_index?: number;
        // if using trigger_indices - length should match watch.paths
        trigger_indices?: Full_Trigger_Map;
        simple_trigger_indices?: Array<number>;
        trigger_path_count: number = 0;
        path_hasher: Array<any> = [];
        poll: number = 5000;
        // Either: _file_tree for single tree, _complex for fully explicated forest
        files_tree: Files_Tree_I;
        _complex: Files_Complex_I;
        constructor(args: Watch_Args) {
            let { paths, name, ...opts } = args;
            let label: str | undefined;
            if (name?.length) label = `${name}|Watcher`;
            else label = "";
            if (args.debug !== undefined) {
                this.debug = args.debug;
            }
            // An Env Configured Ops rebased for `Watch`
            o = new Ops({ colors: opts.colors, debug: this.debug, label });
            // If used stand-alone only create if opts.files ... Fatal, configuration must be valid
            if (!paths?.length && !args.complex)
                throw new Error("No need for a special proc if no path(s) to watch.");
            if (o.defi(args.trigger_index)) this.trigger_index = args.trigger_index;
            const { complex, match, trigger_index } = opts;
            if (o.defi(args.complex)) {
                // Doesn't use watch.paths right now
                this._complex = new Complex_File_Tree({
                    // what are we gonna do about this?
                    complex: complex.complex,
                    match,
                    max_depth: 7,
                });
                this.trigger_indices = this.map_complex_triggers({
                    complex: complex.complex,
                    default_trigger: trigger_index,
                });
            } else {
                this.simple_trigger_indices = args.trigger_indices;
                this.files_tree = new Files_Tree({
                    root_paths: paths,
                    match,
                });
            }
            // this.trigger = trigger; // trigger = an async fn
            if (o.defi(opts.poll)) {
                if (typeof opts.poll === "number") {
                    this.poll = Math.max(opts.poll, 1000);
                } else {
                    throw new Error("Validation of Watch.poll arg failed, number only");
                }
            }
            let watch_delay = opts.delay;
            if (!o.defi(watch_delay)) {
                watch_delay = DEFAULT_INITIAL_WATCH_DELAY;
            }

            // from syncronous to asyncronous
            setTimeout(async () => {
                if (!this.trigger) {
                    throw new Error(
                        "Instantiation of Watch is incomplete, trigger must be set",
                    );
                }
                await this.watch_start().catch(); // TODO other solution to engage promises?
                const watch_log = `watch constructor completed & watch has started. f:[${this.trigger_path_count}]`;
                o.accent(6, watch_log);
            }, watch_delay);
        }

        // Must be done immediately from an injector/instatiator/partner/server ...
        public set_trigger = (fn: Watch_Trigger) => (this.trigger = fn);
        trigger: Watch_Trigger;

        async watch_start() {
            // TODO validate set_trigger has set trigger!
            if (this._complex) {
                await this._complex.setup_complex_tree();
                this._complex.trees().forEach((file_tree: Files_Tree_I, i: number) => {
                    this.watch_tree(file_tree, i);
                });
                if (this.debug > 7) {
                    this._complex.trees().forEach((file_tree: Files_Tree_I) => {
                        o.accent(8, file_tree.trunks());
                    });
                }
            } else {
                // if !watches cleared already
                if (this.files_tree !== undefined) {
                    await this.files_tree.setup_tree();
                    this.watch_tree(this.files_tree);
                }
            }
        }
        // TODO validation, if n=0 trigger_indices[0] array length must match trunks[0] length...
        watch_tree(files_tree: Files_Tree_I, n: number = 0) {
            files_tree.trunks().forEach((path_arr: readonly str[], i: number) => {
                this.trigger_path_count += path_arr.length;
                let trigger_index: Trigger;
                // Complex
                if (this.trigger_indices) {
                    // TODO something more stable
                    o.accent(1, `this.trigger_indices`);
                    o.accent(1, this.trigger_indices);
                    trigger_index = this.trigger_indices[n][i];
                }
                // not Complex
                else if (this.simple_trigger_indices) {
                    // TODO validate?
                    trigger_index = this.simple_trigger_indices[i];
                } else {
                    // The single trigger case
                    trigger_index = this.trigger_index; // undefined is ok?
                }
                path_arr.forEach((path) => {
                    watchFile(
                        path,
                        { interval: this.poll },
                        this.watch_hit(path, trigger_index),
                    );
                });
            });
        }

        watch_hit =
            (path: str, trigger_index?: number) =>
            (curr: typeof Stats, prev: typeof Stats) => {
                o.errata(8, `watch_hit, path: ${path}`);
                // only when a file is changed ... not possible for dir watch - fs.watch
                o.errata(9, `watch_hit, trigger_index: ${trigger_index}`);
                curr.mtime !== prev.mtime && this.trigger(path, trigger_index);
            };

        watches_clear = async () => {
            if (this._complex) {
                this._complex.trees().forEach((file_tree: Files_Tree_I) => {
                    this.unwatch_tree(file_tree);
                });
                this._complex = undefined;
                this.files_tree = undefined;
            } else {
                if (this.files_tree) this.unwatch_tree(this.files_tree);
                this.files_tree = undefined;
            }
        };
        // Some ambiguities and validation to work out yet
        map_complex_triggers({
            complex: complex_arr,
            default_trigger,
        }: {
            complex: Complex_Arg[];
            default_trigger?: number;
        }): Full_Trigger_Map {
            return complex_arr.reduce(
                (propogate: Full_Trigger_Map, complex: Complex_Arg, i) => {
                    propogate.push([]); // as in propogate[i] = []
                    let sub_map: (n: number) => Trigger;
                    if (complex.trigger_indices)
                        // TODO why is the ? needed ...linting errata
                        sub_map = (n: number) =>
                            complex.trigger_indices?.[n] ?? default_trigger;
                    else sub_map = (_: number) => complex.trigger_index ?? default_trigger;
                    complex.paths.forEach((_root_path, n) => {
                        propogate[i].push(sub_map(n));
                    });
                    return propogate;
                },
                Array<Trigger_Map>(),
            );
        }

        unwatch_tree(file_tree: Files_Tree_I) {
            file_tree.trunks().forEach((path_arr: readonly str[]) => {
                path_arr.forEach((path) => {
                    unwatchFile(path);
                });
            });
        }
    }
    return new _Watch(args);
};
module.exports = Watch;
