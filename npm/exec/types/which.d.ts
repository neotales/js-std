/**
 * The `which` module provides a way to find the full path of an executable file
 * given its name.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 * @example
 * ```ts
 * import { whichSync } from "@neotales/exec";
 *
 * // Find an executable on the PATH
 * const gitPath = whichSync("git");
 * console.log(gitPath); // "/usr/bin/git" or undefined
 *
 * // Search with additional paths
 * const customPath = whichSync("my-tool", ["/opt/tools/bin"]);
 *
 * // Disable caching for fresh lookup
 * const freshPath = whichSync("node", undefined, false);
 * ```
 */
export declare function whichSync(fileName: string, prependPath?: string[], useCache?: boolean, debug?: boolean): string | undefined;
/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 * @example
 * ```ts
 * import { which } from "@neotales/exec";
 *
 * // Find an executable on the PATH
 * const gitPath = await which("git");
 * console.log(gitPath); // "/usr/bin/git" or undefined
 *
 * // Check if an executable exists
 * const hasDocker = await which("docker") !== undefined;
 * console.log("Docker installed:", hasDocker);
 *
 * // Search with additional paths
 * const toolPath = await which("my-tool", ["/opt/custom/bin"]);
 * ```
 */
export declare function which(fileName: string, prependPath?: string[], useCache?: boolean, debug?: boolean): Promise<string | undefined>;
/**
 * Finds every executable file matching a name or glob pattern.
 *
 * Searches `prependPath` before the system `PATH`. A simple executable name
 * uses Windows `PATHEXT` matching when applicable. An absolute glob is expanded
 * directly, while a name-only glob is matched against each `PATH` entry.
 *
 * @param fileName The executable name or glob pattern to find.
 * @param prependPath Paths to search before the system `PATH`.
 * @param debug Whether to log filesystem errors encountered while searching.
 * @returns Every matching executable path, in search order.
 * @example
 * ```ts
 * import { whichAll } from "@neotales/exec";
 *
 * const nodeExecutables = await whichAll("node*");
 * console.log(nodeExecutables);
 * ```
 */
export declare function whichAll(fileName: string, prependPath?: string[], debug?: boolean): Promise<string[]>;
/**
 * Synchronously finds every executable file matching a name or glob pattern.
 *
 * Searches `prependPath` before the system `PATH`. A simple executable name
 * uses Windows `PATHEXT` matching when applicable. An absolute glob is expanded
 * directly, while a name-only glob is matched against each `PATH` entry.
 *
 * @param fileName The executable name or glob pattern to find.
 * @param prependPath Paths to search before the system `PATH`.
 * @param debug Whether to log filesystem errors encountered while searching.
 * @returns Every matching executable path, in search order.
 * @example
 * ```ts
 * import { whichAllSync } from "@neotales/exec";
 *
 * const nodeExecutables = whichAllSync("node*");
 * console.log(nodeExecutables);
 * ```
 */
export declare function whichAllSync(fileName: string, prependPath?: string[], debug?: boolean): string[];
