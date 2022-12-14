// disable automatic export
export type {};

import { Server_Class } from "./server";
import { Watch_C } from "./watch";
import { Proc_Util_C } from "./proc_util";
import { Files_Tree_C, Files_Complex_C } from "./files_tree/index";
import { Ops_Gen, Some_Colors } from "../ops";
import { Base_C, Util_Module } from "../util";

// value exports
export const Server: Server_Class = require("./server");
export const Watch: Watch_C = require("./watch");

export const Proc_Util: Proc_Util_C = require("./proc_util");
export const Files_Tree: Files_Tree_C = require("./files_tree/files_tree.js");
export const Files_Complex: Files_Complex_C = require("./files_tree/files_complex");

export const Ops: Ops_Gen = require("../ops/ops");
export const some_colors: Some_Colors = require("../ops/some_colors");
export const Base: Base_C = require("../util/base");
export const Util: Util_Module = require("../util");

// type exports
export type { Server_Class, Watch_C };
export type { Server_Args } from "./server_construct";
export type { Watch_Args } from "./watch";

export type { Proc_Util_C } from "./proc_util";
export type { Files_Tree_C, Files_Complex_C };
export type { Files_Tree_I, Files_Tree_Args, Matchers } from "./files_tree/index";
export type { Files_Complex_Args, Files_Complex_I, Complex_Arg } from "./files_tree/index";

export type { Ops_Gen, Some_Colors, Base_C, Util_Module };
export type { O, Conf, Color_Targets, Log, Wait } from "../ops";
export type { Ops_Module } from "../ops";
export type { Constructor, Abstract_Constructor, Base_I, str } from "../util";

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
    Util,
    Base,
    default: Server,
};

// import type { P, H, _P } from "./proc_type_defs";
// export type { P, H };
// TODO module.export?

// import { Require_Only_One } from "../ops/validator";
// const Ops_Index: Ops_Module = require("../ops");
