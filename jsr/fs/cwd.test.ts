import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { withTestRootSync } from "./_test_helpers.ts";
import { cwd } from "./cwd.ts";

test("cwd returns the runtime working directory", () => {
  withTestRootSync(() => {
    strictEqual(cwd(), process.cwd());
  });
});
