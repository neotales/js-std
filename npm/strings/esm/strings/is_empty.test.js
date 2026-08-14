import { ok } from "node:assert/strict";
const nope = (value, message) => ok(!value, message);
import { test } from "node:test";
import { isEmpty, isNullOrEmpty } from "./is_empty.js";
test("strings::isEmpty returns true for empty string", () => {
    ok(isEmpty(""));
});
test("strings::isEmpty returns false for non-empty string", () => {
    nope(isEmpty("test"));
});
test("strings::isNullOrEmpty returns true for null", () => {
    ok(isNullOrEmpty(null));
});
test("strings::isNullOrEmpty returns true for undefined", () => {
    ok(isNullOrEmpty(undefined));
});
test("strings::isNullOrEmpty returns true for empty string", () => {
    ok(isNullOrEmpty(""));
});
test("strings::isNullOrEmpty returns false for non-empty string", () => {
    nope(isNullOrEmpty("test"));
});
