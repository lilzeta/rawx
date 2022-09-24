/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { setTimeout as wait } from "timers/promises";
import { Debug, str, Flux_Param, Num_Keyed, Arg_Map } from "../interface.js";

export class Core {
    DEBUG: Debug = 0; // no class logging, but all inheritors use
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

    wait = wait;

    pretty(obj: any) {
        return JSON.stringify(obj, null, 2);
    }

    compound_map_to_arg: Arg_Map = (
        arr: Array<str | boolean | Array<Flux_Param>>,
        p: str | boolean,
        default_arg: str | boolean,
    ): str | boolean => {
        if (!this.defi(p)) return default_arg;
        if (this.fuzzy_false(p)) return false;
        if (this.fuzzy_true(p)) return true;
        if (typeof p === "string") p = p.toLowerCase();
        let remap: Num_Keyed = {};
        const inner_arr: Array<str | boolean> = arr.map((value, index) => {
            if (Array.isArray(value)) {
                remap[index] = value[1];
                return value[0] as str | boolean;
            }
            return value as str | boolean;
        });

        const is_at = this.if_in_get_index(inner_arr, p as str);
        if (is_at === false) {
            throw new Error(p + " not found as a allowed param");
        }
        if (this.defi(remap[is_at])) return remap[is_at];
        return inner_arr[is_at];
    };

    if_in_get_index = (arr: Array<str | boolean>, p: str | boolean): false | number => {
        let index = arr.indexOf(p);
        if (index !== -1) return index;
        return false;
    };

    in_array = (arr: Array<str>, p: str): false | number => {
        let index = arr.indexOf(p);
        if (index !== -1) return index;
        return false;
    };

    // while sometime I may join the two they are distinct
    fuzzy_true = (item?: string | boolean) => {
        // if DNE || false - false
        if (!item) {
            return true;
        }
        // if true, true
        if (typeof item === "boolean") return item;
        if (!item.length) return true;
        return this.in_array(["true", "t", "yes", "y", "always"], item.toLowerCase());
    }; // kind

    // while sometime I may join the two they are distinct
    fuzzy_false = (item?: string | boolean) => {
        // if DNE || false - false
        if (!item) {
            return false;
        }
        if (typeof item === "boolean") return !item;
        if (!item.length) return true;
        return this.in_array(["false", "f", "no", "n", "none", "never"], item.toLowerCase());
    }; // kind
}

export default Core;
