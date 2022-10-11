/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// module.exports = Base;
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
    if_in_get_index: (arr: Array<str | boolean>, p: str | boolean) => false | number;
}
import { str } from "./index";
export type Base_C = new () => Base_I;
export type Wait = (n: number) => Promise<void>;
export class Base implements Base_I {
    constructor() {}
    // is defined
    defi(obj: any) {
        if (obj === undefined) return false;
        return obj !== null;
    }
    // is empty
    empty(obj: any) {
        if (Array.isArray(obj)) return !obj.length;
        if (typeof obj === "object") return !Object.keys(obj).length;
        throw Error("Don't call empty() on a value type");
    }
    truncate = (dis?: str, to_length = 15) => {
        if (!dis) return "undef";
        if (!dis.length) return "_";
        // somewhere middlish...
        if (dis.length > to_length - 2) return dis.substr(0, to_length) + "...";
        return dis;
    }; // kind
    pretty(obj: any) {
        return JSON.stringify(obj, null, 2);
    }
    // (node:timers/setTimeout)-like polyfill for the browser
    wait: Wait = (delay = 300) => new Promise<void>((resolve) => setTimeout(resolve, delay));
    // WIP
    puff = (prop_name: str, q: any, p_o?: Puff_Options) => {
        if (q !== undefined) {
            if (p_o === "length") {
                if (!q.length) return;
            }
            return {
                [prop_name]: q,
            };
        }
        return undefined;
    }; // kind

    if_in_get_index = (arr: Array<str | boolean>, p: str | boolean): false | number => {
        let index = arr.indexOf(p);
        if (index !== -1) return index;
        return false;
    };

    // while sometime I may join the two they are distinct
    fuzzy_true = (item?: str | boolean) => {
        // if DNE || false - false
        if (!item) {
            return true;
        }
        // if true, true
        if (typeof item === "boolean") return item;
        if (!item.length) return false;
        return ["true", "t", "yes", "y", "always"].indexOf(item.toLowerCase()) !== -1;
    }; // kind

    // while sometime I may join the two they are distinct
    fuzzy_false = (item?: str | boolean) => {
        // if DNE || false - false
        if (!item) {
            return false;
        }
        if (typeof item === "boolean") return !item;
        if (!item.length) return true;
        return ["false", "f", "no", "n", "none", "never"].indexOf(item.toLowerCase()) !== -1;
    }; // kind

    // // as an anon variable
    // arr_item_or_undef = (arr: Array<any>, i: number) => {
    //     if (arr && arr.length >= i) return arr[i];
    // }; // kind

    // // as an anon variable
    // obj_ = (arg: any) => {
    //     return arg;
    //     // if(typeof arg === "object") {
    //     //     return Object.keys(arg).map()
    //     // }
    // }; // kind
}
module.exports = Base;
type Puff_Options = "length" | undefined;
export type Thing1_Thing2 = (item?: str | boolean) => boolean;
