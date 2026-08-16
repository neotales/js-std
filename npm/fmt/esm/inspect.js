import { inspectBrowser } from "./browser_inspect.js";
import { globals } from "./globals.js";
function nodeOptions(options) {
    const result = {
        compact: options.compact ?? 3,
        depth: options.depth ?? 4,
        colors: options.colors ?? false,
    };
    for (const key in options) {
        switch (key) {
            case "compact":
            case "depth":
            case "colors":
            case "escapeSequences":
                break;
            case "iterableLimit":
                result.maxArrayLength = options.iterableLimit;
                break;
            case "strAbbreviateSize":
                result.maxStringLength = options.strAbbreviateSize;
                break;
            default:
                result[key] = options[key];
                break;
        }
    }
    return result;
}
function processInspector() {
    const process = globals.process;
    if (typeof process?.getBuiltinModule !== "function")
        return;
    const util = process.getBuiltinModule("node:util");
    if (typeof util?.inspect !== "function")
        return;
    return util;
}
/**
 * Returns a runtime-native representation when available, otherwise a browser-safe,
 * Node-like representation of the value.
 */
export function inspect(value, options = {}) {
    const deno = globals.Deno;
    if (typeof deno?.inspect === "function") {
        return deno.inspect(value, options);
    }
    const node = processInspector();
    if (node) {
        return node.inspect(value, nodeOptions(options));
    }
    const bun = globals.Bun;
    if (typeof bun?.inspect === "function") {
        return bun.inspect(value, nodeOptions(options));
    }
    return inspectBrowser(value, options);
}
