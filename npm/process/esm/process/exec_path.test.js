import "../_dnt.test_polyfills.js";
import { ok } from "node:assert/strict";
import { globals } from "../_globals.js";
const exists = (value, message) => ok(value !== null && value !== undefined, message);
import { test } from "node:test";
const NODELIKE = (typeof process !== "undefined" && !!process.versions?.node) || globals.Bun !== undefined;
import { execPath } from "../exec_path.js";
test("process::execPath", () => {
    const p = execPath();
    exists(p);
    if (NODELIKE) {
        ok(p.length > 0);
    }
    else {
        ok(p.length === 0);
    }
});
