// disable automatic export
export type {};

import { Watch_C } from "./watch";
import { Files_Tree_C, Files_Complex_C } from "./files_tree/index";
import { Color_Targets, Ops_Gen, Ops_Module, Some_Colors } from "../ops/index";
import { Base_C, Util_Module } from "../util/index";
import { Proc_Util_C, Server_Class } from "./export_types";
import { DEBUG_FTR } from "./server";

// value exports
export const Server: Server_Class = require("./server.js");
export const Watch: Watch_C = require("./watch.js");

export const Proc_Util: Proc_Util_C = require("./proc_u.js");
export const Files_Tree: Files_Tree_C = require("./files_tree/files_tree.js");
export const Files_Complex: Files_Complex_C = require("./files_tree/files_complex.js");

export const Ops_Mod: Ops_Module = require("../ops/index.js");
export const Ops: Ops_Gen = Ops_Mod.Ops;
export const some_colors: Some_Colors = Ops_Mod.some_colors;
export const no_colors: Color_Targets = Ops_Mod.no_colors;

export const Base: Base_C = require("../util/base.js");
export const Util: Util_Module = require("../util/index.js");

// type exports
export type { Server_Class, Watch_C };
export type { Server_Args, Watch_Args } from "./args_types";

export type { Proc_Util_C, str } from "./export_types";
export type { Files_Tree_C, Files_Complex_C };
export type { Files_Tree_I, Files_Tree_Args, Matchers } from "./files_tree/index";
export type { Files_Complex_Args, Files_Complex_I, Complex_Arg } from "./files_tree/index";

export type { Ops_Gen, Some_Colors, Base_C, Util_Module };
export type { O, Ops_Conf, Color_Targets, Log, Wait } from "../ops";
export type { Ops_Module } from "../ops";
export type { Constructor, Abstract_Constructor, Base_I } from "../util";

module.exports = {
    // The two main classes instantiated through a fn closure
    Server,
    Watch,

    Proc_Util,
    // File Utils
    Files_Tree,
    Files_Complex,

    // Shared/Ops/Base Logging/Utils (browser modules are not these)
    Ops,
    some_colors,
    no_colors,
    Util,
    Base,
    default: Server,

    DEBUG_FTR,
};

// import type { P, H, _P } from "./proc_type_defs";
// export type { P, H };
// TODO module.export namespaces?
