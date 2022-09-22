import path from "path";
import cp from "child_process";
// Not a great example, mostly chicken scratch towards a meta
// I think it needs require (babel transpile?)
// import { setTimeout as wait } from "timers/promises";
// const LAVENDER = `[1;34m`;

const context = path.resolve("src");
const entry_ts = [context, /[\w\._-]*.ts/];
// let server;
// const POST_BUILD_IO_WAIT = 300;
// let NO_CACHE = 0;
const debug = true;
const build_pack = "npm run release";
export function npm_build() {
    return cp.exec(build_pack);
}
const build = async () => {
    // while an outer import 99% same cp.exec("npm run build")
    // const { npm_build } = await import(`../dist/index.js#${NO_CACHE++}`);
    // possible solution to hot-load, or babel transpile to async require
    // https://www.npmjs.com/package/node-es-module-loader
    const init_build = npm_build();
    init_build.on("close", async () => {
        // await wait(POST_BUILD_IO_WAIT);
        await start();
    });
};

// let extern_trigger = async () => {
//     console.log(`Extern trigger`);
//     server?.die();
//     await wait(POST_BUILD_IO_WAIT);
//     await start();
// };

// this doesn't quite do the meta yet
let start = async () => {
    const { Server } = await import(`../dist/index.js`);
    // const { Server } = await import(`../dist/index.js#${NO_CACHE++}`);
    // server =
    new Server({
        // name: "simple",
        name: "-",
        procs: {
            type: "exec",
            command: build_pack,
            // wait till the watch to do the first build
            wait_till_watch: true,
        },
        watch: entry_ts,
        // watch_trigger_override: extern_trigger,
        debug,
        // default_color: "[36m",
    });
};

build();
