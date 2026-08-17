import "./_dnt.test_polyfills.js";
import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { withTestRootSync } from "./_test_helpers.js";
import { cwd } from "./cwd.js";
test("cwd returns the runtime working directory", () => {
    withTestRootSync(() => {
        strictEqual(cwd(), process.cwd());
    });
});
