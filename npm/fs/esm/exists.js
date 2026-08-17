/**
 * The `exists` module provides functions to check if a file or directory exists
 * and to check its properties.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { stat, statSync } from "./stat.js";
import { uid } from "./uid.js";
import { gid } from "./gid.js";
import { globals, WIN } from "./globals.js";
import { NotFound } from "./unstable_errors.js";
/**
 * Asynchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * Use it sparingly: its result is only a snapshot and must not be relied on for
 * correctness, security, or access-control decisions.
 * See the recommended method below.
 *
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 * @returns A promise that resolves with `true` if the path exists, `false`
 * otherwise.
 *
 * @example Recommended method
 * ```ts
 * // Notice no use of exists
 * try {
 *   await Deno.remove("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `exists()` is not used in the above example. Doing so avoids a
 * possible race condition. See the above section for details.
 *
 * @example Basic usage
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./exists"); // true
 * await exists("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./readable", { isReadable: true }); // true
 * await exists("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./directory", { isDirectory: true }); // true
 * await exists("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./file", { isFile: true }); // true
 * await exists("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * await exists("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 * ```ts
 * import { exists } from "@neotales/fs";
 *
 * await exists("./readable_file", { isReadable: true, isFile: true }); // true
 * await exists("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */
export async function exists(path, options) {
    try {
        const fi = await stat(path);
        if (options && (options.isReadable || options.isDirectory || options.isFile)) {
            if (options.isDirectory && options.isFile) {
                throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
            }
            if ((options.isDirectory && !fi.isDirectory) || (options.isFile && !fi.isFile)) {
                return false;
            }
            if (options.isReadable) {
                if (fi.mode === null) {
                    return true; // Exclusive on Non-POSIX systems
                }
                if (uid() === fi.uid) {
                    // User is owner and can read?
                    return (fi.mode & 0o400) === 0o400;
                }
                else if (gid() === fi.gid) {
                    // User group is owner and can read?
                    return (fi.mode & 0o040) === 0o040;
                }
                return (fi.mode & 0o004) === 0o004; // Others can read?
            }
        }
        return true;
    }
    catch (error) {
        if (error instanceof NotFound) {
            return false;
        }
        if (globals.process && error instanceof Error) {
            const { code } = error;
            if (code === "ENOENT") {
                return false;
            }
            if (code === "EPERM" || code === "EACCES") {
                if (WIN && code === "EACCES" && (options?.isDirectory || options?.isFile)) {
                    return false; // can't determine if it's a directory or file
                }
                return !options?.isReadable;
            }
        }
        if (globals.Deno) {
            if (error instanceof globals.Deno.errors.NotFound) {
                return false;
            }
            if (error instanceof globals.Deno.errors.PermissionDenied) {
                if ((await globals.Deno.permissions.query({ name: "read", path })).state === "granted") {
                    // --allow-read not missing
                    return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
                }
            }
        }
        throw error;
    }
}
/**
 * Synchronously test whether or not the given path exists by checking with
 * the file system.
 *
 * Note: Do not use this function if performing a check before another operation
 * on that file. Doing so creates a race condition. Instead, perform the actual
 * file operation directly. This function is not recommended for this use case.
 * Use it sparingly: its result is only a snapshot and must not be relied on for
 * correctness, security, or access-control decisions.
 * See the recommended method below.
 *
 * @see https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use
 *
 * @param path The path to the file or directory, as a string or URL.
 * @param options Additional options for the check.
 * @returns `true` if the path exists, `false` otherwise.
 *
 * @example Recommended method
 * ```ts
 * // Notice no use of exists
 * try {
 *   Deno.removeSync("./foo", { recursive: true });
 * } catch (error) {
 *   if (!(error instanceof Deno.errors.NotFound)) {
 *     throw error;
 *   }
 *   // Do nothing...
 * }
 * ```
 *
 * Notice that `existsSync()` is not used in the above example. Doing so avoids
 * a possible race condition. See the above section for details.
 *
 * @example Basic usage
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./exists"); // true
 * existsSync("./does_not_exist"); // false
 * ```
 *
 * @example Check if a path is readable
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./readable", { isReadable: true }); // true
 * existsSync("./not_readable", { isReadable: true }); // false
 * ```
 *
 * @example Check if a path is a directory
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./directory", { isDirectory: true }); // true
 * existsSync("./file", { isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a file
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./file", { isFile: true }); // true
 * existsSync("./directory", { isFile: true }); // false
 * ```
 *
 * @example Check if a path is a readable directory
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./readable_directory", { isReadable: true, isDirectory: true }); // true
 * existsSync("./not_readable_directory", { isReadable: true, isDirectory: true }); // false
 * ```
 *
 * @example Check if a path is a readable file
 * ```ts
 * import { existsSync } from "@neotales/fs";
 *
 * existsSync("./readable_file", { isReadable: true, isFile: true }); // true
 * existsSync("./not_readable_file", { isReadable: true, isFile: true }); // false
 * ```
 */
export function existsSync(path, options) {
    try {
        const fileInfo = statSync(path);
        if (options && (options.isReadable || options.isDirectory || options.isFile)) {
            if (options.isDirectory && options.isFile) {
                throw new TypeError("ExistsOptions.options.isDirectory and ExistsOptions.options.isFile must not be true together.");
            }
            if ((options.isDirectory && !fileInfo.isDirectory) || (options.isFile && !fileInfo.isFile)) {
                return false;
            }
            if (options.isReadable) {
                if (fileInfo.mode === null) {
                    return true; // Exclusive on Non-POSIX systems
                }
                if (uid() === fileInfo.uid) {
                    return (fileInfo.mode & 0o400) === 0o400; // User is owner and can read?
                }
                else if (gid() === fileInfo.gid) {
                    return (fileInfo.mode & 0o040) === 0o040; // User group is owner and can read?
                }
                return (fileInfo.mode & 0o004) === 0o004; // Others can read?
            }
        }
        return true;
    }
    catch (error) {
        if (error instanceof NotFound) {
            return false;
        }
        if (globals.process && error instanceof Error) {
            const { code } = error;
            if (code === "ENOENT") {
                return false;
            }
            if (code === "EPERM" || code === "EACCES") {
                if (WIN && code === "EACCES" && (options?.isDirectory || options?.isFile)) {
                    return false; // can't determine if it's a directory or file
                }
                return !options?.isReadable;
            }
        }
        if (globals.Deno) {
            if (error instanceof globals.Deno.errors.NotFound) {
                return false;
            }
            if (error instanceof globals.Deno.errors.PermissionDenied) {
                if (globals.Deno.permissions.querySync({ name: "read", path }).state === "granted") {
                    // --allow-read not missing
                    return !options?.isReadable; // PermissionDenied was raised by file system, so the item exists, but can't be read
                }
            }
        }
        throw error;
    }
}
