import path from "path";
import { npm_build, Watch, some_colors } from "rawx";
import { setTimeout as wait } from "timers/promises";
import { existsSync } from "fs";

const test = path.resolve("test");
const subserver_conf = path.join(test, "simple.js");
const src_context = path.resolve("src");
const paths = [subserver_conf, src_context];
const dist = path.resolve("dist");
const dist_index = path.join(dist, "index.js");

// Fairly difficult to unwrap these layers, needs require transpile...
(async () => {
    let NO_CACHE = 0;
    let server, Server;
    // let build_watch;
    const on_build_exists = async (first) => {
        // build_watch?.watches_clear();
        // build_watch = null;
        // await wait(2000);
        // server?.die();
        // Don't overwrite unless /dist/index.js exists
        if (first || existsSync(dist_index)) {
            Server = (await import(`../dist/index.js#${NO_CACHE++}`)).default;
            // Watch = (await import(`../dist/index.js#${NO_CACHE++}`));
        }
        // Experimental
        // if (!build_watch) {
        //     build_watch = Watch({
        //         paths: [dist],
        //         poll: 3000,
        //         debug: 4,
        //     });
        //     build_watch.set_trigger(() => on_build_exists());
        // }

        // bootstrap import works once ...#${NO_CACHE++}
        server = Server({
            name: "meta",
            // Only build if simple.js failed last cycle.
            procs: [
                {
                    type: "exec",
                    command: "npm run build",
                    run_if_file_dne: "./dist/index.js",
                    goto_on_file_exists: 1,
                    chain_exit: "success",
                },
                {
                    type: "exec",
                    command: "npm run _post_build",
                    run_if_file_dne: "./dist/package.json",
                    goto_on_file_exists: 2,
                    chain_exit: "success",
                },
                {
                    type: "exec",
                    command: "npm run pack",
                    run_if_file_dne: "./dist/dist/rawx-0.2.0.tgz",
                    goto_on_file_exists: 3,
                    chain_exit: "success",
                },
                {
                    type: "exec",
                    command: "node ./test/simple.js",
                },
            ],
            trigger_indices: [3, 0],
            watch: {
                paths: [subserver_conf, src_context],
                poll: 3000,
            },
            kill_delay: 200,
            colors: {
                default: "",
                // label: "", // no label .alias
                fleck: "",
                forky: some_colors.PURPLE,
                // accent: some_colors.NEON_YELLOW,
            },
            log_replace_repl: [
                {
                    reg: /\n[\s\t]*(?:npm\s*(?:notice)*)+\s?/g,
                    replace: "\n",
                },
            ],
            debug: 3,
        });
    };

    // we can't refresh w/o require transpile
    // an external rawx however can, in the meta sense, but for a child-proc server
    let prep_watch;
    // Runs if dist is empty
    const prep = () => {
        if (existsSync(dist_index)) {
            on_build_exists(true).catch((err) => {
                console.log(`fs.exists err: ${err}`);
            });
            return;
        }

        const bootstrap = npm_build();
        bootstrap.once("exit", async (code) => {
            on_build_exists(true);
            console.log(code);
            if (code === 0) {
                prep_watch?.watches_clear();
                await wait(1500);
                on_build_exists(true).catch((err) => {
                    console.log(`npm build err: ${err}`);
                });
            } else {
                if (!prep_watch) {
                    prep_watch = Watch({
                        paths,
                        poll: 3000,
                        debug: 4,
                    });
                    prep_watch.set_trigger(() => prep());
                }
            }
        });
        bootstrap.stdout.on("data", (data) => {
            process.stdout._write(data, "utf8", () => {});
        });
        bootstrap.stderr.on("data", (data) => {
            process.stderr._write(data, "utf8", () => {});
        });
    };
    prep();
})();
// {
//     type: "spawn",
//     command: "npm",
//     args: "./test/simple.js",
//     cwd: ""
// },
// OOF
