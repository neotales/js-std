import { ok } from "node:assert/strict";
import { globals } from "./_globals.ts";

const exists = (value: unknown, message?: string) =>
  ok(value !== null && value !== undefined, message);
import { test } from "node:test";
const NODELIKE = (typeof process !== "undefined" && !!process.versions?.node) ||
  globals.Bun !== undefined;
import { execPath } from "./exec_path.ts";

test("process::execPath", () => {
  const p = execPath();
  exists(p);
  if (NODELIKE) {
    ok(p.length > 0);
  } else {
    ok(p.length === 0);
  }
});
