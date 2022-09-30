import { Server, some_colors } from "../dist/index.js";
// node "./test/simple.js"
// This is restarted by meta.js
// runs build, pack, and exit with no watch, respawns via meta.js
// this means simple.js changes are used after changed
(() => {
    Server({
        name: "simple",
        procs: [
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
            {
                type: "exec",
                command: "npm run pack",
                silence: "some",
            },
        ],
        trigger_index: 0,
        kill_delay: 300, // too quick for many things
        // watch: {}
        colors: {
            default: some_colors.LAVENDER,
            forky: some_colors.PURPLE,
            errata: some_colors.D_BLUE,
            accent: some_colors.NEON_YELLOW,
            label: some_colors.NEON_YELLOW,
        },
    });
})();

// let sed_face = `sed -r -n -f ./src/sed/strip_log.sed ./dist/server.js | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_log.sed | sed -r -n -f ./src/sed/strip_tail.sed | sed -r -n -f ./src/sed/strip_head.sed | tee ./dist/server.js;`;
// {
//     type: "exec",
//     command: sed_face,
//     silence: "some",
//     // chain_exit: true,
// },
