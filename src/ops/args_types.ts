export interface Ops_Conf {
    // 0-10 , 11...
    debug?: number;
    colors?: Partial<Color_Targets> | "no";
    label?: str;
    log_ignore_reg_repl?: { reg: RegExp; replace?: string }[];
    unique?: true;
}
export interface Color_Targets {
    // Class name color
    label: str; // "" for no labeling
    // All sub-proc labelling
    default: str;
    // Accented for attention
    accent: str;
    // Start/Close/Proc specific event
    forky: str;
    errata: str;
    // The `|` between label & log
    bar: str; // "" for no fleck
}
export type Color_Target = keyof Color_Targets;

// poor judgements
export type str = string;
