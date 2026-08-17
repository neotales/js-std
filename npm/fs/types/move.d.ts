/**
 * The `move` module provides functions to move files and directories.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/** Options for {@linkcode move} and {@linkcode moveSync}. */
export interface MoveOptions {
    /**
     * Whether the destination file should be overwritten if it already exists.
     *
     * @default {false}
     */
    overwrite?: boolean;
}
/**
 * Asynchronously moves a file or directory.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @returns A void promise that resolves once the operation completes.
 *
 * @example Basic usage
 * ```ts
 * import { move } from "@neotales/fs";
 *
 * await move("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts
 * import { move } from "@neotales/fs";
 *
 * await move("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export declare function move(src: string | URL, dest: string | URL, { overwrite }?: MoveOptions): Promise<void>;
/**
 * Synchronously moves a file or directory.
 *
 * @param src The source file or directory as a string or URL.
 * @param dest The destination file or directory as a string or URL.
 * @param options Options for the move operation.
 * @returns A void value that returns once the operation completes.
 *
 * @example Basic usage
 * ```ts
 * import { moveSync } from "@neotales/fs";
 *
 * moveSync("./foo", "./bar");
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar` without
 * overwriting.
 *
 * @example Overwriting
 * ```ts
 * import { moveSync } from "@neotales/fs";
 *
 * moveSync("./foo", "./bar", { overwrite: true });
 * ```
 *
 * This will move the file or directory at `./foo` to `./bar`, overwriting
 * `./bar` if it already exists.
 */
export declare function moveSync(src: string | URL, dest: string | URL, { overwrite }?: MoveOptions): void;
