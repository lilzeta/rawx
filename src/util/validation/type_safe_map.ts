import { str } from "../export_types";
// Outline of this solution & source
// https://2ality.com/2020/04/classes-as-values-typescript.html
// type Class<T> = new (...args: any[]) => T;
interface Class<T> {
    new (...args: any[]): T;
}
function cast<T>(TheClass: Class<T>, obj: any): T {
    if (!(obj instanceof TheClass)) {
        throw new Error(`Not an instance of ${TheClass.name}: ${obj}`);
    }
    return obj;
}
class TypeSafeMap<T> {
    instanced_class: T;
    constructor(instanced_class: T) {
        this.instanced_class = instanced_class;
    }
    #data = new Map<any, any>();
    collected_errors: str[];
    get<T>(key: Class<T>) {
        const value = this.#data.get(key);
        return cast(key, value);
    }
    set<T>(key: Class<T>, value: T): this {
        cast(key, value); // runtime check
        this.#data.set(key, value);
        return this;
    }
    has(key: any) {
        return this.#data.has(key);
    }
}
module.exports = TypeSafeMap;

// https://stackoverflow.com/questions/40510611/typescript-interface-require-one-of-two-properties-to-exist
// type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
//     Pick<T, Exclude<keyof T, Keys>>
//     & {
//         [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
//     }[Keys]
// And a partial but not absolute way to require that one and only one is provided is:

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
> &
    {
        [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];
