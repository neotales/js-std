/**
 * The `utime` module provides functions to change the access time and modification time of a file or directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
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
export declare function utime(path: string | URL, atime: number | Date, mtime: number | Date): Promise<void>;
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
export declare function utimeSync(path: string | URL, atime: number | Date, mtime: number | Date): void;
