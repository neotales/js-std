/**
 * The `remove` module provides functions to remove files or directories.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { RemoveOptions } from "./types.js";
/**
 * Removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { notOk } from "@frostyeti/assert";
 * import { exists } from "@neotales/fs/exists";
 * import { remove } from "@neotales/fs/rm";
 * import { mkdtemp } from "@neotales/fs/mkdtemp";
 *
 * const tempDir = await mkdtemp();
 * await remove(tempDir);
 * notOk(await exists(tempDir));
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export declare function rm(path: string | URL, options?: RemoveOptions): Promise<void>;
/**
 * Synchronously removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { notOk } from "@frostyeti/assert";
 * import { existsSync } from "@neotales/fs/exists";
 * import { rmSync } from "@neotales/fs/rm";
 * import { mkdtempSync } from "@neotales/fs/mkdtemp";
 *
 * const tempDir = mkdtempSync();
 * rmSync(tempDir);
 * notOk(existsSync(tempDir));
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export declare function rmSync(path: string | URL, options?: RemoveOptions): void;
