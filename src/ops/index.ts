// index.d.ts - Ops_Mod
export interface Ops_Module {
    Ops: Ops_Gen;
    some_colors: Some_Colors;
    no_colors: Color_Targets;
}
import { Ops_Gen } from "./export_types";
export type { O, Log, Wait, str } from "./export_types";
import { Color_Targets, Ops_Conf } from "./args_types";
export type { Color_Targets, Ops_Conf, Ops_Gen };

import { Color_Util_Mod, Some_Colors } from "./color_util";
const color_util_mod: Color_Util_Mod = require("./color_util");
export type { Some_Colors, Color_Util_Mod };
const Ops: Ops_Gen = require("./ops");

module.exports = {
    Ops,
    some_colors: color_util_mod.some_colors,
    no_colors: color_util_mod.no_colors,
};
