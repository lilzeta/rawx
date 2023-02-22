// disable automatic export
export type {};
import { Base_C, Base_I, str } from "../util/export_types";
import { Color_Util_Mod, Some_Colors } from "./color_util";
import { Ops_Gen } from "./ops";
import { Color_Targets, Log, Wait, Ops_Conf } from "../ops/index";

const Ops: Ops_Gen = require("./ops");
const Base: Base_C = require("../util/base");

const color_util_mod: Color_Util_Mod = require("./color_util");

module.exports = {
    // Ops/Base Logging/Utils
    Ops,
    Base,
    some_colors: color_util_mod.some_colors,
    no_colors: color_util_mod.no_colors,
};
export type { Base_C, Base_I, str, Color_Targets, Log, Wait, Ops_Conf, Some_Colors };
// export declare module rawx {
//     export const Ops: Ops_Gen;
//     export const Base: Base_Class;
//     export const some_colors: Some_Colors;
//     export type { Color_Targets, Log, Wait, str, Base_I, Conf };
// }
