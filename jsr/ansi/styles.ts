/** Browser-safe ANSI style functions. @module */

import { AnsiSettings } from "./settings.ts";

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type Style = (value: string) => string;

let enabled: boolean | undefined;

/**
 * Overrides ANSI output for this module. Pass `undefined` to restore automatic
 * enablement based on `AnsiSettings.current.mode`.
 */
export function setColorEnabled(value: boolean | undefined): void {
  enabled = value;
}

/** Returns whether ANSI output is currently enabled. */
export function isColorEnabled(): boolean {
  return enabled ?? AnsiSettings.current.mode > 0;
}

function style(open: number[], close: number): Style {
  const start = `\x1b[${open.join(";")}m`;
  const end = `\x1b[${close}m`;
  const closing = new RegExp(`\\x1b\\[${close}m`, "g");
  return (value: string): string =>
    isColorEnabled() ? `${start}${value.replace(closing, start)}${end}` : value;
}

/** Applies styles from left to right. */
export function apply(value: string, ...styles: Style[]): string {
  return isColorEnabled() ? styles.reduce((result, next) => next(result), value) : value;
}

export const reset: Style = style([0], 0);
export const bold: Style = style([1], 22);
export const dim: Style = style([2], 22);
export const italic: Style = style([3], 23);
export const underline: Style = style([4], 24);
export const inverse: Style = style([7], 27);
export const hidden: Style = style([8], 28);
export const strikethrough: Style = style([9], 29);
export const black: Style = style([30], 39);
export const red: Style = style([31], 39);
export const green: Style = style([32], 39);
export const yellow: Style = style([33], 39);
export const blue: Style = style([34], 39);
export const magenta: Style = style([35], 39);
export const cyan: Style = style([36], 39);
export const white: Style = style([37], 39);
export const brightBlack: Style = style([90], 39);
export const brightRed: Style = style([91], 39);
export const brightGreen: Style = style([92], 39);
export const brightYellow: Style = style([93], 39);
export const brightBlue: Style = style([94], 39);
export const brightMagenta: Style = style([95], 39);
export const brightCyan: Style = style([96], 39);
export const brightWhite: Style = style([97], 39);
export const gray: Style = brightBlack;
export const bgBlack: Style = style([40], 49);
export const bgRed: Style = style([41], 49);
export const bgGreen: Style = style([42], 49);
export const bgYellow: Style = style([43], 49);
export const bgBlue: Style = style([44], 49);
export const bgMagenta: Style = style([45], 49);
export const bgCyan: Style = style([46], 49);
export const bgWhite: Style = style([47], 49);
export const bgBrightBlack: Style = style([100], 49);
export const bgBrightRed: Style = style([101], 49);
export const bgBrightGreen: Style = style([102], 49);
export const bgBrightYellow: Style = style([103], 49);
export const bgBrightBlue: Style = style([104], 49);
export const bgBrightMagenta: Style = style([105], 49);
export const bgBrightCyan: Style = style([106], 49);
export const bgBrightWhite: Style = style([107], 49);

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.trunc(Math.max(0, Math.min(255, value)));
}

function rgb(color: number | Rgb): Rgb {
  return typeof color === "number"
    ? { r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff }
    : { r: clamp(color.r), g: clamp(color.g), b: clamp(color.b) };
}

export function rgb8(value: string, color: number): string {
  return style([38, 5, clamp(color)], 39)(value);
}

export function bgRgb8(value: string, color: number): string {
  return style([48, 5, clamp(color)], 49)(value);
}

export function rgb24(value: string, color: number | Rgb): string {
  const value24 = rgb(color);
  return style([38, 2, value24.r, value24.g, value24.b], 39)(value);
}

export function bgRgb24(value: string, color: number | Rgb): string {
  const value24 = rgb(color);
  return style([48, 2, value24.r, value24.g, value24.b], 49)(value);
}

export function rgb24To8(value: string, color: number | Rgb): string {
  if (typeof color === "number" && color < 256) return rgb8(value, color);
  const value24 = rgb(color);
  const index =
    16 +
    36 * Math.round(value24.r / 51) +
    6 * Math.round(value24.g / 51) +
    Math.round(value24.b / 51);
  return rgb8(value, index);
}

const ansiPattern = new RegExp(
  [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TXZcf-nq-uy=><~]))",
  ].join("|"),
  "g",
);
const ESC = String.fromCharCode(0x1b);
const BEL = String.fromCharCode(7);
const osc8Pattern = new RegExp(`${ESC}]8;;.*?(?:${BEL}|${ESC}\\\\)`, "g");
const terminalControlPattern = new RegExp(`[${ESC}${BEL}]`, "g");

/** Removes ANSI escape sequences from a string. */
export function stripAnsiCode(value: string): string {
  return value.replace(osc8Pattern, "").replace(ansiPattern, "");
}

/**
 * Wraps text in an OSC-8 terminal hyperlink when hyperlinks and colors are
 * enabled. The URL is stripped of terminal control characters.
 */
export function link(value: string, url: string): string {
  if (!isColorEnabled() || !AnsiSettings.current.links) return value;
  const safeUrl = url.replace(terminalControlPattern, "");
  return `\x1b]8;;${safeUrl}\x1b\\${value}\x1b]8;;\x1b\\`;
}

function defineAdaptiveColor(
  background: boolean,
  trueColor: number | Rgb,
  color256: number,
  fallback: Style,
): Style {
  return (value: string): string => {
    if (!isColorEnabled()) return value;
    const mode = AnsiSettings.current.mode;
    if (mode === 24) return background ? bgRgb24(value, trueColor) : rgb24(value, trueColor);
    if (mode === 8) return background ? bgRgb8(value, color256) : rgb8(value, color256);
    return mode > 0 ? fallback(value) : value;
  };
}

/** Creates a foreground style that degrades with terminal color capability. */
export function defineColor(trueColor: number | Rgb, color256: number, fallback: Style): Style {
  return defineAdaptiveColor(false, trueColor, color256, fallback);
}

/** Creates a background style that degrades with terminal color capability. */
export function defineBgColor(trueColor: number | Rgb, color256: number, fallback: Style): Style {
  return defineAdaptiveColor(true, trueColor, color256, fallback);
}
