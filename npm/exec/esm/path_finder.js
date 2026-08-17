var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _PathFinder_map;
/**
 * The `path-finder` module provides a way to find the path of executables
 * across different platforms (Windows, Darwin, Linux).
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { equalFold } from "@neotales/strings/equal";
import { expand, get } from "@neotales/env";
import { underscore } from "@neotales/strings/underscore";
import { which, whichSync } from "./which.js";
import { isfile, isfileSync } from "@neotales/fs";
import { DARWIN, WIN } from "./globals.js";
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
export class PathFinder {
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
    constructor() {
        _PathFinder_map.set(this, void 0);
        __classPrivateFieldSet(this, _PathFinder_map, new Map(), "f");
    }
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
    set(name, options) {
        __classPrivateFieldGet(this, _PathFinder_map, "f").set(name, options);
    }
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
    get(name) {
        return __classPrivateFieldGet(this, _PathFinder_map, "f").get(name);
    }
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
    has(name) {
        return __classPrivateFieldGet(this, _PathFinder_map, "f").has(name);
    }
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
    delete(name) {
        return __classPrivateFieldGet(this, _PathFinder_map, "f").delete(name);
    }
    /**
     * Clears all path finders.
     * @example
     * ```ts
     * import { pathFinder } from "@neotales/exec";
     *
     * pathFinder.clear();
     * ```
     */
    clear() {
        __classPrivateFieldGet(this, _PathFinder_map, "f").clear();
    }
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
    find(name) {
        const options = this.get(name);
        if (!options) {
            return;
        }
        for (const [key, value] of __classPrivateFieldGet(this, _PathFinder_map, "f")) {
            if (value.name === name) {
                return value;
            }
            if (value.cached === name) {
                return value;
            }
            if (equalFold(key, name)) {
                return value;
            }
        }
        return undefined;
    }
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
    async findExe(name) {
        let options = this.find(name);
        if (!options) {
            options = {
                name: name,
                envVariable: (underscore(name) + "_EXE").toUpperCase(),
            };
            this.set(name, options);
        }
        if (options?.envVariable) {
            let envPath = get(options.envVariable);
            if (!options.noCache && envPath && envPath.length > 0 && options.cached === envPath) {
                return envPath;
            }
            envPath = expand(envPath ?? "");
            if (!options.noCache && envPath && envPath.length > 0 && options.cached === envPath) {
                return envPath;
            }
            if (envPath && (await isfile(envPath))) {
                options.cached = envPath;
                return envPath;
            }
        }
        if (!options.noCache && options.cached) {
            return options.cached;
        }
        const defaultPath = await which(name);
        if (defaultPath) {
            options.cached = defaultPath;
            return defaultPath;
        }
        if (WIN) {
            if (options.windows && options.windows.length) {
                for (const path of options.windows) {
                    let next = path;
                    next = expand(next);
                    if (await isfile(next)) {
                        options.cached = next;
                        return next;
                    }
                }
            }
            return undefined;
        }
        if (DARWIN) {
            if (options.darwin && options.darwin.length) {
                for (const path of options.darwin) {
                    let next = path;
                    next = expand(next);
                    if (await isfile(next)) {
                        options.cached = next;
                        return next;
                    }
                }
            }
            // allow darwin to use linux paths
            // do not return here
        }
        if (options.linux && options.linux.length) {
            for (const path of options.linux) {
                let next = path;
                next = expand(next);
                if (await isfile(next)) {
                    options.cached = next;
                    return next;
                }
            }
        }
        return undefined;
    }
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
    findExeSync(name) {
        let options = this.find(name);
        if (!options) {
            options = {
                name: name,
                envVariable: (underscore(name) + "_EXE").toUpperCase(),
            };
            this.set(name, options);
        }
        if (options?.envVariable) {
            let envPath = get(options.envVariable);
            if (!options.noCache && envPath && envPath.length > 0 && options.cached === envPath) {
                return envPath;
            }
            envPath = expand(envPath ?? "");
            if (!options.noCache && envPath && envPath.length > 0 && options.cached === envPath) {
                return envPath;
            }
            if (envPath) {
                if (envPath && isfileSync(envPath)) {
                    options.cached = envPath;
                    return envPath;
                }
            }
        }
        if (!options.noCache && options.cached) {
            return options.cached;
        }
        const defaultPath = whichSync(name);
        if (defaultPath) {
            options.cached = defaultPath;
            return defaultPath;
        }
        if (WIN) {
            if (options.windows && options.windows.length) {
                for (const path of options.windows) {
                    let next = path;
                    try {
                        next = expand(next);
                    }
                    catch {
                        continue;
                    }
                    if (isfileSync(next)) {
                        options.cached = next;
                        return next;
                    }
                }
            }
            return undefined;
        }
        if (DARWIN) {
            if (options.darwin && options.darwin.length) {
                for (const path of options.darwin) {
                    let next = path;
                    try {
                        next = expand(next);
                    }
                    catch {
                        // todo: get trace/debug writer to handle
                        continue;
                    }
                    if (isfileSync(next)) {
                        options.cached = next;
                        return next;
                    }
                }
            }
            // allow darwin to use linux paths
            // do not return here
        }
        if (options.linux && options.linux.length) {
            for (const path of options.linux) {
                let next = path;
                try {
                    next = expand(next);
                }
                catch {
                    continue;
                }
                if (isfileSync(next)) {
                    options.cached = next;
                    return next;
                }
            }
        }
        return undefined;
    }
}
_PathFinder_map = new WeakMap();
/**
 * The default global path finder instance.
 */
export const pathFinder = new PathFinder();
