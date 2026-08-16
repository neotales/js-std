/** Terminal ANSI capability detection. @module */
import { args } from "@neotales/process/args";
import { get, has } from "@neotales/env";
import { AnsiModes } from "./enums.js";
function isWindows() {
    const runtime = globalThis;
    return runtime.Deno?.build?.os === "windows" || runtime.process?.platform === "win32";
}
function forcedMode(value) {
    switch (value.toLowerCase()) {
        case "0":
        case "false":
        case "never":
        case "no":
        case "off":
            return AnsiModes.None;
        case "1":
        case "16":
        case "always":
            return AnsiModes.FourBit;
        case "2":
        case "256":
            return AnsiModes.EightBit;
        case "3":
        case "24":
        case "true":
        case "truecolor":
            return AnsiModes.TwentyFourBit;
        default:
            return AnsiModes.toValue(value);
    }
}
function detectCi(hasValue) {
    if (!hasValue("CI"))
        return undefined;
    return hasValue("GITHUB_ACTIONS") || hasValue("GITEA_ACTIONS") || hasValue("CIRCLECI")
        ? AnsiModes.TwentyFourBit
        : AnsiModes.FourBit;
}
/**
 * Detects terminal color support from flags, environment variables, and CI
 * metadata. Optional values make integration tests and embedders deterministic.
 */
export function detectMode(options = {}) {
    const values = options.env;
    const getValue = (name) => (values ? values[name] : get(name));
    const hasValue = (name) => (values ? values[name] !== undefined : has(name));
    const runtimeArgs = options.args ?? args;
    const colorArgument = runtimeArgs.find((value) => value.startsWith("--color="));
    const colorIndex = runtimeArgs.indexOf("--color");
    if (runtimeArgs.includes("--no-color") || runtimeArgs.includes("--nocolor"))
        return AnsiModes.None;
    if (colorArgument)
        return forcedMode(colorArgument.slice("--color=".length));
    if (colorIndex >= 0) {
        const next = runtimeArgs[colorIndex + 1];
        return next && !next.startsWith("-") ? forcedMode(next) : AnsiModes.FourBit;
    }
    if (hasValue("NO_COLOR"))
        return AnsiModes.None;
    const forceColor = getValue("FORCE_COLOR");
    if (forceColor !== undefined && forceColor !== "")
        return forcedMode(forceColor);
    const color = getValue("COLOR") || getValue("ANSI_COLORS") || getValue("BEARZ_ANSI_COLOR");
    if (color !== undefined && color !== "")
        return AnsiModes.toValue(color);
    const ci = detectCi(hasValue);
    if (ci !== undefined)
        return ci;
    if (getValue("COLORTERM") === "truecolor")
        return AnsiModes.TwentyFourBit;
    const term = getValue("TERM");
    if (term === "dumb")
        return AnsiModes.None;
    if (term) {
        const alias = AnsiModes.toValue(term);
        if (alias !== AnsiModes.Auto)
            return alias;
        if (/-256(color)?$/i.test(term))
            return AnsiModes.EightBit;
        if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(term))
            return AnsiModes.FourBit;
    }
    if (hasValue("COLORTERM"))
        return AnsiModes.FourBit;
    return (options.windows ?? isWindows()) ? AnsiModes.FourBit : AnsiModes.None;
}
