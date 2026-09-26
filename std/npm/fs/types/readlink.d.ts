/**
 * The `read-link` module provides functions to read the target of a symbolic link.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Resolves to the path destination of the named symbolic link.
 *
 * Throws Error if called with a hard link.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { readlink } from "@neotales/fs/readlink";
 * import { symlink } from "@neotales/fs/symlink";
 * await symlink("./test.txt", "./test_link.txt");
 * const target = await readlink("./test_link.txt"); // full path of ./test.txt
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the symbolic link.
 * @returns A promise that resolves to the file path pointed by the symbolic
 * link.
 */
export declare function readlink(path: string | URL): Promise<string>;
/**
 * Synchronously returns the path destination of the named symbolic link.
 *
 * Throws Error if called with a hard link.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { readlinkSync } from "@neotales/fs/readlink";
 * import { symlinkSync } from "@neotales/fs/symlink";
 * symlinkSync("./test.txt", "./test_link.txt");
 * const target = readlinkSync("./test_link.txt"); // full path of ./test.txt
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the symbolic link.
 * @returns The file path pointed by the symbolic link.
 */
export declare function readlinkSync(path: string | URL): string;
