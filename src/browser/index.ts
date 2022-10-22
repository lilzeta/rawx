// disable automatic export
export type {};
import { Base_C, Base_I, str } from "../util";
import { Ops_Gen } from "./ops";
import { Color_Targets, Log, Wait, Conf, Ops_Module } from "../ops/index";
import { Some_Colors } from "./some_colors";

const Ops: Ops_Gen = require("./ops");
const Base: Base_C = require("../util/base");
const some_colors: Some_Colors = require("./some_colors");
const no_colors: Color_Targets = {
    label: "",
    default: "",
    accent: "",
    forky: "",
    errata: "",
    fleck: "",
};
module.exports = {
    // Ops/Base Logging/Utils
    Ops,
    Base,
    some_colors,
    no_colors,
};
export type { Base_C, Base_I, str, Color_Targets, Log, Wait, Conf };
// export declare module rawx {
//     export const Ops: Ops_Gen;
//     export const Base: Base_Class;
//     export const some_colors: Some_Colors;
//     export type { Color_Targets, Log, Wait, str, Base_I, Conf };
// }
