import "./_dnt.test_polyfills.js";
import { ok } from "node:assert/strict";
import { test } from "node:test";
import { isWindows, withTestRootSync } from "./_test_helpers.js";
import { uid } from "./uid.js";
test("uid returns the current POSIX user id", { skip: isWindows }, () => {
    withTestRootSync(() => {
        const value = uid();
        ok(Number.isInteger(value));
        ok(value !== null && value >= 0);
    });
});
