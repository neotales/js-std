/**
 * The `utime` module provides functions to change the access time and modification time of a file or directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { getNodeFs, globals } from "./globals.js";
import { mapError } from "./_map_error.js";
/** Changes the access (`atime`) and modification (`mtime`) times of a file
 * system object referenced by `path`. Given times are either in seconds
 * (UNIX epoch time) or as `Date` objects.
 *
 * Requires `allow-write` permission for the target path
 *
 * @example Usage
 *
 * ```ts
 * import { ok } from "@frostyeti/assert"
 * import { utime } from "@neotales/fs/utime";
 * import { stat } from "@neotales/fs/stat"
 *
 * const newAccessDate = new Date()
 * const newModifiedDate = new Date()
 *
 * const fileBefore = await Deno.stat("README.md")
 * await Deno.utime("README.md", newAccessDate, newModifiedDate)
 * const fileAfter = await Deno.stat("README.md")
 *
 * ok(fileBefore.atime !== fileAfter.atime)
 * ok(fileBefore.mtime !== fileAfter.mtime)
 * ```
 * @tags allow-write
 * @category File System
 * @param path The path to the file to be updated
 * @param atime The new access time
 * @param mtime The new modification time
 */
export async function utime(path, atime, mtime) {
    if (globals.Deno) {
        return await globals.Deno.utime(path, atime, mtime);
    }
    try {
        await getNodeFs().promises.utimes(path, atime, mtime);
        return;
    }
    catch (error) {
        throw mapError(error);
    }
}
/** Synchronously changes the access (`atime`) and modification (`mtime`)
 * times of the file stream resource. Given times are either in seconds
 * (UNIX epoch time) or as `Date` objects.
 *
 * Requires `allow-write` permission for the target path
 *
 * @example Usage
 *
 * ```ts
 * import { ok } from "@frostyeti/assert"
 * import { utimeSync } from "@neotales/fs/utime";
 * import { stat } from "@neotales/fs/stat"
 *
 * const newAccessDate = new Date()
 * const newModifiedDate = new Date()
 *
 * const fileBefore = await Deno.stat("README.md")
 * Deno.utimeSync("README.md", newAccessDate, newModifiedDate)
 * const fileAfter = await Deno.stat("README.md")
 *
 * ok(fileBefore.atime !== fileAfter.atime)
 * ok(fileBefore.mtime !== fileAfter.mtime)
 * ```
 * @tags allow-write
 * @category File System
 * @param path The path to the file to be updated
 * @param atime The new access time
 * @param mtime The new modification time
 */
export function utimeSync(path, atime, mtime) {
    if (globals.Deno) {
        return globals.Deno.utimeSync(path, atime, mtime);
    }
    try {
        getNodeFs().utimesSync(path, atime, mtime);
    }
    catch (error) {
        throw mapError(error);
    }
}
