import { deepStrictEqual, equal } from "node:assert/strict";
import { test } from "node:test";
import * as fmt from "./mod.ts";

test("fmt::mod exports the public API", () => {
  deepStrictEqual(Object.keys(fmt).sort(), [
    "echo",
    "echof",
    "errorf",
    "inspect",
    "print",
    "printf",
    "setNoColor",
    "sprintf",
    "stripAnsiCode",
  ]);
  equal(typeof fmt.sprintf, "function");
});
