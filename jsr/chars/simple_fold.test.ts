import { test } from "node:test";
import { deepStrictEqual as equal, ok } from "node:assert/strict";
import { equalFold, simpleFold } from "./simple_fold.ts";

test("chars::simpleFold", () => {
  equal(simpleFold(0x0041), 0x0061);
  equal(simpleFold(0x0061), 0x0041);
  equal(simpleFold(0x00b5), 0x039c);
  equal(simpleFold(0x039c), 0x03bc);
  equal(simpleFold(0x03bc), 0x00b5);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
  equal(simpleFold(0x1f600), 0x1f600);
});

test("chars::equalFold", () => {
  ok(equalFold(0x0041, 0x0061));
  ok(equalFold(0x0061, 0x0041));
  ok(equalFold(0x00b5, 0x039c));
  ok(equalFold(0x039c, 0x03bc));
  ok(equalFold(0x03bc, 0x00b5));
});
