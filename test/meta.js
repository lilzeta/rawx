import path from "path";
import { Server } from "../dist/index.js";
const colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
};
(async () => {
    const context = path.resolve("src");
    const server2 = path.join(path.resolve("test"), "simple.js");
    const procs = [
        {
            type: "exec",
            command: "node ./test/simple.js",
        },
    ];
    // we can't refresh w/o require transpile
    // an external rawx however can, in the meta sense, but for a child-proc server
    Server({
        name: "meta",
        procs,
        watch: {
            paths: [context, server2],
            poll: 3000,
            trigger_index: 0,
        },
        kill_delay: 6000,
        // aka use subproc colors only
        colors: {
            default: "",
            label: "", // no label .alias
            forky: "",
            errata: "",
            lightly: colors.NEON_YELLOW,
        },
        log_ignore: [
            {
                reg: /\n[\s\t]*(?:npm\s*(?:notice)*)+\s?/g,
                replace: "\n",
            },
        ],
    });
    // });
})();
