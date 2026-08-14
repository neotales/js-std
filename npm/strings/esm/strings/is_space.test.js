import { ok } from "node:assert/strict";
const nope = (value, message) => ok(!value, message);
import { test } from "node:test";
import { isNullOrSpace, isSpace } from "./is_space.js";
test("strings::isSpace returns true for whitespace only string", () => {
    ok(isSpace(" "));
    ok(isSpace("\t"));
    ok(isSpace("\n"));
    ok(isSpace("\r"));
    ok(isSpace("    "));
    ok(isSpace(" \t\n\r"));
});
test("strings::isSpace returns false for non-whitespace string", () => {
    nope(isSpace("a"));
    nope(isSpace(" a "));
    nope(isSpace("abc"));
    nope(isSpace(" abc "));
});
test("strings::isNullOrSpace returns true for null/undefined/empty/whitespace", () => {
    ok(isNullOrSpace(null));
    ok(isNullOrSpace(undefined));
    ok(isNullOrSpace(""));
    ok(isNullOrSpace(" "));
    ok(isNullOrSpace("\t"));
    ok(isNullOrSpace("\n"));
    ok(isNullOrSpace("\r"));
    ok(isNullOrSpace("    "));
    ok(isNullOrSpace(" \t\n\r"));
});
test("strings::isNullOrSpace returns false for non-whitespace string", () => {
    nope(isNullOrSpace("a"));
    nope(isNullOrSpace(" a "));
    nope(isNullOrSpace("abc"));
    nope(isNullOrSpace(" abc "));
});
