/**
 * The `rename` module provides functions to rename files or directories.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Renames a file or directory.
 * @param oldPath The path to the existing file or directory.
 * @param newPath The path to the new file or directory.
 * @returns A promise that resolves when the operation is complete.
 */
export declare function rename(oldPath: string | URL, newPath: string | URL): Promise<void>;
/**
 * Synchronously renames a file or directory.
 * @param oldPath The path to the existing file or directory.
 * @param newPath The path to the new file or directory.
 */
export declare function renameSync(oldPath: string | URL, newPath: string | URL): void;
