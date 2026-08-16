import { equal } from "node:assert/strict";
import { test } from "node:test";
import { detectMode } from "./detector.js";
import { AnsiModes } from "./enums.js";
test("ansi::detectMode respects explicit color flags", () => {
    equal(detectMode({ args: ["--no-color"] }), AnsiModes.None);
    equal(detectMode({ args: ["--color"] }), AnsiModes.FourBit);
    equal(detectMode({ args: ["--color=16"] }), AnsiModes.FourBit);
    equal(detectMode({ args: ["--color", "256"] }), AnsiModes.EightBit);
    equal(detectMode({ args: ["--color=truecolor"] }), AnsiModes.TwentyFourBit);
});
test("ansi::detectMode supports force color levels and terminal variables", () => {
    equal(detectMode({ env: { FORCE_COLOR: "0" } }), AnsiModes.None);
    equal(detectMode({ env: { FORCE_COLOR: "1" } }), AnsiModes.FourBit);
    equal(detectMode({ env: { FORCE_COLOR: "2" } }), AnsiModes.EightBit);
    equal(detectMode({ env: { FORCE_COLOR: "3" } }), AnsiModes.TwentyFourBit);
    equal(detectMode({ env: { TERM: "xterm-256color" } }), AnsiModes.EightBit);
    equal(detectMode({ env: { COLORTERM: "truecolor" } }), AnsiModes.TwentyFourBit);
    equal(detectMode({ env: { CI: "true" } }), AnsiModes.FourBit);
});
test("ansi::detectMode defaults browser-like environments to plain output", () => {
    equal(detectMode({ env: {}, windows: false }), AnsiModes.None);
    equal(detectMode({ env: {}, windows: true }), AnsiModes.FourBit);
});
