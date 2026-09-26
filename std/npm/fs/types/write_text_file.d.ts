/**
 * The `write-texto-file` module provides functions to write text data to a file.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { WriteFileOptions } from "./types.js";
/**
 * Write string `data` to the given `path`, by default creating a new file if
 * needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeTextFile } from "@neotales/fs/unstable-write-text-file";
 * await writeTextFile("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data A UTF-8 string or a stream of UTF-8 strings.
 * @param options Options for writing files. See {@linkcode WriteFileOptions}.
 */
export declare function writeTextFile(path: string | URL, data: string | ReadableStream<string>, options?: WriteFileOptions): Promise<void>;
/**
 * Synchronously write string `data` to the given `path`, by default creating
 * a new file if needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeTextFileSync } from "@neotales/fs/unstable-write-text-file";
 * writeTextFileSync("hello1.txt", "Hello world\n");  // overwrite "hello1.txt" or create it
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data A UTF-8 string.
 * @param options Options for writing files. See {@linkcode WriteFileOptions}.
 */
export declare function writeTextFileSync(path: string | URL, data: string, options?: WriteFileOptions): void;
