/**
 * The `read-dir` module provides functions to read the contents of a directory
 * and return information about its contents.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { DirEntry } from "./types.js";
/**
 * Reads the directory given by `path` and returns an async iterable of
 * {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * Throws Error if `path` is not a directory.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readDir } from "@neotales/fs/readdir";
 *
 * for await (const dirEntry of readDir("/")) {
 *   console.log(dirEntry.name);
 * }
 * ```
 *
 * @tags allow-read
 * @category File System
 *
 * @param path The path to the directory to read.
 * @returns An async iterable of {@linkcode DirEntry}.
 */
export declare function readdir(path: string | URL): AsyncIterable<DirEntry>;
/**
 * Synchronously reads the directory given by `path` and returns an iterable
 * of {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * Throws Error if `path` is not a directory.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readDirSync } from "@neotales/fs/readdir";
 *
 * for (const dirEntry of readDirSync("/")) {
 *   console.log(dirEntry.name);
 * }
 * ```
 *
 * @tags allow-read
 * @category File System
 *
 * @param path The path to the directory to read.
 * @returns An iterable of {@linkcode DirEntry}.
 */
export declare function readdirSync(path: string | URL): Iterable<DirEntry>;
