/**
 * The `ensure-link` module provides functions to ensure that a hard link
 * exists.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Asynchronously ensures that the hard link exists. If the directory structure
 * does not exist, it is created.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 * @returns A void promise that resolves once the hard link exists.
 *
 * @example
 * ```ts
 * import { ensureLink } from "@neotales/fs";
 *
 * await ensureLink("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export declare function ensureLink(src: string | URL, dest: string | URL): Promise<void>;
/**
 * Synchronously ensures that the hard link exists. If the directory structure
 * does not exist, it is created.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 * @returns A void value that returns once the hard link exists.
 *
 * @example
 * ```ts
 * import { ensureLinkSync } from "@neotales/fs";
 *
 * ensureLinkSync("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export declare function ensureLinkSync(src: string | URL, dest: string | URL): void;
