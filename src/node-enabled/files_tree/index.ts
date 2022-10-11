const Files_Tree: Files_Tree_C = require("./files_tree");
const Files_Complex: Files_Complex_C = require("./files_complex");

// Types
import { Files_Tree_C, Files_Tree_I, Matchers, Trunk_Paths } from "./files_tree";
import { Match_Item_Arg, Files_Tree_Args } from "./files_tree";
import { Files_Complex_C, Files_Complex_I } from "./files_complex";
import { Complex_Arg, Files_Complex_Args } from "./files_complex";
export type { Files_Tree_C, Files_Tree_I, Files_Tree_Args };
export type { Matchers, Trunk_Paths, Match_Item_Arg };
export type { Files_Complex_C, Files_Complex_I, Complex_Arg, Files_Complex_Args };

module.exports = {
    Files_Tree,
    Files_Complex,
};
