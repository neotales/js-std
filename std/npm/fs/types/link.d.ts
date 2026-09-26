import "./_dnt.polyfills.js";
/**
 * Creates `newpath` as a hard link to `oldpath`.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { link } from "@neotales/fs/link";
 * await link("old/name", "new/name");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the hard link.
 * @param newpath The path of the hard link.
 */
export declare function link(oldpath: string, newpath: string): Promise<void>;
/**
 * Synchronously creates `newpath` as a hard link to `oldpath`.
 *
 * Requires `allow-read` and `allow-write` permissions.
 *
 * @example Usage
 * ```ts ignore
 * import { linkSync } from "@neotales/fs/link";
 * linkSync("old/name", "new/name");
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param oldpath The path of the resource pointed by the hard link.
 * @param newpath The path of the hard link.
 */
export declare function linkSync(oldpath: string, newpath: string): void;
