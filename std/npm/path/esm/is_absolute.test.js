import { deepStrictEqual as equal } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
// Copyright the Browserify authors. MIT License.
// Ported from https://github.com/browserify/path-browserify/
import { test } from "node:test";
import * as posix from "./posix/mod.js";
import * as windows from "./windows/mod.js";
import { isAbsolute } from "./is_absolute.js";
test("path::posix.isAbsolute()", function () {
    equal(posix.isAbsolute("/home/foo"), true);
    equal(posix.isAbsolute("/home/foo/.."), true);
    equal(posix.isAbsolute("bar/"), false);
    equal(posix.isAbsolute("./baz"), false);
});
test("path::windows.isAbsolute()", function () {
    equal(windows.isAbsolute(""), false);
    equal(windows.isAbsolute("/"), true);
    equal(windows.isAbsolute("//"), true);
    equal(windows.isAbsolute("//server"), true);
    equal(windows.isAbsolute("//server/file"), true);
    equal(windows.isAbsolute("\\\\server\\file"), true);
    equal(windows.isAbsolute("\\\\server"), true);
    equal(windows.isAbsolute("\\\\"), true);
    equal(windows.isAbsolute("c"), false);
    equal(windows.isAbsolute("c:"), false);
    equal(windows.isAbsolute("c:\\"), true);
    equal(windows.isAbsolute("c:/"), true);
    equal(windows.isAbsolute("c://"), true);
    equal(windows.isAbsolute("C:/Users/"), true);
    equal(windows.isAbsolute("C:\\Users\\"), true);
    equal(windows.isAbsolute("C:cwd/another"), false);
    equal(windows.isAbsolute("C:cwd\\another"), false);
    equal(windows.isAbsolute("directory/directory"), false);
    equal(windows.isAbsolute("directory\\directory"), false);
});
test("path::isAbsolute() returns false if input is empty", function () {
    equal(isAbsolute(""), false);
});
