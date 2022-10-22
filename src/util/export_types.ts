export type Base_C = new () => Base_I;
export type Wait = (n: number) => Promise<void>;
export interface Base_I {
    defi: (obj: any) => boolean;
    empty: (obj: any) => boolean;
    truncate: (s: str, l: number) => str;
    pretty: (obj: any) => str;
    // (node:timers/setTimeout)-like polyfill for the browser
    wait: Wait;
    // maps a prop into {prop: q} or {} if undefined for ..{...}
    puff: (p_name: str, q: any) => any;
    fuzzy_true: Thing1_Thing2;
    fuzzy_false: Thing1_Thing2;
    keys: typeof Object.keys;
    entries: typeof Object.entries;
    // if_in_get_index: (arr: Array<str | boolean>, p: str | boolean) => false | number;
}
// poor judgements
export type str = string;
export type Thing1_Thing2 = (item?: str | boolean) => boolean;
