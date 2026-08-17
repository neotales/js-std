/**
 * The `gid` module provides a function to get the current group id on POSIX platforms.
 * It returns `null` on Windows.
 * @module
 */
import "./_dnt.polyfills.js";
import { globals } from "./globals.js";
/**
 * Gets the current group id for the current user on POSIX platforms.
 * Returns `null` on Windows.
 * @returns The current group id or `null` if not available.
 * @example
 * ```ts
 * import { gid } from "@neotales/fs/gid";
 * const groupId = gid();
 * console.log("Current group ID:", groupId);
 * ```
 */
export function gid() {
    if (globals.Deno) {
        return globals.Deno.gid();
    }
    if (globals.process && globals.process.getgid) {
        const currentGid = globals.process.getgid();
        if (currentGid === undefined || currentGid === -1) {
            return null;
        }
        return currentGid;
    }
    return null;
}
