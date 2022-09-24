import { Server } from "../dist/index.js";
// let sed_face = `sed -r -n -f ./src/sed/strip_log.sed ./dist/server.js | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_tail.sed | sed -r -n -f ./src/sed/strip_head.sed | tee ./dist/server.js;`;
const colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
};

// runs build pack and exit with no watch, respawns via meta
(() => {
    // const context = path.resolve("src");
    const procs = [
        {
            type: "exec",
            command: "npm run build",
            chain_exit: "success",
        },
        {
            type: "exec",
            command: "npm run manual_post_build",
            chain_exit: "success",
        },
        // {
        //     type: "exec",
        //     command: sed_face,
        //     silence: "some",
        //     // chain_exit: true,
        // },
        {
            type: "exec",
            command: "npm run pack",
            silence: "some",
        },
    ];

    Server({
        name: "simple",
        procs,
        trigger_index: 0,
        kill_delay: 300, // too quick for many things
        colors: {
            default: colors.LAVENDER,
            forky: colors.PURPLE,
            errata: colors.D_BLUE,
            lightly: colors.NEON_YELLOW,
            label: colors.NEON_YELLOW,
        },
    });
})();
