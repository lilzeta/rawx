import { Base_I } from "../util/export_types";
import { Color_Targets, Ops_Conf } from "./args_types";

// Notice new Ops(...) => O; returns :O the collection of methods
export type Ops_Gen = new (conf?: Ops_Conf) => O;
// This is the result of an new Ops({...}) call, it is not a class but 'object'
export interface O extends Base_I {
    // 0-10 , 11...
    debug: number;
    colors: Color_Targets;
    log: Log;
    accent: Log;
    forky: Log;
    errata: Log;
    // wait is a simple polyfill for both browser/node
    // same outcome as importing node:timers/setTimeout
    wait: Wait;
    // Uses a closure to track global stdout newlines etc and cleanup output
    simple_clean: (s: str) => str;
}
// node:timers/setTimeout...now a simple polyfill for the browser
export type Wait = (n: number) => Promise<void>;
export type Log = (...args: any[]) => void;
export type str = string;
