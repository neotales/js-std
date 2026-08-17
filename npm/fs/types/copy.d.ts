/**
 * The copy module provides functions to copy files and directories
 * synchronously and asynchronously. It supports various file system
 * operations, including copying files, directories, and symbolic links.
 * @module
 */
import "./_dnt.polyfills.js";
/** Options for {@linkcode copy} and {@linkcode copySync}. */
export interface CopyOptions {
    /**
     * Whether to overwrite existing file or directory.
     *
     * @default {false}
     */
    overwrite?: boolean;
    /**
     * When `true`, will set last modification and access times to the ones of
     * the original source files. When `false`, timestamp behavior is
     * OS-dependent.
     *
     * @default {false}
     */
    preserveTimestamps?: boolean;
}
/**
 * Asynchronously copy a file or directory. The directory can have contents.
 * Like `cp -r`.
 *
 * If `src` is a directory it will copy everything inside of this directory,
 * not the entire directory itself. If `src` is a file, `dest` cannot be a
 * directory.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param src The source file/directory path as a string or URL.
 * @param dest The destination file/directory path as a string or URL.
 * @param options Options for copying.
 * @returns A promise that resolves once the copy operation completes.
 *
 * @example Basic usage
 * ```ts
 * import { copy } from "@neotales/fs";
 *
 * await copy("./foo", "./bar");
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting files/directories
 * ```ts
 * import { copy } from "@neotales/fs";
 *
 * await copy("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and overwrite
 * any existing files or directories.
 *
 * @example Preserving timestamps
 * ```ts
 * import { copy } from "@neotales/fs";
 *
 * await copy("./foo", "./bar", { preserveTimestamps: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and set the
 * last modification and access times to the ones of the original source files.
 */
export declare function copy(src: string | URL, dest: string | URL, options?: CopyOptions): Promise<void>;
/**
 * Synchronously copy a file or directory. The directory can have contents.
 * Like `cp -r`.
 *
 * If `src` is a directory it will copy everything inside of this directory,
 * not the entire directory itself. If `src` is a file, `dest` cannot be a
 * directory.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param src The source file/directory path as a string or URL.
 * @param dest The destination file/directory path as a string or URL.
 * @param options Options for copying.
 * @returns A void value that returns once the copy operation completes.
 *
 * @example Basic usage
 * ```ts
 * import { copySync } from "@neotales/fs";
 *
 * copySync("./foo", "./bar");
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting files/directories
 * ```ts
 * import { copySync } from "@neotales/fs";
 *
 * copySync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and overwrite
 * any existing files or directories.
 *
 * @example Preserving timestamps
 * ```ts
 * import { copySync } from "@neotales/fs";
 *
 * copySync("./foo", "./bar", { preserveTimestamps: true });
 * ```
 *
 * This will copy the file or directory at `./foo` to `./bar` and set the
 * last modification and access times to the ones of the original source files.
 */
export declare function copySync(src: string | URL, dest: string | URL, options?: CopyOptions): void;
