import type { FileInfo, WalkEntry } from "./types.js";
export declare function toPathString(pathUrl: string | URL): string;
export type PathType = "file" | "dir" | "symlink";
/**
 * Get a human readable file type string.
 *
 * @param fileInfo A FileInfo describes a file and is returned by `stat`,
 *                 `lstat`
 */
export declare function getFileInfoType(fileInfo: FileInfo): PathType | undefined;
/**
 * Test whether or not `dest` is a sub-directory of `src`
 * @param src src file path
 * @param dest dest file path
 * @param sep path separator
 */
export declare function isSubdir(src: string | URL, dest: string | URL, sep?: "\\" | "/"): boolean;
/**
 * Test whether `src` and `dest` resolve to the same location
 * @param src src file path
 * @param dest dest file path
 */
export declare function isSamePath(src: string | URL, dest: string | URL): boolean | void;
/** Create {@linkcode WalkEntry} for the `path` synchronously. */
export declare function createWalkEntrySync(path: string | URL): WalkEntry;
/** Create {@linkcode WalkEntry} for the `path` asynchronously. */
export declare function createWalkEntry(path: string | URL): Promise<WalkEntry>;
