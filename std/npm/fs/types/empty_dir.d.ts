/**
 * The `empty-dir` module provides functions to ensure that a directory is empty.
 * It deletes the directory contents if it is not empty. If the directory does not exist, it creates it.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Asynchronously ensures that a directory is empty deletes the directory
 * contents it is not empty. If the directory does not exist, it is created.
 * The directory itself is not deleted.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to empty, as a string or URL.
 * @returns A void promise that resolves once the directory is empty.
 *
 * @example
 * ```ts
 * import { emptyDir } from "@neotales/fs";
 *
 * await emptyDir("./foo");
 * ```
 */
export declare function emptyDir(dir: string | URL): Promise<void>;
/**
 * Synchronously ensures that a directory is empty deletes the directory
 * contents it is not empty. If the directory does not exist, it is created.
 * The directory itself is not deleted.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to empty, as a string or URL.
 * @returns A void value that returns once the directory is empty.
 *
 * @example
 * ```ts
 * import { emptyDirSync } from "@neotales/fs";
 *
 * emptyDirSync("./foo");
 * ```
 */
export declare function emptyDirSync(dir: string | URL): void;
