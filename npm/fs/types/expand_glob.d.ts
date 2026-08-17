/**
 * The `expand-glob` module provides functions to expand glob patterns
 * asynchronously and synchronously.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { type GlobOptions } from "@neotales/path";
import type { WalkEntry } from "./types.js";
export type { GlobOptions, WalkEntry };
/** Options for {@linkcode expandGlob} and {@linkcode expandGlobSync}. */
export interface ExpandGlobOptions extends Omit<GlobOptions, "os"> {
    /** File path where to expand from. */
    root?: string;
    /** List of glob patterns to be excluded from the expansion. */
    exclude?: string[];
    /**
     * Whether to include directories in entries.
     *
     * @default {true}
     */
    includeDirs?: boolean;
    /**
     * Whether to follow symbolic links.
     *
     * @default {false}
     */
    followSymlinks?: boolean;
    /**
     * Indicates whether the followed symlink's path should be canonicalized.
     * This option works only if `followSymlinks` is not `false`.
     *
     * @default {true}
     */
    canonicalize?: boolean;
}
/**
 * Returns an async iterator that yields each file path matching the given glob
 * pattern. The file paths are relative to the provided `root` directory.
 * If `root` is not provided, the current working directory is used.
 * The `root` directory is not included in the yielded file paths.
 *
 * Requires the `--allow-read` flag when using Deno.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 * @returns An async iterator that yields each walk entry matching the glob
 * pattern.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts
 * // script.ts
 * import { expandGlob } from "@neotales/fs";
 *
 * const entries = [];
 * for await (const entry of expandGlob("*.ts")) {
 *   entries.push(entry);
 * }
 *
 * entries[0]!.path; // "/Users/user/folder/script.ts"
 * entries[0]!.name; // "script.ts"
 * entries[0]!.isFile; // false
 * entries[0]!.isDirectory; // true
 * entries[0]!.isSymlink; // false
 *
 * entries[1]!.path; // "/Users/user/folder/foo.ts"
 * entries[1]!.name; // "foo.ts"
 * entries[1]!.isFile; // true
 * entries[1]!.isDirectory; // false
 * entries[1]!.isSymlink; // false
 * ```
 */
export declare function expandGlob(glob: string | URL, { root, exclude, includeDirs, extended, globstar, caseInsensitive, followSymlinks, canonicalize, }?: ExpandGlobOptions): AsyncIterableIterator<WalkEntry>;
/**
 * Returns an iterator that yields each file path matching the given glob
 * pattern. The file paths are relative to the provided `root` directory.
 * If `root` is not provided, the current working directory is used.
 * The `root` directory is not included in the yielded file paths.
 *
 * Requires the `--allow-read` flag when using Deno.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 * @returns An iterator that yields each walk entry matching the glob pattern.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts
 * // script.ts
 * import { expandGlobSync } from "@neotales/fs";
 *
 * const entries = [];
 * for (const entry of expandGlobSync("*.ts")) {
 *   entries.push(entry);
 * }
 *
 * entries[0]!.path; // "/Users/user/folder/script.ts"
 * entries[0]!.name; // "script.ts"
 * entries[0]!.isFile; // false
 * entries[0]!.isDirectory; // true
 * entries[0]!.isSymlink; // false
 *
 * entries[1]!.path; // "/Users/user/folder/foo.ts"
 * entries[1]!.name; // "foo.ts"
 * entries[1]!.isFile; // true
 * entries[1]!.isDirectory; // false
 * entries[1]!.isSymlink; // false
 * ```
 */
export declare function expandGlobSync(glob: string | URL, { root, exclude, includeDirs, extended, globstar, caseInsensitive, followSymlinks, canonicalize, }?: ExpandGlobOptions): IterableIterator<WalkEntry>;
