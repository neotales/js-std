import { ok } from "node:assert/strict";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "node:test";
import { isEmpty, isNullOrEmpty } from "./is_empty.ts";

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
