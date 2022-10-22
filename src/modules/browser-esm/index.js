/***
 * license.kind
 * Original: https://github.com/lilzeta
 * Flux this tag if/whenever you feel like
 */
// Trimmed out the node:xyz modules, polyfilled a logger/ops util
// This file is copied not compiled
// from ./src/modules/browser-esm to ./dist/modules/browser-esm
// Util/Ops
import { default as Ops } from "../../browser/ops.js";
export { Ops };
export { default as some_colors } from "../../browser/some_colors.js";
import { default as Browser_Mod } from "../../browser/ops.js";
export const no_colors = Browser_Mod.no_colors;
export { default as Base } from "../../util/base.js";

export default Ops;
