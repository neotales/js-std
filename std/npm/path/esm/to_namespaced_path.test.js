import { deepStrictEqual as equal } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import * as posix from "./posix/mod.js";
import * as windows from "./windows/mod.js";
test("path::windows.toNamespacedPath() returns the namespaced path", () => {
    {
        const path = "C:\\path\\to\\file.txt";
        const namespacedPath = windows.toNamespacedPath(path);
        equal(namespacedPath, "\\\\?\\C:\\path\\to\\file.txt");
    }
    // The path starts with double backslashs
    {
        const path = "\\\\path\\to\\file.txt";
        const namespacedPath = windows.toNamespacedPath(path);
        equal(namespacedPath, "\\\\?\\UNC\\path\\to\\file.txt");
    }
    // When the input is empty string
    {
        const path = "";
        const namespacedPath = windows.toNamespacedPath(path);
        equal(namespacedPath, "");
    }
});
test("path::posix.toNamespacedPath() return the input as is", () => {
    const path = "/path/to/file.txt";
    const namespacedPath = posix.toNamespacedPath(path);
    equal(namespacedPath, "/path/to/file.txt");
});
