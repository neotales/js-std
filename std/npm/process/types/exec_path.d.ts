import "./_dnt.polyfills.js";
/**
 * Returns the path to the executable that started the process. Mainly
 * deno, node, bun, or empty string.
 *
 * @description
 * @returns The path to the executable that started the process.
 * @example
 *
 * ```ts
 * import { execPath } from "@neotales/process";
 *
 * console.log(execPath());
 * // Output: "/usr/local/bin/deno" or "/usr/local/bin/node" or "/home/user/.deno/bin/deno"
 * ```
 */
export declare function execPath(): string;
