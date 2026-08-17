/** Runtime capabilities used by the cross-runtime filesystem implementation. */
export declare const globals: typeof globalThis & {
    Bun?: unknown;
    Deno?: any;
    process?: any;
};
/** Whether the current platform uses Windows filesystem semantics. */
export declare const WIN: boolean;
/** Whether this module is running in Deno. */
export declare const IS_DENO: boolean;
/** Loads Node's synchronous filesystem module when available. */
export declare function loadFs(): typeof import("node:fs") | undefined;
/** Returns Node's synchronous filesystem module. */
export declare function getNodeFs(): typeof import("node:fs");
/** Loads Node's promise filesystem module when available. */
export declare function loadFsAsync(): typeof import("node:fs/promises") | undefined;
