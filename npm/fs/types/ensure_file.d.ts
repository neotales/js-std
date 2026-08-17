/**
 * The `ensure-file` module provides functions to ensure that a file exists.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Asynchronously ensures that the file exists. If the file that is requested to
 * be created is in directories that do not exist, these directories are created.
 * If the file already exists, it is not modified.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param filePath The path of the file to ensure, as a string or URL.
 * @returns A void promise that resolves once the file exists.
 *
 * @example
 * ```ts
 * import { ensureFile } from "@neotales/fs";
 *
 * await ensureFile("./folder/targetFile.dat");
 * ```
 */
export declare function ensureFile(filePath: string | URL): Promise<void>;
/**
 * Synchronously ensures that the file exists. If the file that is requested to
 * be created is in directories that do not exist, these directories are created.
 * If the file already exists, it is not modified.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param filePath The path of the file to ensure, as a string or URL.
 * @returns A void value that returns once the file exists.
 *
 * @example
 * ```ts
 * import { ensureFileSync } from "@neotales/fs";
 *
 * ensureFileSync("./folder/targetFile.dat");
 * ```
 */
export declare function ensureFileSync(filePath: string | URL): void;
