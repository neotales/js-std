// Copyright 2018-2026 the Deno authors. MIT license.
import "./_dnt.polyfills.js";
import { getNodeFs, isDeno } from "./_utils.js";
import { mapError } from "./_map_error.js";
import { globals } from "./globals.js";
/**
 * Change owner of a regular file or directory.
 *
 * This functionality is not available on Windows.
 *
 * Requires `allow-write` permission.
 *
 * Throws Error (not implemented) if executed on Windows.
 *
 * @example Usage
 * ```ts ignore
 * import { chown } from "@std/fs/chown";
 * await chown("README.md", 1000, 1002);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the file/directory.
 * @param uid The user id (UID) of the new owner, or `null` for no change.
 * @param gid The group id (GID) of the new owner, or `null` for no change.
 */
export async function chown(path, uid, gid) {
    if (isDeno) {
        await globals.Deno.chown(path, uid, gid);
    }
    else {
        try {
            await getNodeFs().promises.chown(path, uid ?? -1, gid ?? -1);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
/**
 * Synchronously change owner of a regular file or directory.
 *
 * This functionality is not available on Windows.
 *
 * Requires `allow-write` permission.
 *
 * Throws Error (not implemented) if executed on Windows.
 *
 * @example Usage
 * ```ts ignore
 * import { chownSync } from "@std/fs/chown";
 * chownSync("README.md", 1000, 1002);
 * ```
 *
 * @tags allow-write
 *
 * @param path The path to the file/directory.
 * @param uid The user id (UID) of the new owner, or `null` for no change.
 * @param gid The group id (GID) of the new owner, or `null` for no change.
 */
export function chownSync(path, uid, gid) {
    if (isDeno) {
        globals.Deno.chownSync(path, uid, gid);
    }
    else {
        try {
            getNodeFs().chownSync(path, uid ?? -1, gid ?? -1);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
