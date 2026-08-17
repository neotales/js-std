// deno-lint-ignore-file no-explicit-any

const globals = globalThis as typeof globalThis & {
  Bun?: unknown;
  Deno?: any;
  process?: any;
};
const DARWIN = globals.process?.platform === "darwin" || globals.Deno?.build?.os === "darwin";
const WINDOWS = globals.process?.platform === "win32" || globals.Deno?.build?.os === "windows";
export { DARWIN, globals, WINDOWS };

export const WIN = WINDOWS;

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
export function loadChildProcess(): typeof import("node:child_process") | undefined {
  return globals.process?.getBuiltinModule?.("node:child_process") as
    | typeof import("node:child_process")
    | undefined;
}
