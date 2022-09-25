import path from "path";
// import { npm_build, Watch, colors } from "rawx";
import { npm_build, Watch, some_colors } from "rawx";
import { setTimeout as wait } from "timers/promises";
// import { npm_build } from "../dist/index.js";
import * as fs from "fs";

const test = path.resolve("test");
const subserver_conf = path.join(test, "simple.js");
const src_context = path.resolve("src");
const paths = [subserver_conf, src_context];
const dist = path.resolve("dist");
const dist_index = path.join(dist, "index.js");

(async () => {
    let NO_CACHE = 0;
    let Server;
    const on_build_exists = async (first) => {
        if (first || fs.existsSync(dist_index)) {
            Server = (await import(`../dist/index.js#${NO_CACHE++}`)).default;
        }
        const procs = [
            {
                type: "exec",
                command: "npm run build",
                if_file_dne: "./dist/index.js",
                on_file_exists: 2,
                chain_exit: "success",
            },
            {
                type: "exec",
                command: "npm run _post_build",
                chain_exit: "success",
            },
            {
                type: "exec",
                command: "node ./test/simple.js",
            },
        ];
        // bootstrap import works once ...#${NO_CACHE++}
        Server({
            name: "meta",
            procs,
            trigger_index: 0,
            watch: {
                paths,
                poll: 3000,
            },
            kill_delay: 200,
            colors: {
                default: "",
                // label: "", // no label .alias
                fleck: "",
                forky: "",
                lightly: some_colors.NEON_YELLOW,
            },
            log_ignore: [
                {
                    reg: /\n[\s\t]*(?:npm\s*(?:notice)*)+\s?/g,
                    replace: "\n",
                },
            ],
            debug: 4,
        });
    };
    // we can't refresh w/o require transpile
    // an external rawx however can, in the meta sense, but for a child-proc server
    let watch;
    // Runs if dist is empty
    const prep = () => {
        if (fs.existsSync(dist_index)) {
            on_build_exists(true).catch((err) => {
                console.log(`fs.exists err: ${err}`);
            });
            return;
        }

        const bootstrap = npm_build();
        bootstrap.once("exit", async (code) => {
            console.log(code);
            if (code === 0) {
                watch?.watches_clear();
                await wait(1000);
                on_build_exists(true).catch((err) => {
                    console.log(`npm build err: ${err}`);
                });
            } else {
                if (!watch) {
                    watch = Watch({
                        paths,
                        poll: 3000,
                        trigger: () => prep(),
                        debug: 4,
                    });
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
