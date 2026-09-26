import { deepStrictEqual as equal, ok } from "node:assert/strict";
const nope = (value, message) => ok(!value, message);
import { test } from "node:test";
import { stripAnsiCode } from "./strip_ansi_code.js";
// =============================================================================
// Basic functionality tests
// =============================================================================
test("fmt::stripAnsiCode removes color codes", () => {
    // Red text: \x1b[31mtext\x1b[0m
    const colored = "\x1b[31mHello\x1b[0m";
    const result = stripAnsiCode(colored);
    equal(result, "Hello");
});
test("fmt::stripAnsiCode removes bold codes", () => {
    // Bold: \x1b[1mtext\x1b[0m
    const bold = "\x1b[1mBold Text\x1b[0m";
    const result = stripAnsiCode(bold);
    equal(result, "Bold Text");
});
test("fmt::stripAnsiCode removes multiple codes", () => {
    const mixed = "\x1b[31mRed\x1b[0m and \x1b[32mGreen\x1b[0m";
    const result = stripAnsiCode(mixed);
    equal(result, "Red and Green");
});
test("fmt::stripAnsiCode handles nested styles", () => {
    // Bold + Red: \x1b[1;31mtext\x1b[0m
    const nested = "\x1b[1;31mBold Red\x1b[0m";
    const result = stripAnsiCode(nested);
    equal(result, "Bold Red");
});
// =============================================================================
// Passthrough tests
// =============================================================================
test("fmt::stripAnsiCode returns plain text unchanged", () => {
    const plain = "Hello, World!";
    const result = stripAnsiCode(plain);
    equal(result, plain);
});
test("fmt::stripAnsiCode handles empty string", () => {
    equal(stripAnsiCode(""), "");
});
test("fmt::stripAnsiCode handles string with only ANSI codes", () => {
    const onlyCodes = "\x1b[31m\x1b[0m";
    const result = stripAnsiCode(onlyCodes);
    equal(result, "");
});
// =============================================================================
// Edge cases
// =============================================================================
test("fmt::stripAnsiCode handles unicode text", () => {
    const unicode = "\x1b[34m日本語\x1b[0m";
    const result = stripAnsiCode(unicode);
    equal(result, "日本語");
});
test("fmt::stripAnsiCode handles emoji", () => {
    const emoji = "\x1b[33m🎉 Party!\x1b[0m";
    const result = stripAnsiCode(emoji);
    equal(result, "🎉 Party!");
});
test("fmt::stripAnsiCode handles cursor movement codes", () => {
    // Cursor up: \x1b[1A
    const cursor = "\x1b[2ALine after cursor up";
    const result = stripAnsiCode(cursor);
    equal(result, "Line after cursor up");
});
test("fmt::stripAnsiCode handles clear screen codes", () => {
    // Clear screen: \x1b[2J
    const clear = "\x1b[2JAfter clear";
    const result = stripAnsiCode(clear);
    equal(result, "After clear");
});
test("fmt::stripAnsiCode handles 256-color codes", () => {
    // 256-color: \x1b[38;5;196mtext\x1b[0m
    const color256 = "\x1b[38;5;196mRed 256\x1b[0m";
    const result = stripAnsiCode(color256);
    equal(result, "Red 256");
});
test("fmt::stripAnsiCode handles RGB/truecolor codes", () => {
    // RGB: \x1b[38;2;255;0;0mtext\x1b[0m
    const rgb = "\x1b[38;2;255;0;0mRGB Red\x1b[0m";
    const result = stripAnsiCode(rgb);
    equal(result, "RGB Red");
});
test("fmt::stripAnsiCode handles multiline text", () => {
    const multiline = "\x1b[31mLine 1\x1b[0m\n\x1b[32mLine 2\x1b[0m\n\x1b[34mLine 3\x1b[0m";
    const result = stripAnsiCode(multiline);
    equal(result, "Line 1\nLine 2\nLine 3");
});
test("fmt::stripAnsiCode preserves newlines and tabs", () => {
    const whitespace = "\x1b[31m\tTabbed\n\tContent\x1b[0m";
    const result = stripAnsiCode(whitespace);
    equal(result, "\tTabbed\n\tContent");
});
// =============================================================================
// Real-world scenarios
// =============================================================================
test("fmt::stripAnsiCode handles terminal output", () => {
    const termOutput = "\x1b[1m\x1b[32m✓\x1b[0m Test passed\n\x1b[1m\x1b[31m✗\x1b[0m Test failed";
    const result = stripAnsiCode(termOutput);
    equal(result, "✓ Test passed\n✗ Test failed");
});
test("fmt::stripAnsiCode handles log output", () => {
    const log = "\x1b[90m[2024-01-15]\x1b[0m \x1b[33mWARN\x1b[0m: Something happened";
    const result = stripAnsiCode(log);
    equal(result, "[2024-01-15] WARN: Something happened");
});
test("fmt::stripAnsiCode result has no escape sequences", () => {
    const colored = "\x1b[31;1;4mStyled\x1b[0m";
    const result = stripAnsiCode(colored);
    nope(result.includes("\x1b"));
    nope(result.includes("\u001b"));
});
