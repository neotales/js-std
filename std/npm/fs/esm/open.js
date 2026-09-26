// Copyright 2018-2026 the Deno authors. MIT license.
import "./_dnt.polyfills.js";
import { getNodeFs, getNodeUtil } from "./_utils.js";
import { getOpenFsFlag } from "./_get_fs_flag.js";
import { mapError } from "./_map_error.js";
import { NodeFsFile } from "./_node_fs_file.js";
import { globals, IS_DENO, WIN } from "./globals.js";
/**
 * Open a file and resolve to an instance of {@linkcode FsFile}. The file
 * does not need to previously exist if using the `create` or `createNew` open
 * options. The caller may have the resulting file automatically closed by the
 * runtime once it's out of scope by declaring the file variable with the
 * `using` keyword.
 *
 * Requires `allow-read` and/or `allow-write` permissions depending on
 * options.
 *
 * @example Automatic closing a file with `using` **TypeScript Only**
 * ```ts ignore
 * import { open } from "@std/fs/unstable-open";
 * using file = await open("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * ```
 *
 * @example Manually closing a file
 * ```ts ignore
 * import { open } from "@neotales/fs/open";
 * const file = await open("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * file.close();
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the opened file.
 * @param options Options to open a file. See {@linkcode OpenOptions}.
 * @returns A Promise that resolves to a {@linkcode FsFile} instance.
 */
export async function open(path, options) {
    if (IS_DENO) {
        return globals.Deno.open(path, options);
    }
    else {
        const { read = true, write = false, append = false, truncate = false, create = false, createNew = false, mode = 0o666, } = options ?? {};
        try {
            const flagOptions = {
                read,
                write,
                append,
                truncate,
                create,
                createNew,
            };
            let flag = getOpenFsFlag(flagOptions);
            const truncateWithoutCreate = WIN && truncate && !create && !createNew;
            if (truncateWithoutCreate)
                flag &= ~getNodeFs().constants.O_TRUNC;
            const fs = getNodeFs();
            const { promisify } = getNodeUtil();
            const nodeOpenFd = promisify(fs.open);
            const fd = await nodeOpenFd(path, flag, mode);
            if (truncateWithoutCreate) {
                try {
                    await promisify(fs.ftruncate)(fd, 0);
                }
                catch (error) {
                    fs.closeSync(fd);
                    throw error;
                }
            }
            return new NodeFsFile(fd);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
/**
 * Synchronously open a file and return an instance of {@linkcode FsFile}.
 * The file does not need to previously exist if using the `create` or
 * `createNew` open options. The caller may have the resulting file
 * automatically closed by the runtime once it's out of scope by declaring the
 * file variable with the `using` keyword.
 *
 * Requires `allow-read` and/or `allow-write` permissions depending on
 * options.
 *
 * @example Automatic closing a file with `using` **TypeScript Only**
 * ```ts ignore
 * import { openSync } from "@neotales/fs/open";
 * using file = openSync("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * ```
 *
 * @example Manually closing an opened file
 * ```ts ignore
 * import { openSync } from "@neotales/fs/open";
 * const file = openSync("/foo/bar.txt", { read: true, write: true });
 * // Do work with file.
 * file.close();
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path to the opened file.
 * @param options Options to open a file. See {@linkcode OpenOptions}.
 * @returns A {@linkcode FsFile} instance.
 */
export function openSync(path, options) {
    if (IS_DENO) {
        return globals.Deno.openSync(path, options);
    }
    else {
        const { read = true, write = false, append = false, truncate = false, create = false, createNew = false, mode = 0o666, } = options ?? {};
        try {
            const flagOptions = {
                read,
                write,
                append,
                truncate,
                create,
                createNew,
            };
            let flag = getOpenFsFlag(flagOptions);
            const truncateWithoutCreate = WIN && truncate && !create && !createNew;
            if (truncateWithoutCreate)
                flag &= ~getNodeFs().constants.O_TRUNC;
            const fd = getNodeFs().openSync(path, flag, mode);
            if (truncateWithoutCreate) {
                try {
                    getNodeFs().ftruncateSync(fd, 0);
                }
                catch (error) {
                    getNodeFs().closeSync(fd);
                    throw error;
                }
            }
            return new NodeFsFile(fd);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
