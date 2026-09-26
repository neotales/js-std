// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright 2025 frostyetidev frostyeti.land for any modifications. All rights reserved. MIT license.
/**
 * The `ensureDir` module provides functions to ensure that a directory exists.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { isAlreadyExistsError, isNotFoundError } from "./errors.js";
import { mkdir, mkdirSync } from "./mkdir.js";
import { stat, statSync } from "./stat.js";
import { getFileInfoType } from "./utils.js";
/**
 * Asynchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A promise that resolves once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@neotales/fs";
 *
 * await ensureDir("./bar");
 * ```
 */
export async function ensureDir(dir) {
    try {
        const fileInfo = await stat(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
        return;
    }
    catch (err) {
        if (!isNotFoundError(err)) {
            throw err;
        }
    }
    // The dir doesn't exist. Create it.
    // This can be racy. So we catch AlreadyExists and check stat again.
    try {
        await mkdir(dir, { recursive: true });
    }
    catch (err) {
        if (!isAlreadyExistsError(err)) {
            throw err;
        }
        const fileInfo = await stat(dir);
        if (!fileInfo.isDirectory) {
            const error = new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
            error.cause = err;
            throw error;
        }
    }
}
/**
 * Synchronously ensures that the directory exists. If the directory structure
 * does not exist, it is created. Like `mkdir -p`.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to ensure, as a string or URL.
 * @returns A void value that returns once the directory exists.
 *
 * @example
 * ```ts
 * import { ensureDir } from "@neotales/fs";
 *
 * await ensureDir("./bar");
 * ```
 */
export function ensureDirSync(dir) {
    try {
        const fileInfo = statSync(dir);
        if (!fileInfo.isDirectory) {
            throw new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
        }
        return;
    }
    catch (err) {
        if (!isNotFoundError(err)) {
            throw err;
        }
    }
    // The dir doesn't exist. Create it.
    // This can be racy. So we catch AlreadyExists and check stat again.
    try {
        mkdirSync(dir, { recursive: true });
    }
    catch (err) {
        if (!isAlreadyExistsError(err)) {
            throw err;
        }
        const fileInfo = statSync(dir);
        if (!fileInfo.isDirectory) {
            const error = new Error(`Ensure path exists, expected 'dir', got '${getFileInfoType(fileInfo)}'`);
            error.cause = err;
            throw error;
        }
    }
}
