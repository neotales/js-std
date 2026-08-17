import type { WriteFileOptions } from "./types.js";
import type { OpenOptions } from "./open.js";
type WriteBooleanOptions = Pick<WriteFileOptions, "append" | "create" | "createNew">;
type OpenBooleanOptions = Pick<OpenOptions, "read" | "write" | "append" | "truncate" | "create" | "createNew">;
/**
 * Uses the boolean options specified in {@linkcode WriteFileOptions} to
 * construct the composite flag value to pass to the `flag` option in the
 * Node.js `writeFile` function.
 */
export declare function getWriteFsFlag(opt: WriteBooleanOptions): number;
/**
 * Uses the boolean options specified in {@linkcode OpenOptions} to construct the
 * composite flag value to pass to the `flag` option in the Node.js `open`
 * function.
 */
export declare function getOpenFsFlag(opt: OpenBooleanOptions): number;
export {};
