import path from "path";
import { npm_build, Watch, colors } from "rawx";
import { setTimeout as wait } from "timers/promises";

const test = path.resolve("test");
const subserver_conf = path.join(test, "simple.js");
const colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
};
/**
 * procs[0] only runs if build DNE
 * (aka simple failed and no Server build exists to start it)
 */
const context = path.resolve("src");
const paths = [subserver_conf, context];
(async () => {
    const external_build_first_success = async () => {
        const procs = [
            {
                type: "exec",
                command: "npm run build",
                if_file_dne: "./dist/index.js",
                chain_exit: "success",
            },
            {
                type: "exec",
                command: "npm run manual_post_build",
                if_file_dne: "./dist/index.js",
                chain_exit: "success",
            },
            {
                type: "exec",
                command: "node ./test/simple.js",
            },
        ];
        // bootstrap import works once ...#${NO_CACHE++}
        const Server = await (await import("../dist/index.js")).default;
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
                label: "", // no label .alias
                forky: "",
                lightly: colors.NEON_YELLOW,
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
    const preschool = () => {
        const bootstrap = npm_build();
        bootstrap.once("exit", async (code) => {
            console.log(code);
            if (code === 0) {
                watch?.watches_clear();
                await wait(1000);
                external_build_first_success().catch();
            } else {
                if (!watch) {
                    watch = Watch({
                        paths,
                        poll: 3000,
                        trigger: () => preschool(),
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
    preschool();
})();
