// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * The `move` module provides functions to move files and directories.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { copy, copySync } from "./copy.js";
import { lstat, lstatSync } from "./lstat.js";
import { rm, rmSync } from "./rm.js";
import { rename, renameSync } from "./rename.js";
import { stat, statSync } from "./stat.js";
import { isSamePath, isSubdir } from "./utils.js";
import { AlreadyExistsError, isNotFoundError, SubdirectoryMoveError } from "./errors.js";
const EXISTS_ERROR = new AlreadyExistsError("dest already exists.");
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
export async function move(src, dest, { overwrite = false } = {}) {
    const srcStat = await stat(src);
    if (srcStat.isDirectory && (isSubdir(src, dest) || isSamePath(src, dest))) {
        throw new SubdirectoryMoveError(src, dest);
    }
    if (overwrite) {
        if (isSamePath(src, dest))
            return;
        try {
            await rm(dest, { recursive: true });
        }
        catch (error) {
            if (!isNotFoundError(error)) {
                throw error;
            }
        }
    }
    else {
        try {
            await lstat(dest);
            return Promise.reject(EXISTS_ERROR);
        }
        catch (error) {
            if (!isNotFoundError(error))
                throw error;
        }
    }
    try {
        await rename(src, dest);
    }
    catch (error) {
        if (error.code !== "EXDEV")
            throw error;
        await copy(src, dest, { overwrite });
        await rm(src, { recursive: srcStat.isDirectory });
    }
}
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
export function moveSync(src, dest, { overwrite = false } = {}) {
    const srcStat = statSync(src);
    if (srcStat.isDirectory && (isSubdir(src, dest) || isSamePath(src, dest))) {
        throw new SubdirectoryMoveError(src, dest);
    }
    if (overwrite) {
        if (isSamePath(src, dest))
            return;
        try {
            rmSync(dest, { recursive: true });
        }
        catch (error) {
            if (!isNotFoundError(error)) {
                throw error;
            }
        }
    }
    else {
        try {
            lstatSync(dest);
            throw EXISTS_ERROR;
        }
        catch (error) {
            if (error === EXISTS_ERROR) {
                throw error;
            }
        }
    }
    try {
        renameSync(src, dest);
    }
    catch (error) {
        if (error.code !== "EXDEV")
            throw error;
        copySync(src, dest, { overwrite });
        rmSync(src, { recursive: srcStat.isDirectory });
    }
}
