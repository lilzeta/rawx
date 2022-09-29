/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// externals
import fs, { watchFile, unwatchFile } from "fs";
// from self
import { Complex, str, Watch_Args } from "./types/interface.js";
import { Ops } from "./ops/ops.js";
import { File_Tree } from "./file_tree/tree_files.js";
import { Complex_File_Tree } from "./file_tree/tree_complex.js";

// pause before monitoring the args.src / an Array | dir(s) | file /
const DEFAULT_INITIAL_WATCH_DELAY = 3500;
export abstract class Watch_Abstract {
    constructor(_args: Watch_Args) {}
    abstract watches_clear: () => Promise<void>;
    abstract set_trigger: (fn: Watch_Trigger) => void;
}
export type Trigger = number | undefined;
export type Trigger_Map = Array<Trigger>;
export type Full_Trigger_Map = Array<Trigger_Map>;
export type Watch_Proxy = (args: Watch_Args) => Watch_Abstract;
export type Watch_Trigger = (path: str, target?: number) => void;
export const Watch: Watch_Proxy = (args: Watch_Args) => {
    // // set in constructor
    let o: Ops;

    // nothing explicitly async
    class _Watch extends Watch_Abstract {
        debug: number = 2;
        // for both _file_tree/_complex
        // trigger: (path: str, target?: number) => void;
        // fallback or default if no specifily aligned trigger
        trigger_index?: number;
        // if using trigger_indices - length should match watch.paths
        trigger_indices?: Full_Trigger_Map;
        simple_trigger_indices?: Array<number>;
        full_file_paths: Array<string> = [];
        path_hasher: Array<any> = [];
        poll: number = 5000;
        // Either: _file_tree for single tree, _complex for fully explicated forest
        _file_tree: File_Tree;
        _complex: Complex_File_Tree;
        constructor(args: Watch_Args) {
            super(args);
            let { paths, name, ...opts } = args;
            let label: str | undefined;
            if (name?.length) label = `${name}|Watcher`;
            else label = "";
            if (args.debug !== undefined) {
                this.debug = args.debug;
            }
            // An Env Configured Ops rebased for `Watch`
            o = Ops({ colors: opts.colors, debug: this.debug, label });
            // If used stand-alone only create if opts.files ... Fatal, configuration must be valid
            if (!paths?.length && !args.complex)
                throw new Error("No need for a special proc if no path(s) to watch.");
            if (o.defi(args.trigger_index)) this.trigger_index = args.trigger_index;
            const { complex, match, trigger_index } = opts;
            if (o.defi(args.complex)) {
                // Doesn't use watch.paths right now
                this._complex = new Complex_File_Tree({
                    complex,
                    match,
                    max_depth: 7,
                });
                this.trigger_indices = this.map_complex_triggers({
                    complex,
                    default_trigger: trigger_index,
                });
            } else {
                this.simple_trigger_indices = args.trigger_indices;
                this._file_tree = new File_Tree({
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
            setTimeout(() => {
                if (!this.trigger) {
                    throw new Error(
                        "Instantiation of Watch is incomplete, trigger must be set",
                    );
                }
                this.watch_start().catch(); // TODO other solution to engage promises?
                const watch_log = `watch constructor completed & watch has started. f:[${this.full_file_paths.length}]`;
                o.accent(6, watch_log);
            }, watch_delay);
        }

        // Must be done immediately from an injector/instatiator/partner/server ...
        public set_trigger = (fn: Watch_Trigger) => (this.trigger = fn);
        trigger: Watch_Trigger | undefined = undefined;

        async watch_start() {
            if (this._complex) {
                await this._complex.setup_complex_tree();
                this._complex.trees.forEach((file_tree, i) => {
                    this.watch_tree(file_tree, i);
                });
                if (this.debug > 7) {
                    this._complex.trees.forEach((file_tree) => {
                        o.accent(8, file_tree.trunks);
                    });
                }
            } else {
                await this._file_tree.setup_tree();
                this.watch_tree(this._file_tree);
            }
        }

        watch_tree(file_tree: File_Tree, n?: number) {
            file_tree.trunks.forEach((path_arr: str[], i) => {
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
            (path: str, trigger_index?: number) => (curr: fs.Stats, prev: fs.Stats) => {
                o.errata(8, `watch_hit, path: ${path}`);
                // only when a file is changed ... not possible for dir watch - fs.watch
                o.errata(9, `watch_hit, trigger_index: ${trigger_index}`);
                curr.mtime !== prev.mtime && this.trigger(path, trigger_index);
            };

        watches_clear = async () => {
            if (this._complex) {
                this._complex.trees.forEach((file_tree) => {
                    this.unwatch_tree(file_tree);
                });
            } else {
                this.unwatch_tree(this._file_tree);
            }
        };
        // Some ambiguities and validation to work out yet
        map_complex_triggers({
            complex: complex_arr,
            default_trigger,
        }: {
            complex: Array<Complex>;
            default_trigger?: number;
        }): Full_Trigger_Map {
            return complex_arr.reduce((propogate: Full_Trigger_Map, complex: Complex, i) => {
                propogate.push([]); // as in propogate[i] = []
                let sub_map: (n: number) => Trigger;
                if (complex.trigger_indices)
                    sub_map = (n: number) => complex.trigger_indices[n] ?? default_trigger;
                else sub_map = (_: number) => complex.trigger_index ?? default_trigger;
                complex.paths.forEach((_root_path, n) => {
                    propogate[i].push(sub_map(n));
                });
                return propogate;
            }, Array<Trigger_Map>());
        }

        unwatch_tree(file_tree: File_Tree) {
            file_tree.trunks.forEach((path_arr: str[]) => {
                path_arr.forEach((path) => {
                    unwatchFile(path);
                });
            });
        }
    }
    return new _Watch(args);
};

export default Watch;
