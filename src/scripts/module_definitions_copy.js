const { exec } = require("child_process");
const copy = exec("cp -r ./src/modules/ ./dist/modules/", { stdio: "inherit" });
copy.once("exit", (copy_code) => {
    //     // console.log(`mkdir exec code: ${mkdir_code}`);
    console.log(`copy exec code: ${copy_code}`);
});
const copy2 = exec("cp -r ./src/ops/validation/schema ./dist/ops/validation", {
    stdio: "inherit",
});
copy2.once("exit", (copy_code) => {
    //     // console.log(`mkdir exec code: ${mkdir_code}`);
    console.log(`copy2 exec code: ${copy_code}`);
});

// const { exec, spawn } = require("child_process");
// const { resolve, join } = require("path");

// // const mkdir_command = `mkdir`;
// // const mkdir = spawn(mkdir_command, ["-p", "./dist/esm"], { stdio: "inherit" });
// let copy_files = [
//     // "./README.md ./dist/",
//     // "./license.md ./dist/",
//     // "./packaging/esm/index.mjs ./dist/esm/",
//     // "./packaging/esm/package.json ./dist/esm/",
//     // "./packaging/index.d.ts ./dist/index.d.ts",
// ];
// let copy_dirs = [
//     // "./src/node-esm/ ./dist/",
//     // "./src/browser-esm/ ./dist/",
//     // "./src/browser-cjs/ ./dist/",
//     "./src/modules/ ./dist/modules/",
// ];
// // let copy_command = `cp ${copy_files.join(" && cp ")}`;
// // copy_command = [copy_command, ...copy_dirs].join(" && cp -r ");
// // console.log(copy_command);
// const copy = exec("cp -r ./src/modules/ ./dist/modules/", { stdio: "inherit" });

// // console.log(`cp exec code: ${code}`);
// // const mv_exec = exec(`mv ./dist/index.js ./dist/index.cjs`, { stdio: "inherit" });
// // let f_rename_to_cjs = [join("cjs", "index.js")];
// // let f_re_mjs = [join("esm", "index.js")];
// // , "server.js", "server_construct.js", "watch.js", "sub_proc.js"];
// // const folder1 = "ops";
// // f_re = f_re.concat([join(folder1, "core.js"), join(folder1, "ops.js")]);
// // const folder2 = "file_tree";
// // f_re = f_re.concat([join(folder2, "tree_files.js"), join(folder2, "tree_complex.js")]);
// const dist = resolve("dist");
// const out_files = [];
// const in_files = [];
// in_files.push(join(dist, f_rename_to_cjs[0]));
// out_files.push(join(dist, "cjs", "index.cjs"));
// // in_files.push(join(dist, f_re_mjs[0]));
// // out_files.push(join(dist, "esm", "index.mjs"));
// // const in_files = f_re.map((v) => {
// //     // grab subpath while simple to grab
// //     // const sub_dir = /^(.*)\\|\/[\w\.-_]*\.js/.exec(v)?.[1];
// //     // let _dir;
// //     // if (!sub_dir) {
// //     //     console.log(`rename could not create output dir for file: ${v}`);
// //     //     // but thats ok for root files;
// //     //     _dir = dist;
// //     // } else {
// //     //     _dir = join(dist, sub_dir);
// //     // }
// //     const base_out_path = /^(.*)\.js/.exec(v)?.[1];
// //     if (!base_out_path) {
// //         console.log(`rename could not create output for file: ${v}`);
// //         process.exit(1);
// //     }
// //     out_files.push(join(dist, base_out_path + ".cjs"));
// //     return join(dist, v);
// // });

// const rename_loop = (last_code, i = 0) => {
//     console.log(`last exec code: ${last_code}`);
//     if (i >= in_files.length) process.exit(last_code);
//     if (last_code) {
//         if (i) {
//             console.log(`mv exec [${i}] failed - code: ${last_code}`);
//         } else {
//             console.log(`first copy exec failed - code: ${last_code}`);
//         }
//         process.exit(last_code);
//     }

//     const in_f = in_files[i];
//     let out_f = out_files[i];

//     console.log(`starting mv ${in_f} ${out_f}`);
//     rename = exec(`mv ${in_f} ${out_f}`, {
//         stdio: "inherit",
//     });
//     // success of last, continue
//     rename.once("exit", async (mv_code) => {
//         rename_loop(mv_code, i + 1);
//     });
// };
// // mkdir.once("exit", (mkdir_code) => {
// copy.once("exit", (copy_code) => {
//     // console.log(`mkdir exec code: ${mkdir_code}`);
//     console.log(`copy exec code: ${copy_code}`);
//     // if (mkdir_code) process.exit(mkdir_code);
//     // copy.once("exit", (code) => {
//     rename_loop(copy_code); // exit code checked inside
//     // });
// });
