/***
 * license kind, whatever you want
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
import { Debug } from "../interface";
import { setTimeout as wait } from "timers/promises";

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
}

export default Core;
