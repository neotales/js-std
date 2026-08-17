/**
 * The `read-file` module provides functions to read the contents of a file.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { ReadFileOptions } from "./types.js";
/**
 * Reads and resolves to the entire contents of a file as an array of bytes.
 * `TextDecoder` can be used to transform the bytes to string if required.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readFile } from "@neotales/fs/read-file";
 * const decoder = new TextDecoder("utf-8");
 * const data = await readFile("README.md");
 * console.log(decoder.decode(data));
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file.
 * @param options Options when reading a file. See {@linkcode ReadFileOptions}.
 * @returns A promise that resolves to a `Uint8Array` of the file contents.
 */
export declare function readFile(path: string | URL, options?: ReadFileOptions): Promise<Uint8Array>;
/**
 * Synchronously reads and returns the entire contents of a file as an array
 * of bytes. `TextDecoder` can be used to transform the bytes to string if
 * required.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readFileSync } from "@neotales/fs/unstable-read-file";
 * const decoder = new TextDecoder("utf-8");
 * const data = readFileSync("README.md");
 * console.log(decoder.decode(data));
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file.
 * @returns A `Uint8Array` of bytes representing the file contents.
 */
export declare function readFileSync(path: string | URL): Uint8Array;
