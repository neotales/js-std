/**
 * The `ensureDir` module provides functions to ensure that a directory exists.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Asynchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A promise that resolves once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@neotales/fs";
 *
 * await ensureDir("./bar");
 * ```
 */
export declare function ensureDir(dir: string | URL): Promise<void>;
/**
 * Synchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A void value that returns once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@neotales/fs";
 *
 * await ensureDir("./bar");
 * ```
 */
export declare function ensureDirSync(dir: string | URL): void;
