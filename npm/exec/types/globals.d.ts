declare const globals: typeof globalThis & {
    Bun?: unknown;
    Deno?: any;
    process?: any;
};
declare const DARWIN: boolean;
declare const WINDOWS: boolean;
export { DARWIN, globals, WINDOWS };
export declare const WIN: boolean;
/**
 * Loads the Node-compatible child process module when the runtime provides it.
 *
 * @returns The child process module, or `undefined` when unavailable.
 * @example
 * ```ts
 * import { loadChildProcess } from "@neotales/exec/globals";
 *
 * const childProcess = loadChildProcess();
 * ```
 */
export declare function loadChildProcess(): typeof import("node:child_process") | undefined;
