/**
 * The `cwd` module provides a function to get the current working directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { globals } from "./globals.js";
/**
 * Gets the current working directory.
 * @returns The current working directory.
 */
export function cwd() {
    if (globals.Deno) {
        return globals.Deno.cwd();
    }
    if (globals.process && globals.process.cwd) {
        return globals.process.cwd();
    }
    return "";
}
