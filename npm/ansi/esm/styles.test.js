import { deepStrictEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import { AnsiModes } from "./enums.js";
import { AnsiSettings } from "./settings.js";
import { apply, bgBlue, bgRgb24, bgRgb8, blue, bold, defineBgColor, defineColor, isColorEnabled, link, red, rgb24, rgb24To8, rgb8, setColorEnabled, stripAnsiCode, } from "./styles.js";
function withColors(callback) {
    const previous = isColorEnabled();
    setColorEnabled(true);
    try {
        callback();
    }
    finally {
        setColorEnabled(previous);
    }
}
test("ansi::styles apply and preserve nested closes", () => {
    withColors(() => {
        equal(red("Hel\x1b[39mlo"), "\x1b[31mHel\x1b[31mlo\x1b[39m");
        equal(apply("test", bold, red, bgBlue), "\x1b[44m\x1b[31m\x1b[1mtest\x1b[22m\x1b[39m\x1b[49m");
        equal(stripAnsiCode(bgBlue(red("test"))), "test");
    });
});
test("ansi::styles disable output", () => {
    const previous = isColorEnabled();
    setColorEnabled(false);
    try {
        equal(red("test"), "test");
        equal(rgb8("test", 42), "test");
    }
    finally {
        setColorEnabled(previous);
    }
});
test("ansi::rgb styles clamp and convert colors", () => {
    withColors(() => {
        equal(rgb8("x", 999), "\x1b[38;5;255mx\x1b[39m");
        equal(bgRgb8("x", -10), "\x1b[48;5;0mx\x1b[49m");
        equal(rgb24("x", { r: 256, g: -1, b: 12.9 }), "\x1b[38;2;255;0;12mx\x1b[39m");
        equal(bgRgb24("x", 0x123456), "\x1b[48;2;18;52;86mx\x1b[49m");
        equal(rgb24To8("x", 0xff0000), "\x1b[38;5;196mx\x1b[39m");
        equal(rgb24("x", { r: Number.NaN, g: Number.POSITIVE_INFINITY, b: Number.NEGATIVE_INFINITY }), "\x1b[38;2;0;0;0mx\x1b[39m");
    });
});
test("ansi::links follow settings and strip OSC-8 sequences", () => {
    const previousSettings = AnsiSettings.current;
    const settings = new AnsiSettings(AnsiModes.TwentyFourBit);
    const previousEnabled = isColorEnabled();
    AnsiSettings.current = settings;
    setColorEnabled(true);
    try {
        equal(link("docs", "https://example.com/\x1b[31m"), "\x1b]8;;https://example.com/[31m\x1b\\docs\x1b]8;;\x1b\\");
        equal(stripAnsiCode(link("docs", "https://example.com")), "docs");
        settings.links = false;
        equal(link("docs", "https://example.com"), "docs");
    }
    finally {
        AnsiSettings.current = previousSettings;
        setColorEnabled(previousEnabled);
    }
});
test("ansi::adaptive styles follow configured mode", () => {
    const previousSettings = AnsiSettings.current;
    const previousEnabled = isColorEnabled();
    const settings = new AnsiSettings(AnsiModes.TwentyFourBit);
    const foreground = defineColor(0x123456, 33, blue);
    const background = defineBgColor(0x123456, 33, bgBlue);
    setColorEnabled(true);
    AnsiSettings.current = settings;
    try {
        equal(foreground("x"), "\x1b[38;2;18;52;86mx\x1b[39m");
        equal(background("x"), "\x1b[48;2;18;52;86mx\x1b[49m");
        settings.mode = AnsiModes.EightBit;
        equal(foreground("x"), "\x1b[38;5;33mx\x1b[39m");
        settings.mode = AnsiModes.None;
        equal(foreground("x"), "x");
    }
    finally {
        AnsiSettings.current = previousSettings;
        setColorEnabled(previousEnabled);
    }
});
test("ansi::settings and public module exports work", async () => {
    const ansi = await import("./mod.js");
    const settings = new AnsiSettings(AnsiModes.EightBit);
    settings.links = true;
    deepStrictEqual([typeof ansi.detectMode, settings.mode, settings.links], ["function", 8, true]);
});
