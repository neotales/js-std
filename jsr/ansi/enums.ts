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

const modeAliases: Record<string, AnsiMode> = {
  "0": 0,
  "3": 3,
  "4": 4,
  "8": 8,
  "24": 24,
  "16color": 4,
  "256": 8,
  "256color": 8,
  "3bit": 3,
  "4bit": 4,
  "8bit": 8,
  "24bit": 24,
  ansi: 4,
  auto: -1,
  cygwin: 4,
  false: 0,
  full: 24,
  kitty: 24,
  linux: 4,
  no: 0,
  "no-color": 0,
  nocolor: 0,
  none: 0,
  off: 0,
  screen: 4,
  "screen-256color": 8,
  true: 24,
  "true-color": 24,
  truecolor: 24,
  vt100: 4,
  vt200: 4,
  wezterm: 24,
  "windows-terminal": 24,
  "xterm-16color": 4,
  "xterm-256color": 8,
  "xterm-truecolor": 24,
};

/** Named ANSI mode constants and terminal aliases. */
export const AnsiModes: AnsiModesApi = {
  Auto: -1,
  None: 0,
  ThreeBit: 3,
  FourBit: 4,
  EightBit: 8,
  TwentyFourBit: 24,
  equals(a: AnsiMode, b: number | string): boolean {
    return a === (typeof b === "string" ? this.toValue(b) : b);
  },
  names(): string[] {
    return ["auto", "none", "3bit", "xterm-16color", "xterm-256color", "truecolor"];
  },
  values(): number[] {
    return [-1, 0, 3, 4, 8, 24];
  },
  toValue(name: string): number {
    return modeAliases[name.toLowerCase()] ?? -1;
  },
  toString(value: number): string {
    return (
      (
        {
          [-1]: "auto",
          0: "none",
          3: "3bit",
          4: "xterm-16color",
          8: "xterm-256color",
          24: "truecolor",
        } as Record<number, string>
      )[value] ?? "auto"
    );
  },
};

/** Compares an ANSI mode against another mode, number, or alias. */
export function equals(a: AnsiMode, b: number | string): boolean {
  return AnsiModes.equals(a, b);
}

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

const logAliases: Record<string, number> = {
  none: 0,
  critical: 2,
  fatal: 2,
  error: 3,
  warning: 4,
  warn: 4,
  notice: 5,
  information: 6,
  info: 6,
  debug: 7,
  trace: 8,
};

/** Named syslog-style ANSI log levels and conversion helpers. */
export const AnsiLogLevels: AnsiLogLevelsApi = {
  None: 0,
  Critical: 2,
  Error: 3,
  Warning: 4,
  Notice: 5,
  Information: 6,
  Debug: 7,
  Trace: 8,
  names(): string[] {
    return ["none", "critical", "error", "warning", "notice", "information", "debug", "trace"];
  },
  values(): number[] {
    return [0, 2, 3, 4, 5, 6, 7, 8];
  },
  toValue(name: string): number {
    return logAliases[name.toLowerCase()] ?? 4;
  },
  toString(value: number): string {
    return (
      (
        {
          0: "none",
          2: "critical",
          3: "error",
          4: "warning",
          5: "notice",
          6: "information",
          7: "debug",
          8: "trace",
        } as Record<number, string>
      )[value] ?? ""
    );
  },
};
