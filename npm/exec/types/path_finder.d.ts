/**
 * The `path-finder` module provides a way to find the path of executables
 * across different platforms (Windows, Darwin, Linux).
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Represents the options for the path finder.
 */
export interface PathFinderOptions {
    /**
     * The name of the path finder.
     */
    name: string;
    /**
     * The executable path for the path finder.
     */
    executable?: string;
    /**
     * The environment variable for the path finder.
     */
    envVariable?: string;
    /**
     * The cached path for the path finder.
     */
    cached?: string;
    /**
     * A flag indicating if the cached path should be ignored.
     */
    noCache?: boolean;
    /**
     * An array of additional paths for the path finder on Windows.
     * Environment variables can be used in the paths.
     *
     * @example
     * ```ts
     * import { pathFinder } from "./path-finder.ts";
     *
     * pathFinder.set("deno", {
     *  name: "deno",
     *  windows: ["${USER}\\.deno\\bin\\deno.exe"],
     * })
     */
    windows?: string[];
    /**
     * An array of additional paths for the path finder on Darwin.
     * Environment variables can be used in the paths.
     *
     * @example
     * ```ts
     * import { pathFinder } from "./path-finder.ts";
     *
     * pathFinder.set("deno", {
     *  name: "deno",
     *  linux: ["${USER}/.deno/bin/deno"],
     * })
     * ```
     */
    linux?: string[];
    /**
     * An array of additional paths for the path finder on Darwin.
     * Environment variables can be used in the paths.
     *
     * @example
     * ```ts
     * import { pathFinder } from "./path-finder.ts";
     *
     * pathFinder.set("deno", {
     *  name: "deno",
     *  darwin: ["${USER}/.deno/bin/deno"],
     * })
     * ```
     */
    darwin?: string[];
}
/**
 * Represents a path finder that allows storing and retrieving
 * options for finding an executable and methods to find the
 * executable.
 *
 * The path finder will use the options to look up by precendence:
 *
 * - If the full path to the executable is provided, it will be used.
 * - If an environment variable is provided, it will be used.
 * - If a cached path is provided, it will be used.
 * - If the executable is found in the system path, it will be used.
 * - If the executable is found in the windows paths when on Windows, it will be used.
 * - If the executable is found in the darwin paths when on Darwin or linux paths, it will be used.
 * - If the executable is found in the linux paths, it will be used.
 *
 * The paths for windows, darwin, and linux can contain environment variables e.g.
 * `${USERPROFILE}`, `${USER}`, or `%USERPROFILE% that will be expanded before checking if the file exists.
 * @example
 * ```ts
 * import { pathFinder } from "./path-finder.ts";
 *
 * pathFinder.set("deno", {
 *    name: "deno",
 *    envVariable: "DENO_EXE",
 *    windows: ["${USERPROFILE}\\.deno\\bin\\deno.exe"],
 *    linux: ["${USER}/.deno/bin/deno"],
 * });
 *
 * const deno = await pathFinder.findExe("deno");
 * console.log(deno);
 * ```
 */
export declare class PathFinder {
    #private;
    /**
     * Creates an empty executable path registry.
     *
     * @example
     * ```ts
     * import { PathFinder } from "@neotales/exec";
     *
     * const finder = new PathFinder();
     * ```
     */
    constructor();
    /**
     * Sets the path finder options for a given name.
     * @param name - The name of the path finder.
     * @param options - The path finder options.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * pathFinder.set("my-tool", {
     *   name: "my-tool",
     *   envVariable: "MY_TOOL_PATH",
     *   windows: ["C:\\Program Files\\MyTool\\my-tool.exe"],
     *   linux: ["/opt/my-tool/bin/my-tool"],
     *   darwin: ["/Applications/MyTool.app/Contents/MacOS/my-tool"],
     * });
     * ```
     */
    set(name: string, options: PathFinderOptions): void;
    /**
     * Retrieves the path finder options for a given name.
     * @param name - The name of the path finder.
     * @returns The path finder options, or undefined if not found.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * const options = pathFinder.get("deno");
     * if (options) {
     *   console.log("Deno options:", options);
     * }
     * ```
     */
    get(name: string): PathFinderOptions | undefined;
    /**
     * Checks if a path finder with the given name exists.
     * @param name - The name of the path finder.
     * @returns True if the path finder exists, false otherwise.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * if (pathFinder.has("deno")) {
     *   console.log("Deno is registered");
     * }
     * ```
     */
    has(name: string): boolean;
    /**
     * Deletes the path finder with the given name.
     * @param name - The name of the path finder.
     * @returns True if the path finder was deleted, false otherwise.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * pathFinder.delete("my-tool");
     * ```
     */
    delete(name: string): boolean;
    /**
     * Clears all path finders.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * pathFinder.clear();
     * ```
     */
    clear(): void;
    /**
     * Finds the path finder options for a given name.
     * @param name - The name of the path finder.
     * @returns The path finder options, or undefined if not found.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * const options = pathFinder.find("git");
     * ```
     */
    find(name: string): PathFinderOptions | undefined;
    /**
     * Finds the executable path for a given name.
     * @param name - The name of the executable.
     * @returns The executable path, or undefined if not found.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * const gitPath = await pathFinder.findExe("git");
     * if (gitPath) {
     *   console.log("Git found at:", gitPath);
     * }
     * ```
     */
    findExe(name: string): Promise<string | undefined>;
    /**
     * Synchronously finds the executable path for a given name.
     * @param name - The name of the executable.
     * @returns The executable path, or undefined if not found.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * const nodePath = pathFinder.findExeSync("node");
     * console.log("Node.js path:", nodePath);
     * ```
     */
    findExeSync(name: string): string | undefined;
}
/**
 * The default global path finder instance.
 */
export declare const pathFinder: PathFinder;
