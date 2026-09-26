import { deepStrictEqual as equal } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";
import { normalize as windowsUnstableNormalize } from "./windows/normalize.ts";
import { normalize as posixUnstableNormalize } from "./posix/normalize.ts";

test(`path::normalize() returns "." if input is empty`, function () {
  equal(posix.normalize(""), ".");
  equal(windows.normalize(""), ".");
});

test("path::posix.normalize() normalizes posix specific paths", () => {
  equal(posix.normalize("/foo/bar//baz/asdf/quux/.."), "/foo/bar/baz/asdf");
  equal(posixUnstableNormalize(new URL("file:///foo/bar//baz/asdf/quux/..")), "/foo/bar/baz/asdf/");
});

test("path::windows.normalize() normalizes windows specific paths", () => {
  equal(windows.normalize("//server/share/dir/file.ext"), "\\\\server\\share\\dir\\file.ext");
  equal(windowsUnstableNormalize(new URL("file:///C:/foo/bar/../baz/quux")), "C:\\foo\\baz\\quux");
});
