// deno-lint-ignore-file no-explicit-any

/** Runtime capabilities used by the cross-runtime filesystem implementation. */
export const globals = globalThis as typeof globalThis & {
  Bun?: unknown;
  Deno?: any;
  process?: any;
};

/** Whether the current platform uses Windows filesystem semantics. */
export const WIN = globals.process?.platform === "win32";

/** Whether this module is running in Deno. */
export const IS_DENO = typeof globals.Deno !== "undefined";

function builtin(name: string): any {
  const module = globals.process?.getBuiltinModule?.(name);
  if (!module) {
    throw new Error(`Filesystem operations require a Deno or Node-compatible runtime (${name}).`);
  }
  return module;
}

/** Loads Node's synchronous filesystem module when available. */
export function loadFs(): typeof import("node:fs") | undefined {
  return globals.process?.getBuiltinModule?.("node:fs") as typeof import("node:fs") | undefined;
}

/** Returns Node's synchronous filesystem module. */
export function getNodeFs(): typeof import("node:fs") {
  return builtin("node:fs") as typeof import("node:fs");
}

/** Loads Node's promise filesystem module when available. */
export function loadFsAsync(): typeof import("node:fs/promises") | undefined {
  return globals.process?.getBuiltinModule?.("node:fs/promises") as
    | typeof import("node:fs/promises")
    | undefined;
}
