/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { default as Server } from "./server.js";
export * from "./types/interface.js";
export * from "./types/proc_interface.js";
export { Server, npm_build } from "./server.js";
export { Watch } from "./watch.js";
export { Ops, some_colors } from "./ops/ops.js";
export { Core } from "./ops/core.js";
export default Server;

// Moving to another module WIP
import { Complex_File_Tree } from "./file_tree/tree_complex.js";
import { File_Tree } from "./file_tree/tree_files.js";
// I think File_Tree & Complex_File_Tree are getting a separate npm
// So they are not exported here, but if you want here is
// (Deprecated.File_Tree & Deprecated.Complex_File_Tree)
export const Deprecated = {
    File_Tree,
    Complex_File_Tree,
}; // will be external
