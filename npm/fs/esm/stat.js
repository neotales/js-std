/**
 * The `stat` module provides functions to get information about a file or directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { getNodeFs, globals } from "./globals.js";
import { toFileInfo } from "./_to_file_info.js";
import { mapError } from "./_map_error.js";
/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. Will
 * always follow symlinks.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { assert } from "@frostyeti/assert";
 * import { stat } from "@neotales/fs/stat";
 * const fileInfo = await stat("README.md");
 * assert(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export async function stat(path) {
    if (globals.Deno) {
        return await globals.Deno.stat(path);
    }
    try {
        return toFileInfo(await getNodeFs().promises.stat(path));
    }
    catch (error) {
        throw mapError(error);
    }
}
/**
 * Gets information about a file or directory synchronously.
 * @param path The path to the file or directory.
 * @returns The file information.
 * @throws {Error} If the operation fails.
 * @example
 * ```ts
 * import { statSync } from "@neotales/fs/stat";
 * function getFileInfo() {
 *     try {
 *         const info = statSync("example.txt");
 *         console.log("File information:", info);
 *     } catch (error) {
 *         console.error("Error getting file information:", error);
 *     }
 * }
 * getFileInfo();
 * ```
 */
export function statSync(path) {
    if (globals.Deno) {
        return globals.Deno.statSync(path);
    }
    try {
        return toFileInfo(getNodeFs().statSync(path));
    }
    catch (error) {
        throw mapError(error);
    }
}
