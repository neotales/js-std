/** Browser-safe ANSI style functions. @module */
import { AnsiSettings } from "./settings.js";
let enabled;
/**
 * Overrides ANSI output for this module. Pass `undefined` to restore automatic
 * enablement based on `AnsiSettings.current.mode`.
 */
export function setColorEnabled(value) {
    enabled = value;
}
/** Returns whether ANSI output is currently enabled. */
export function isColorEnabled() {
    return enabled ?? AnsiSettings.current.mode > 0;
}
function style(open, close) {
    const start = `\x1b[${open.join(";")}m`;
    const end = `\x1b[${close}m`;
    const closing = new RegExp(`\\x1b\\[${close}m`, "g");
    return (value) => isColorEnabled() ? `${start}${value.replace(closing, start)}${end}` : value;
}
/** Applies styles from left to right. */
export function apply(value, ...styles) {
    return isColorEnabled() ? styles.reduce((result, next) => next(result), value) : value;
}
export const reset = style([0], 0);
export const bold = style([1], 22);
export const dim = style([2], 22);
export const italic = style([3], 23);
export const underline = style([4], 24);
export const inverse = style([7], 27);
export const hidden = style([8], 28);
export const strikethrough = style([9], 29);
export const black = style([30], 39);
export const red = style([31], 39);
export const green = style([32], 39);
export const yellow = style([33], 39);
export const blue = style([34], 39);
export const magenta = style([35], 39);
export const cyan = style([36], 39);
export const white = style([37], 39);
export const brightBlack = style([90], 39);
export const brightRed = style([91], 39);
export const brightGreen = style([92], 39);
export const brightYellow = style([93], 39);
export const brightBlue = style([94], 39);
export const brightMagenta = style([95], 39);
export const brightCyan = style([96], 39);
export const brightWhite = style([97], 39);
export const gray = brightBlack;
export const bgBlack = style([40], 49);
export const bgRed = style([41], 49);
export const bgGreen = style([42], 49);
export const bgYellow = style([43], 49);
export const bgBlue = style([44], 49);
export const bgMagenta = style([45], 49);
export const bgCyan = style([46], 49);
export const bgWhite = style([47], 49);
export const bgBrightBlack = style([100], 49);
export const bgBrightRed = style([101], 49);
export const bgBrightGreen = style([102], 49);
export const bgBrightYellow = style([103], 49);
export const bgBrightBlue = style([104], 49);
export const bgBrightMagenta = style([105], 49);
export const bgBrightCyan = style([106], 49);
export const bgBrightWhite = style([107], 49);
function clamp(value) {
    if (!Number.isFinite(value))
        return 0;
    return Math.trunc(Math.max(0, Math.min(255, value)));
}
function rgb(color) {
    return typeof color === "number"
        ? { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff }
        : { r: clamp(color.r), g: clamp(color.g), b: clamp(color.b) };
}
export function rgb8(value, color) {
    return style([38, 5, clamp(color)], 39)(value);
}
export function bgRgb8(value, color) {
    return style([48, 5, clamp(color)], 49)(value);
}
export function rgb24(value, color) {
    const value24 = rgb(color);
    return style([38, 2, value24.r, value24.g, value24.b], 39)(value);
}
export function bgRgb24(value, color) {
    const value24 = rgb(color);
    return style([48, 2, value24.r, value24.g, value24.b], 49)(value);
}
export function rgb24To8(value, color) {
    if (typeof color === "number" && color < 256)
        return rgb8(value, color);
    const value24 = rgb(color);
    const index = 16 +
        36 * Math.round(value24.r / 51) +
        6 * Math.round(value24.g / 51) +
        Math.round(value24.b / 51);
    return rgb8(value, index);
}
const ansiPattern = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
].join("|"), "g");
const ESC = String.fromCharCode(0x1b);
const BEL = String.fromCharCode(7);
const osc8Pattern = new RegExp(`${ESC}]8;;.*?(?:${BEL}|${ESC}\\\\)`, "g");
const terminalControlPattern = new RegExp(`[${ESC}${BEL}]`, "g");
/** Removes ANSI escape sequences from a string. */
export function stripAnsiCode(value) {
    return value.replace(osc8Pattern, "").replace(ansiPattern, "");
}
/**
 * Wraps text in an OSC-8 terminal hyperlink when hyperlinks and colors are
 * enabled. The URL is stripped of terminal control characters.
 */
export function link(value, url) {
    if (!isColorEnabled() || !AnsiSettings.current.links)
        return value;
    const safeUrl = url.replace(terminalControlPattern, "");
    return `\x1b]8;;${safeUrl}\x1b\\${value}\x1b]8;;\x1b\\`;
}
function defineAdaptiveColor(background, trueColor, color256, fallback) {
    return (value) => {
        if (!isColorEnabled())
            return value;
        const mode = AnsiSettings.current.mode;
        if (mode === 24)
            return background ? bgRgb24(value, trueColor) : rgb24(value, trueColor);
        if (mode === 8)
            return background ? bgRgb8(value, color256) : rgb8(value, color256);
        return mode > 0 ? fallback(value) : value;
    };
}
/** Creates a foreground style that degrades with terminal color capability. */
export function defineColor(trueColor, color256, fallback) {
    return defineAdaptiveColor(false, trueColor, color256, fallback);
}
/** Creates a background style that degrades with terminal color capability. */
export function defineBgColor(trueColor, color256, fallback) {
    return defineAdaptiveColor(true, trueColor, color256, fallback);
}
