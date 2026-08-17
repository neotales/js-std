// Copyright 2018-2026 the Deno authors. MIT license.
import "./_dnt.polyfills.js";
import { mapError } from "./_map_error.js";
import { getNodeFs, isDeno } from "./_utils.js";
import { globals } from "./globals.js";
/**
 * Copies the contents and permissions of one file to another specified path, by default creating a
 * new file if needed, else overwriting. Fails if target path is a directory or is unwritable.
 *
 * Requires `allow-read` and `allow-write` permission.
 *
 * For a full description, see {@linkcode copyFile}.
 *
 * @example Usage
 * ```ts ignore
 * import { copyFile } from "@std/fs/unstable-copy-file";
 * copyFile("README.md", "README-Copy.md");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param from The path of source filename to copy.
 * @param to The path of destination filename.
 */
export async function copyFile(from, to) {
    if (isDeno) {
        await globals.Deno.copyFile(from, to);
    }
    else {
        try {
            await getNodeFs().promises.copyFile(from, to);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
/**
 * Synchronously copies the contents and permissions of one file to another specified path,
 * by default creating a new file if needed, else overwriting. Fails if target path is a directory
 * or is unwritable.
 *
 * Requires `allow-read` and `allow-write` permission.
 *
 * For a full description, see {@linkcode copyFileSync}.
 *
 * @example Usage
 * ```ts ignore
 * import { copyFileSync } from "@std/fs/unstable-copy-file";
 * copyFileSync("README.md", "README-Copy.md");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param from The path of source filename to copy.
 * @param to The path of destination filename.
 */
export function copyFileSync(from, to) {
    if (isDeno) {
        globals.Deno.copyFileSync(from, to);
    }
    else {
        try {
            getNodeFs().copyFileSync(from, to);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
