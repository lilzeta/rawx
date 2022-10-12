// index.d.ts - Ops_Mod
export interface Ops_Module {
    Ops: Ops_Gen;
    some_colors: Some_Colors;
}
import { O, Ops_Gen, Color_Targets, Log, Wait } from "./ops";
export type { O, Log, Wait };

import { Some_Colors } from "./some_colors";
const some_colors: Some_Colors = require("./some_colors");
export type { Color_Targets, Some_Colors };
export type { Conf, Ops_Gen } from "./ops";
export type str = string;

const Ops: Ops_Gen = require("./ops");

const no_colors: Color_Targets = {
    label: "",
    default: "",
    accent: "",
    forky: "",
    errata: "",
    fleck: "",
};

module.exports = {
    Ops,
    some_colors,
    no_colors,
};
