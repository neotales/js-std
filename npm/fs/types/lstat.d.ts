/**
 * The `lstat` module provides functions to get information about a file or directory.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { FileInfo } from "./types.js";
/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a symlink, information for the symlink will be returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstat } from "@neotales/fs/lstat";
 * const fileInfo = await lstat("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export declare function lstat(path: string | URL): Promise<FileInfo>;
/**
 * Synchronously returns a {@linkcode FileInfo} for the specified
 * `path`. If `path` is a symlink, information for the symlink will be
 * returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 *
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstatSync } from "@neotales/fs/lstat";
 *
 * const fileInfo = lstatSync("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A {@linkcode FileInfo} for the specified `path`.
 */
export declare function lstatSync(path: string | URL): FileInfo;
