// deno-lint-ignore-file no-explicit-any
/** Runtime capabilities used by the cross-runtime filesystem implementation. */
export const globals = globalThis;
/** Whether the current platform uses Windows filesystem semantics. */
export const WIN = globals.process?.platform === "win32";
/** Whether this module is running in Deno. */
export const IS_DENO = typeof globals.Deno !== "undefined";
function builtin(name) {
    const module = globals.process?.getBuiltinModule?.(name);
    if (!module) {
        throw new Error(`Filesystem operations require a Deno or Node-compatible runtime (${name}).`);
    }
    return module;
}
/** Loads Node's synchronous filesystem module when available. */
export function loadFs() {
    return globals.process?.getBuiltinModule?.("node:fs");
}
/** Returns Node's synchronous filesystem module. */
export function getNodeFs() {
    return builtin("node:fs");
}
/** Loads Node's promise filesystem module when available. */
export function loadFsAsync() {
    return globals.process?.getBuiltinModule?.("node:fs/promises");
}
