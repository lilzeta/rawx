const Files_Tree: Files_Tree_C = require("./files_tree");
const Files_Complex: Files_Complex_C = require("./files_complex");

// Types
import { Files_Tree_Args, Matchers, Match_Item_Arg } from "../args_types";
import { Files_Complex_Args, Complex_Arg } from "../args_types";
import { Files_Tree_I, Trunk_Paths, Files_Complex_I } from "../export_types";
import { Files_Tree_C } from "./files_tree";
import { Files_Complex_C } from "./files_complex";
export type { Files_Tree_C, Files_Tree_I, Files_Tree_Args };
export type { Matchers, Trunk_Paths, Match_Item_Arg };
export type { Files_Complex_C, Files_Complex_I, Complex_Arg, Files_Complex_Args };

module.exports = {
    Files_Tree,
    Files_Complex,
};
