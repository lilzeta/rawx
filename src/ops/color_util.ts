import { Color_Targets } from "./args_types";
export interface Color_Util_Mod {
    some_colors: Some_Colors;
    no_colors: Color_Targets;
}
export interface Some_Colors {
    TECHNICOLOR_GREEN: string;
    LAVENDER: string;
    H_RED: string;
    PURPLE: string;
    D_BLUE: string;
    NEON_YELLOW: string;
    NO: string;
}
// re-exported in ops/index
const some_colors: Some_Colors = {
    TECHNICOLOR_GREEN: `[0;36m`,
    LAVENDER: `[1;34m`,
    H_RED: `[1;31m`,
    PURPLE: `[0;35m`,
    D_BLUE: `[0;34m`,
    NEON_YELLOW: `[1;33m`,
    NO: "",
};
const no_colors: Color_Targets = {
    label: "",
    default: "",
    accent: "",
    forky: "",
    errata: "",
    bar: "",
};

module.exports = {
    some_colors,
    no_colors,
};
