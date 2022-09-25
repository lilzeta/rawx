import { Server, some_colors } from "../dist/index.js";
// let sed_face = `sed -r -n -f ./src/sed/strip_log.sed ./dist/server.js | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_tail.sed | sed -r -n -f ./src/sed/strip_head.sed | tee ./dist/server.js;`;

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
            command: "npm run _post_build",
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
            default: some_colors.LAVENDER,
            forky: some_colors.PURPLE,
            errata: some_colors.D_BLUE,
            lightly: some_colors.NEON_YELLOW,
            label: some_colors.NEON_YELLOW,
        },
    });
})();
