import { deepStrictEqual as equal } from "node:assert/strict";
import { test } from "node:test";
import * as dotenv from "./mod.ts";

test("dotenv::mod exports the public API", () => {
  equal(Object.keys(dotenv).sort(), [
    "DotEnvDocument",
    "expand",
    "load",
    "parse",
    "parseDocument",
    "stringify",
    "stringifyDocument",
  ]);
});
