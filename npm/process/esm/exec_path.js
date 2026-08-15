import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
let ep = undefined;
/**
 * Returns the path to the executable that started the process. Mainly
 * deno, node, bun, or empty string.
 *
 * @description
 * @returns The path to the executable that started the process.
 * @example
 *
 * ```ts
 * import { execPath } from "@neotales/process";
 *
 * console.log(execPath());
 * // Output: "/usr/local/bin/deno" or "/usr/local/bin/node" or "/home/user/.deno/bin/deno"
 * ```
 */
export function execPath() {
    if (typeof ep === "string") {
        return (ep ??= "");
    }
    if (globals.Deno) {
        try {
            ep = globals.Deno.execPath();
            return (ep ??= "");
        }
        catch {
            // The runtime could not provide an executable path.
            ep = "";
            return ep;
        }
    }
    else if (globals.process) {
        return globals.process.execPath;
    }
    else {
        return "";
    }
}
