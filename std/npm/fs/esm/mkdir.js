// Copyright 2018-2026 the Deno authors. MIT license.
import "./_dnt.polyfills.js";
import { getNodeFs, isDeno } from "./_utils.js";
import { mapError } from "./_map_error.js";
import { globals } from "./globals.js";
/**
 * Creates a new directory with the specified path.
 *
 * Defaults to throwing error if the directory already exists.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdir } from "@neotales/fs/mkdir";
 * await mkdir("new_dir");
 * await mkdir("nested/directories", { recursive: true });
 * await mkdir("restricted_access_dir", { mode: 0o700 });
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the new directory.
 * @param options Options for creating directories.
 */
export async function mkdir(path, options) {
    if (isDeno) {
        await globals.Deno.mkdir(path, { ...options });
    }
    else {
        try {
            await getNodeFs().promises.mkdir(path, { ...options });
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
/**
 * Synchronously creates a new directory with the specified path.
 *
 * Defaults to throwing error if the directory already exists.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdirSync } from "@neotales/fs/mkdir";
 * mkdirSync("new_dir");
 * mkdirSync("nested/directories", { recursive: true });
 * mkdirSync("restricted_access_dir", { mode: 0o700 });
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the new directory.
 * @param options Options for creating directories.
 */
export function mkdirSync(path, options) {
    if (isDeno) {
        globals.Deno.mkdirSync(path, { ...options });
    }
    else {
        try {
            getNodeFs().mkdirSync(path, { ...options });
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
