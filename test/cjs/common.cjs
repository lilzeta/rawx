// const { server, some_colors } = require("rawx");
const Server = require("rawx").default;
const { resolve } = require("path");
const src_context = resolve("src");
(() => {
    new Server({
        name: "cjs",
        debug: 10,
        procs: [
            {
                type: "exec",
                command: "npm run build",
                chain_exit: "success",
            },
            // {
            //     type: "exec",
            //     command: "npm run _post_build",
            //     chain_exit: "success",
            // },
            // {
            //     type: "exec",
            //     command: "npm run pack",
            //     chain_exit: "success",
            // },
            // {
            //     type: "exec",
            //     command: "npm run reref",
            // },
        ],
        trigger_index: 0,
        watch: {
            paths: [src_context],
            poll: 3000,
        },
        kill_delay: 300, // too quick for many things
        // watch: {}
        // colors: {
        //     default: some_colors.LAVENDER,
        //     forky: some_colors.PURPLE,
        //     errata: some_colors.D_BLUE,
        //     accent: some_colors.NEON_YELLOW,
        //     label: some_colors.NEON_YELLOW,
        // },
    });
})();
