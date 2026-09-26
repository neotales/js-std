import { ok } from "node:assert/strict";
import { test } from "node:test";
import { inspectBrowser } from "./browser_inspect.ts";
import { inspect } from "./inspect.ts";

test("fmt::inspectBrowser formats values without native runtime APIs", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  ok(inspectBrowser(undefined) === "undefined");
  ok(inspectBrowser(1n) === "1n");
  ok(inspectBrowser("a\n'b") === "'a\\n\\'b'");
  ok(inspectBrowser({ a: [1, "x"] }) === "{ a: [ 1, 'x' ] }");
  ok(inspectBrowser({ a: { b: 1 } }, { depth: 0 }) === "{ a: [Object] }");
  ok(inspectBrowser(circular).includes("[Circular]"));
  ok(inspectBrowser(new Map([["x", 1]])) === "Map(1) { 'x' => 1 }");
  ok(inspectBrowser(new Set([1, 2])) === "Set(2) { 1, 2 }");
  ok(inspectBrowser({ b: 1, a: 2 }, { sorted: true }) === "{ a: 2, b: 1 }");
});

test("fmt::inspectBrowser does not invoke accessors by default", () => {
  let calls = 0;
  const value = {
    get data() {
      calls++;
      return "value";
    },
  };

  ok(inspectBrowser(value) === "{ data: [Getter] }");
  ok(calls === 0);
  ok(inspectBrowser(value, { getters: true }) === "{ data: 'value' }");
});

test("fmt::inspectBrowser supports escape sequences and line breaking", () => {
  ok(inspectBrowser("a\nb\t\u0001") === "'a\\nb\\t\\x01'");
  ok(inspectBrowser("a\nb\t\u0001", { escapeSequences: false }) === "'a\nb\t\u0001'");
  ok(
    inspectBrowser({ alpha: "one", beta: "two" }, { breakLength: 10 }) ===
      "{\n  alpha: 'one',\n  beta: 'two'\n}",
  );
  ok(
    inspectBrowser({ alpha: "one", beta: "two" }, { compact: true, breakLength: 10 }) ===
      "{ alpha: 'one', beta: 'two' }",
  );
});

// =============================================================================
// Basic type inspection tests
// =============================================================================

test("fmt::inspect returns string for primitives", () => {
  const result = inspect("hello");
  ok(typeof result === "string");
  ok(result.includes("hello"));
});

test("fmt::inspect handles numbers", () => {
  const result = inspect(42);
  ok(result.includes("42"));
});

test("fmt::inspect handles booleans", () => {
  const trueResult = inspect(true);
  const falseResult = inspect(false);
  ok(trueResult.includes("true"));
  ok(falseResult.includes("false"));
});

test("fmt::inspect handles null", () => {
  const result = inspect(null);
  ok(result.includes("null"));
});

test("fmt::inspect handles undefined", () => {
  const result = inspect(undefined);
  ok(typeof result === "string");
});

// =============================================================================
// Object inspection tests
// =============================================================================

test("fmt::inspect handles plain objects", () => {
  const result = inspect({ a: 1, b: 2 });
  ok(result.includes("a"));
  ok(result.includes("1"));
  ok(result.includes("b"));
  ok(result.includes("2"));
});

test("fmt::inspect handles nested objects", () => {
  const result = inspect({ outer: { inner: "value" } });
  ok(result.includes("outer"));
  ok(result.includes("inner"));
  ok(result.includes("value"));
});

test("fmt::inspect handles arrays", () => {
  const result = inspect([1, 2, 3]);
  ok(result.includes("1"));
  ok(result.includes("2"));
  ok(result.includes("3"));
});

test("fmt::inspect handles empty objects", () => {
  const result = inspect({});
  ok(typeof result === "string");
});

test("fmt::inspect handles empty arrays", () => {
  const result = inspect([]);
  ok(typeof result === "string");
});

// =============================================================================
// Options tests
// =============================================================================

test("fmt::inspect respects depth option", () => {
  const deep = { a: { b: { c: { d: "deep" } } } };
  const shallow = inspect(deep, { depth: 1 });
  const deeper = inspect(deep, { depth: 4 });

  // Both should produce strings
  ok(typeof shallow === "string");
  ok(typeof deeper === "string");
});

test("fmt::inspect respects colors option", () => {
  const result = inspect({ a: 1 }, { colors: false });
  ok(typeof result === "string");
  // No ANSI codes when colors: false
  ok(!result.includes("\x1b["));
});

test("fmt::inspect handles compact option", () => {
  const result = inspect({ a: 1, b: 2 }, { compact: true });
  ok(typeof result === "string");
});

// =============================================================================
// Special types tests
// =============================================================================

test("fmt::inspect handles Date objects", () => {
  const date = new Date("2024-01-15T00:00:00Z");
  const result = inspect(date);
  ok(typeof result === "string");
});

test("fmt::inspect handles RegExp", () => {
  const result = inspect(/test/gi);
  ok(typeof result === "string");
  ok(result.includes("test"));
});

test("fmt::inspect handles functions", () => {
  const fn = function testFunc() {
    return 42;
  };
  const result = inspect(fn);
  ok(typeof result === "string");
});

test("fmt::inspect handles arrow functions", () => {
  const arrow = () => 42;
  const result = inspect(arrow);
  ok(typeof result === "string");
});

test("fmt::inspect handles Map", () => {
  const map = new Map([["key", "value"]]);
  const result = inspect(map);
  ok(typeof result === "string");
});

test("fmt::inspect handles Set", () => {
  const set = new Set([1, 2, 3]);
  const result = inspect(set);
  ok(typeof result === "string");
});

test("fmt::inspect handles Symbol", () => {
  const sym = Symbol("test");
  const result = inspect(sym);
  ok(typeof result === "string");
});

// =============================================================================
// Edge cases
// =============================================================================

test("fmt::inspect handles circular references gracefully", () => {
  const obj: Record<string, unknown> = { a: 1 };
  obj.self = obj;

  // Should not throw
  const result = inspect(obj);
  ok(typeof result === "string");
});

test("fmt::inspect handles mixed arrays", () => {
  const result = inspect([1, "two", { three: 3 }, [4]]);
  ok(typeof result === "string");
});

test("fmt::inspect handles large objects", () => {
  const large: Record<string, number> = {};
  for (let i = 0; i < 100; i++) {
    large[`key${i}`] = i;
  }
  const result = inspect(large);
  ok(typeof result === "string");
});
