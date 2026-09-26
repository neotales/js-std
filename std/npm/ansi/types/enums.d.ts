/** ANSI color mode and log level helpers. @module */
export type AnsiMode = -1 | 0 | 3 | 4 | 8 | 24;
export type AnsiLogLevel = number;
export interface AnsiModesApi {
    readonly Auto: AnsiMode;
    readonly None: AnsiMode;
    readonly ThreeBit: AnsiMode;
    readonly FourBit: AnsiMode;
    readonly EightBit: AnsiMode;
    readonly TwentyFourBit: AnsiMode;
    equals(a: AnsiMode, b: number | string): boolean;
    names(): string[];
    values(): number[];
    toValue(name: string): number;
    toString(value: number): string;
}
/** Named ANSI mode constants and terminal aliases. */
export declare const AnsiModes: AnsiModesApi;
/** Compares an ANSI mode against another mode, number, or alias. */
export declare function equals(a: AnsiMode, b: number | string): boolean;
export interface AnsiLogLevelsApi {
    readonly None: AnsiLogLevel;
    readonly Critical: AnsiLogLevel;
    readonly Error: AnsiLogLevel;
    readonly Warning: AnsiLogLevel;
    readonly Notice: AnsiLogLevel;
    readonly Information: AnsiLogLevel;
    readonly Debug: AnsiLogLevel;
    readonly Trace: AnsiLogLevel;
    names(): string[];
    values(): number[];
    toValue(name: string): number;
    toString(value: number): string;
}
/** Named syslog-style ANSI log levels and conversion helpers. */
export declare const AnsiLogLevels: AnsiLogLevelsApi;
