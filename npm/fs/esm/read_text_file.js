/**
 * The `read-text-file` module provides functions to read the contents of a file as text.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { getNodeFs, globals } from "./globals.js";
import { mapError } from "./_map_error.js";
/**
 * Asynchronously reads and returns the entire contents of a file as an UTF-8 decoded string.
 *
 * Reading a directory throws an error.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { readTextFile } from "@neotales/fs/read-text-file";
 *
 * const content = await readTextFile("README.md"); // full content of README.md
 *
 * ok(content.length > 0);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the symbolic link.
 * @param options Options when reading a file. See {@linkcode ReadFileOptions}.
 * @returns A promise that resolves to string of the file content.
 */
export async function readTextFile(path, options) {
    if (globals.Deno) {
        return await globals.Deno.readTextFile(path, { ...options });
    }
    else {
        const { signal } = options ?? {};
        try {
            return await getNodeFs().promises.readFile(path, {
                encoding: "utf-8",
                signal,
            });
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
/**
 * Synchronously reads and returns the entire contents of a file as an UTF-8 decoded string.
 *
 * Reading a directory throws an error.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { readTextFileSync } from "@neotales/fs/read-text-file";
 *
 * const content = readTextFileSync("README.md"); // full content of README.md
 *
 * ok(content.length > 0);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the symbolic link.
 * @returns The string of file content.
 */
export function readTextFileSync(path) {
    if (globals.Deno) {
        return globals.Deno.readTextFileSync(path);
    }
    else {
        try {
            return getNodeFs().readFileSync(path, "utf-8");
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
