/**
 * The `symlink` module provides functions to create symbolic links.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { SymlinkOptions } from "./types.js";
/**
 * Creates `newpath` as a symbolic link to `oldpath`.
 *
 * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
 * This argument is only available on Windows and ignored on other platforms.
 *
 * Requires full `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { symlink } from "@neotales/fs/symlink";
 * await symlink("README.md", "README.md.link");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the symbolic link.
 * @param newpath The path of the symbolic link.
 * @param options Options when creating a symbolic link.
 */
export declare function symlink(target: string | URL, path: string | URL, options?: SymlinkOptions): Promise<void>;
/**
 * Creates `newpath` as a symbolic link to `oldpath`.
 *
 * The `options.type` parameter can be set to `"file"`, `"dir"` or `"junction"`.
 * This argument is only available on Windows and ignored on other platforms.
 *
 * Requires full `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { symlinkSync } from "@neotales/fs/symlink";
 * symlinkSync("README.md", "README.md.link");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the symbolic link.
 * @param newpath The path of the symbolic link.
 * @param options Options when creating a symbolic link.
 */
export declare function symlinkSync(target: string | URL, path: string | URL, options?: SymlinkOptions): void;
