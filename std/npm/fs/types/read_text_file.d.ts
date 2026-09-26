/**
 * The `read-text-file` module provides functions to read the contents of a file as text.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { ReadFileOptions } from "./types.js";
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
export declare function readTextFile(path: string | URL, options?: ReadFileOptions): Promise<string>;
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
export declare function readTextFileSync(path: string | URL): string;
