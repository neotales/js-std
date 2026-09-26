import { deepStrictEqual as equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { globals } from "./_globals.ts";
import { ppid } from "./ppid.ts";

test("process::ppid is a non-negative integer", () => {
  equal(typeof ppid, "number");
  ok(Number.isInteger(ppid));
  ok(ppid >= 0);
});

test("process::ppid is available in runtime environments", () => {
  if (globals.Deno || globals.process) {
    ok(ppid > 0, `Expected positive ppid but got ${ppid}`);
  } else {
    equal(ppid, 0);
  }
});
