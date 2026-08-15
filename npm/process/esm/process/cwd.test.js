import "../_dnt.test_polyfills.js";
import { deepStrictEqual as equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { cwd } from "../cwd.js";
import { chdir } from "../chdir.js";
import { dirname } from "../path/mod.js";
// =============================================================================
// Basic functionality tests
// =============================================================================
test("process::cwd returns a string", () => {
    const dir = cwd();
    equal(typeof dir, "string");
});
test("process::cwd returns non-empty string", () => {
    const dir = cwd();
    ok(dir.length > 0);
});
test("process::cwd returns absolute path", () => {
    const dir = cwd();
    // Absolute paths start with / on Unix or drive letter on Windows
    const isAbsolute = dir.startsWith("/") || /^[A-Za-z]:[\\/]/.test(dir);
    ok(isAbsolute, `Expected absolute path but got: ${dir}`);
});
test("process::cwd is consistent on repeated calls", () => {
    const dir1 = cwd();
    const dir2 = cwd();
    equal(dir1, dir2);
});
// =============================================================================
// Integration with chdir
// =============================================================================
test("process::cwd reflects chdir changes", () => {
    const original = cwd();
    const parent = dirname(original);
    chdir(parent);
    equal(cwd(), parent);
    // Restore
    chdir(original);
    equal(cwd(), original);
});
test("process::cwd handles relative path changes", () => {
    const original = cwd();
    chdir("..");
    const parent = cwd();
    ok(parent !== original || original === "/");
    // Restore
    chdir(original);
});
test("process::cwd handles current directory reference", () => {
    const original = cwd();
    chdir(".");
    equal(cwd(), original);
});
