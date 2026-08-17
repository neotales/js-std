/**
 * The `lstat` module provides functions to get information about a file or directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { getNodeFs, globals } from "./globals.js";
import { toFileInfo } from "./_to_file_info.js";
import { mapError } from "./_map_error.js";
/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a symlink, information for the symlink will be returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstat } from "@neotales/fs/lstat";
 * const fileInfo = await lstat("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export async function lstat(path) {
    if (globals.Deno) {
        // deno-lint-ignore no-explicit-any
        return (await globals.Deno.lstat(path));
    }
    try {
        return toFileInfo(await getNodeFs().promises.lstat(path));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Synchronously returns a {@linkcode FileInfo} for the specified
 * `path`. If `path` is a symlink, information for the symlink will be
 * returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 *
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstatSync } from "@neotales/fs/lstat";
 *
 * const fileInfo = lstatSync("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A {@linkcode FileInfo} for the specified `path`.
 */
export function lstatSync(path) {
    if (globals.Deno) {
        // deno-lint-ignore no-explicit-any
        return globals.Deno.lstatSync(path);
    }
    try {
        return toFileInfo(getNodeFs().lstatSync(path));
    }
    catch (error) {
        throw mapError(error);
    }
}
