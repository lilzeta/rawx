// module.exports = { Base, Validator };
export interface Util_Module {
    Base: Base_C;
    Validator: Arg_Validator_Class;
}

import { Base_C, Base_I, Wait, Thing1_Thing2 } from "./export_types";
import { Arg_Validator_Class } from "./validation/validator";
export type { Base_C, Base_I, Wait, Thing1_Thing2, Arg_Validator_Class };

// type generics for Constructor functions
// https://stackoverflow.com/questions/36886082/abstract-constructor-type-in-typescript
export type Abstract_Constructor<P, Q> = abstract new (args: P) => Q;
export type Constructor<P, Q> = new (args: P) => Q; // type generics for Constructor_Functions
// export type Class_Proxy_F<P, Q> = (args: P) => Q;
export type Class_Proxy_F<P, Q> = (args: P) => new (args: P) => Q;

export const Base: Base_C = require("./base");
export const Validator: Arg_Validator_Class = require("./validation/validator");

module.exports = {
    Base,
    Validator,
};
