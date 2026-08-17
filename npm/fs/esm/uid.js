/**
 * The `uid` module provides a function to get the current user id on POSIX platforms.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { globals } from "./globals.js";
/**
 * Gets the current user id on POSIX platforms.
 * Returns `null` on Windows.
 */
export function uid() {
    if (globals.Deno) {
        return globals.Deno.uid();
    }
    if (globals.process && globals.process.getuid) {
        const currentUid = globals.process.getuid();
        if (currentUid === -1 || currentUid === undefined) {
            return null;
        }
        return currentUid;
    }
    return null;
}
