import { deepStrictEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import { AnsiLogLevels, AnsiModes, equals } from "./enums.ts";

test("ansi::AnsiModes converts aliases and values", () => {
  deepStrictEqual(AnsiModes.names(), [
    "auto",
    "none",
    "3bit",
    "xterm-16color",
    "xterm-256color",
    "truecolor",
  ]);
  deepStrictEqual(AnsiModes.values(), [-1, 0, 3, 4, 8, 24]);
  equal(AnsiModes.toValue("truecolor"), AnsiModes.TwentyFourBit);
  equal(AnsiModes.toValue("xterm-256color"), AnsiModes.EightBit);
  equal(AnsiModes.toValue("NO-COLOR"), AnsiModes.None);
  equal(AnsiModes.toString(AnsiModes.FourBit), "xterm-16color");
  equal(equals(AnsiModes.TwentyFourBit, "truecolor"), true);
});

test("ansi::AnsiLogLevels converts aliases and values", () => {
  deepStrictEqual(AnsiLogLevels.values(), [0, 2, 3, 4, 5, 6, 7, 8]);
  equal(AnsiLogLevels.toValue("fatal"), AnsiLogLevels.Critical);
  equal(AnsiLogLevels.toValue("warn"), AnsiLogLevels.Warning);
  equal(AnsiLogLevels.toString(AnsiLogLevels.Information), "information");
  equal(AnsiLogLevels.toValue("unknown"), AnsiLogLevels.Warning);
});
