import path from "path";
import { Server, some_colors } from "rawx";
// node "./test/start.mjs"
const src_path = path.resolve("src");
const tsconfig_path = path.resolve("tsconfig.json");
(() => {
    new Server({
        name: "start",
        trigger_index: 0,
        watch: {
            paths: [src_path, tsconfig_path],
            poll: 3000,
        },
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
        kill_delay: 300, // too quick for many things
        colors: {
            default: some_colors.LAVENDER,
            forky: some_colors.PURPLE,
            errata: some_colors.D_BLUE,
            accent: some_colors.NEON_YELLOW,
            label: some_colors.NEON_YELLOW,
        },
        // debug: 10,
    });
})();
