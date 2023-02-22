const Ops = require("../../ops/ops");
let { log, accent, keys } = new Ops();
export class Validator {
    constructor() {}
}

import { Server_Constructor_I, str } from "../../node-enabled/export_types";
// https://stackoverflow.com/questions/53387838/how-to-ensure-an-arrays-values-the-keys-of-a-typescript-interface/53395649#53395649
type Invalid<T> = ["Needs to be all of", T];
type Resolution_Is_T_In_U<T, U extends T[]> = U &
    ([T] extends [U[number]] ? unknown : Invalid<T>[]);
export type Array_Of_All = <T>() => <U extends T[]>(...array: Resolution_Is_T_In_U<T, U>) => U;
// const arrayOfAll: Array_Of_All =
//     () =>
//     (...array) =>
//         array;
export type Set_Validator = <R>(input_args?: R) => void;
// const set_validator: Set_Validator = <R>(input_args?: R) => {
//     if (!input_args) {
//         // If then check if empty is in type set aka some : Partial
//         // input_args = {} as any;
//         return;
//     }
//     const check_missing = arrayOfAll<keyof R>();
//     // const input_arg_s: str[] = Object.keys(input_args);
//     const input_arg_k: (keyof R)[] = Object.keys(input_args) as (keyof R)[];
//     const result = check_missing(...input_arg_k);
//     console.log(1, `required_validator result:`);
//     console.log(1, result);
//     console.log(1, `required_validator typeof result:`);
//     console.log(1, typeof result);
//     // if(typeof )
// };

// module.exports = {
//     set_validator,
// };

// interface Validator_Args {
//     input: any;
//     number_props: {
//         prop_name: str;
//         prop_min?: number;
//         prop_max?: number;
//     };
// }

// const args = arrayOfAll<keyof Validator_Args>;
// console.log(args);

// type str = string;
// source of two solutions:
// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
// type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
//     Pick<T, Exclude<keyof T, Keys>>
//     & {
//         [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
//     }[Keys]
// And a partial but not absolute way to require that one and only one is provided is:
export type Require_Only_One<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];

export interface Arg_Validator_I {
    errors: str[];
    warnings: str[];
    validate: (args: any) => void;
    set_validated: (_self: Server_Constructor_I) => void;
}
interface str_rule {
    type: "string";
    one_of?: Array<str>;
}
interface num_rule {
    type: "number";
    min?: number;
}
interface bool_rule {
    type: "boolean";
    polar?: boolean;
}
type Rule = str_rule | num_rule | bool_rule;
interface dict {
    [p: str]: Rule;
}
const skips = (prop_name: str) => /^_/.exec(prop_name);
export type Arg_Validator_Class = new (name: str, arg_dict: any) => Arg_Validator_I;
class Arg_Validator implements Arg_Validator_I {
    name: str;
    arg_dict: dict;
    warnings: str[] = [];
    errors: str[] = [];
    validated: any = {};
    constructor(name: str, arg_dict: any) {
        this.name = name;
        this.arg_dict = arg_dict;
    }
    validate(args: any) {
        for (const [key, val] of Object.entries(args)) {
            // Ignore JSON `$_` keys (comments or non-external args)
            if (skips(key)) continue;
            // We will ignore undefined
            if (this.arg_dict[key] === undefined) {
                continue;
            }
            const rule: Rule = this.arg_dict[key];

            if (rule.type === "number") {
                if (typeof val !== "number") {
                    this.errors.push(`Prop: ${key}, is expected to be a number.`);
                    continue;
                }
                if (rule.min !== undefined) {
                    this.validated[key] = Math.min(rule.min, val);
                } else {
                    this.validated[key] = val;
                }
                continue;
            }
            if (rule.type === "string") {
                if (typeof val !== "string") {
                    this.errors.push(`Prop: ${key}, is expected to be a string.`);
                    continue;
                }
                if (rule.one_of !== undefined) {
                    if (rule.one_of.indexOf(val) !== -1) this.validated[key] = val;
                    else {
                        this.errors.push(
                            `Prop: ${key}, must be one of: ${rule.one_of.join(", ")}`,
                        );
                    }
                } else {
                    this.validated[key] = val;
                }
                continue;
            }
            if (rule.type === "boolean") {
                if (typeof val !== "boolean") {
                    this.errors.push(
                        `Prop: ${key}, is expected to be a boolean or undefined.`,
                    );
                    continue;
                }
                if (rule.polar !== undefined) {
                    if (rule.polar === val) {
                        this.validated[key] = val;
                        continue;
                    }
                    this.warnings.push(
                        `prop: ${key} passed in unnecessary polarity, ignoring`,
                    );
                    continue;
                }
            }
            if (typeof val === "object") {
                if (Array.isArray(val)) {
                    this.warnings.push(
                        `Array type validation is a WIP, prop: ${key} set without validation.`,
                    );
                } else {
                    this.warnings.push(
                        `object type validation is a WIP, prop: ${key} set without validation.`,
                    );
                }
            }
        }
        console.log(`<validate results>`);
        console.log(`this.warnings:`);
        console.log(this.warnings);
        console.log(`this.errors:`);
        console.log(this.errors);
    }
    set_validated(_self: Server_Constructor_I) {
        for (const k of keys(this.validated)) {
            const v = this.validated[k];
            console.log(`k, v:`);
            console.log(`${k}, ${v}`);
            // self[k as keyof Server_Construct_Class] = v;
        }
    }
}
module.exports = Arg_Validator;
