/**
 * The `exists` module provides functions to check if a file or directory exists
 * and to check its properties.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import type { ExistsOptions } from "./types.js";
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
export declare function exists(path: string | URL, options?: ExistsOptions): Promise<boolean>;
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
export declare function existsSync(path: string | URL, options?: ExistsOptions): boolean;
