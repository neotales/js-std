/** Browser-safe ANSI style functions. @module */
export interface Rgb {
    r: number;
    g: number;
    b: number;
}
export type Style = (value: string) => string;
/**
 * Overrides ANSI output for this module. Pass `undefined` to restore automatic
 * enablement based on `AnsiSettings.current.mode`.
 */
export declare function setColorEnabled(value: boolean | undefined): void;
/** Returns whether ANSI output is currently enabled. */
export declare function isColorEnabled(): boolean;
/** Applies styles from left to right. */
export declare function apply(value: string, ...styles: Style[]): string;
export declare const reset: Style;
export declare const bold: Style;
export declare const dim: Style;
export declare const italic: Style;
export declare const underline: Style;
export declare const inverse: Style;
export declare const hidden: Style;
export declare const strikethrough: Style;
export declare const black: Style;
export declare const red: Style;
export declare const green: Style;
export declare const yellow: Style;
export declare const blue: Style;
export declare const magenta: Style;
export declare const cyan: Style;
export declare const white: Style;
export declare const brightBlack: Style;
export declare const brightRed: Style;
export declare const brightGreen: Style;
export declare const brightYellow: Style;
export declare const brightBlue: Style;
export declare const brightMagenta: Style;
export declare const brightCyan: Style;
export declare const brightWhite: Style;
export declare const gray: Style;
export declare const bgBlack: Style;
export declare const bgRed: Style;
export declare const bgGreen: Style;
export declare const bgYellow: Style;
export declare const bgBlue: Style;
export declare const bgMagenta: Style;
export declare const bgCyan: Style;
export declare const bgWhite: Style;
export declare const bgBrightBlack: Style;
export declare const bgBrightRed: Style;
export declare const bgBrightGreen: Style;
export declare const bgBrightYellow: Style;
export declare const bgBrightBlue: Style;
export declare const bgBrightMagenta: Style;
export declare const bgBrightCyan: Style;
export declare const bgBrightWhite: Style;
export declare function rgb8(value: string, color: number): string;
export declare function bgRgb8(value: string, color: number): string;
export declare function rgb24(value: string, color: number | Rgb): string;
export declare function bgRgb24(value: string, color: number | Rgb): string;
export declare function rgb24To8(value: string, color: number | Rgb): string;
/** Removes ANSI escape sequences from a string. */
export declare function stripAnsiCode(value: string): string;
/**
 * Wraps text in an OSC-8 terminal hyperlink when hyperlinks and colors are
 * enabled. The URL is stripped of terminal control characters.
 */
export declare function link(value: string, url: string): string;
/** Creates a foreground style that degrades with terminal color capability. */
export declare function defineColor(trueColor: number | Rgb, color256: number, fallback: Style): Style;
/** Creates a background style that degrades with terminal color capability. */
export declare function defineBgColor(trueColor: number | Rgb, color256: number, fallback: Style): Style;
