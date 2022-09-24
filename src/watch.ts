/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import fs, { watchFile, unwatchFile } from "fs";
import { str, Watch_Args } from "./interface.js";
const { readdir, stat } = fs.promises;
import path from "path";
import { Ops_Generator, Ops } from "./util/ops.js";

// pause before monitoring the args.src / an Array | dir(s) | file /
const DEFAULT_INITIAL_WATCH_DELAY = 3500;

// no context ~ paths here are absolute
const MAX_DEPTH = 6;
const ABYSS_DEBUG = true; // as in console.log

// some WIP mess
// const is_json = (f: string) => /[.]json/.exec(f);
// const is_tsconfig = (f) => /tsconfig[.]json/.exec(f);
// ~ tsconfig.storage_api-blah.blah.json
// const is_some_tsconfig = (f: string) => /tsconfig[.a-zA-Z\_\-]*[.]json/.exec(f);
// \/|\\ -> either /dist or \dist - dist w/some non-optional seperator prepended
// (f: string) => {
//     // the parens around the last two are implied via syntax
//     return is_dist(f) || is_log(f) || is_etc(f) || (is_json(f) && !is_some_tsconfig(f));
// };

const IGNORE_REGEX_global = [/[.]log/, /\/|\\dist/, /log[.]sh/];

export abstract class Watch_Abstract {
    constructor(_args: Watch_Args) {}
    abstract watches_clear: () => void;
}

export type Watch_Proxy = (args: Watch_Args) => Watch_Abstract;
export const Watch: Watch_Proxy = (args: Watch_Args) => {
    // // set in constructor
    let o: Ops;

    // nothing explicitly async
    class _Watch implements Watch_Abstract {
        debug: number = 2;
        trigger: any;
        watch: Array<string>;
        ignore?: RegExp[] = IGNORE_REGEX_global;
        watchers: Array<any> = [];
        full_file_paths: Array<string> = [];
        path_hasher: Array<any> = [];
        poll: number = 5000;

        // watch: Array of full paths | dir - full_root_src_dir_path | single file - fullpath
        constructor({ ops, paths, trigger, name, ignore, ...opts }: Watch_Args) {
            let label: str | undefined;
            if (name?.length) label = `${name}|Watcher`;
            if (opts.debug !== undefined) this.debug = opts.debug;
            // else label = `Watcher - `;
            // An Env Configured Ops rebased for `Watch`
            if (!ops) ops = new Ops_Generator();
            o = ops.ops_with_conf({ colors: opts.colors, debug: this.debug, label });
            // If used stand-alone only create if opts.files ... Fatal, configuration must be valid
            if (!paths?.length)
                throw new Error("No need for a special proc if no path(s) to watch.");
            if (!trigger) throw new Error("No need for watch if no trigger.");
            this.trigger = trigger; // trigger = an async fn
            if (ignore) {
                if (!Array.isArray(ignore)) throw new Error("Watch.ignore is not an array");
                this.ignore = [...ignore, ...this.ignore];
            }
            if (o.defi(opts.poll)) {
                if (typeof opts.poll === "number") {
                    this.poll = Math.max(opts.poll, 1000);
                } else {
                    throw new Error("Unrecognized Watcer arg: poll, number only");
                }
            }
            // prepare all the paths & subpaths
            this.init_watch_list(paths);
            let watch_delay = opts.delay;
            if (watch_delay === undefined) {
                watch_delay = DEFAULT_INITIAL_WATCH_DELAY;
            }
            // from syncronous to syncronous
            setTimeout(() => {
                this.watch_start();
                const watch_log = `watch constructor completed & watch has started. f:[${this.full_file_paths.length}]`;
                o.lightly(7, watch_log);
            }, watch_delay);
        }
        init_watch_list(files: Watch_Args["paths"]) {
            try {
                if (Array.isArray(files)) {
                    this.watch = files;
                    this.watch.forEach((full_path) => {
                        this.initialize_path(full_path, 1);
                    });
                } else {
                    // singular
                    this.watch = [files];
                    this.initialize_path(files);
                }
            } catch (err) {
                const err_copy = `src file/dir not found or stat failed, fix/use fullpath(s) - err: ${err}`;
                o._l(1, `${err_copy}`);
                // Fatal, configuration must be valid
                throw new Error(err_copy);
            }
        }
        watch_start() {
            this.full_file_paths.forEach((full_path) => {
                // o._l(1,`server_proc.js | [${this.name}] - watch: ${full_path}`);
                // USE_PATH_test since dist/ or *.log can be inside watch dir
                this.watchers.push(watchFile(full_path, { interval: this.poll }, this.watch_hit()));
            });

            o._l(10, `watch_init completed, watching paths:\n${o.pretty(this.full_file_paths)}`);
        }
        any_regex_match = (reg: RegExp[], full_path: str) => {
            for (let i = 0; i < reg.length; i++) if (reg[i].exec(full_path)) return true;
            return false;
        };
        // truthy/falsy not a boolean _ b cause named nice & with read-ablity
        _ignore_path(full_path: string) {
            return this.any_regex_match(this.ignore, full_path);
        }
        initialize_path(a_path: string, depth = 0) {
            // path_hasher not yet, just a safety (we have depth limit working)
            // not well tested
            if (this.path_hasher[encodeURIComponent(a_path) as any] || this._ignore_path(a_path))
                return;
            // </circular linkage avoidance>
            this.path_hasher[encodeURIComponent(a_path) as any] = 1; // now is some truthy

            try {
                o._l(10, `watch path: ${a_path}`);
                const stat_pr = stat(a_path);
                stat_pr.then((stat_info) => {
                    if (!stat_info.isDirectory()) {
                        // single file -> watch q
                        this.full_file_paths.push(a_path);
                    } else {
                        if (depth < MAX_DEPTH) {
                            readdir(a_path).then((filenames) =>
                                filenames.forEach((filename) => {
                                    let next_path = path.resolve(a_path, filename);
                                    this.initialize_path(next_path, depth + 1);
                                }),
                            );
                        } else {
                            if (ABYSS_DEBUG) {
                                o._l(
                                    2,
                                    `the members of this deep dir have been ignored: ${a_path}`,
                                );
                            }
                        }
                    }
                });
            } catch (err) {
                o.errata(1, `watch_init err: ${err}`);
                // Fatal, configuration must be valid
                throw new Error("src filepath or dir path not found, use fullpath or fullpaths[].");
            }
        }
        // with this = this
        watch_hit = () => (curr: fs.Stats, prev: fs.Stats) => {
            o.errata(10, `watch_hit: this: ${this}`);
            // only when a file is changed ... not possible for dir watch - fs.watch
            curr.mtime !== prev.mtime && this.trigger();
        };
        watch_triggerred(filename: string) {
            o.errata(10, `watch_triggerred: ${filename}`);
            this.trigger();
        }
        // WIP pass func for specificity
        watches_clear() {
            o.errata(10, `unwatch all`);
            // for fs.watch(dir) -> later -> .close()
            // this.watchers?.forEach((watcher) => {
            //     watcher.close();
            // });
            this.full_file_paths.forEach((full_path) => {
                // note from def: all listeners of "full_path" are removed
                unwatchFile(full_path); // , this.watch_hit <- rather needs specific method
            });
            // this.watchers.forEach((watcher) => {
            //     watcher.unref();
            // });
            this.watchers = null;
        }
    }
    return new _Watch(args);
};

export default Watch;
