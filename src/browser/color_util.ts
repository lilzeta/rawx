import { Color_Targets } from "../ops/index";

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
const some_colors: Some_Colors = {
    TECHNICOLOR_GREEN: `#4edecd`,
    LAVENDER: `#7678e8`,
    H_RED: `#f52e2e`,
    PURPLE: `#4e02d8`,
    D_BLUE: `#1c0089`,
    NEON_YELLOW: `#f7f623`,
    NO: "",
};
const no_colors: Color_Targets = {
    label: "",
    default: "",
    accent: "",
    forky: "",
    errata: "",
    fleck: "",
};
module.exports = {
    some_colors,
    no_colors,
};
