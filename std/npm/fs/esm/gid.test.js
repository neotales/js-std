import "./_dnt.test_polyfills.js";
import { ok } from "node:assert/strict";
import { test } from "node:test";
import { gid } from "./gid.js";
import { isWindows, withTestRootSync } from "./_test_helpers.js";
test("gid returns the current POSIX group id", { skip: isWindows }, () => {
    withTestRootSync(() => {
        const value = gid();
        ok(Number.isInteger(value));
        ok(value !== null && value >= 0);
    });
});
