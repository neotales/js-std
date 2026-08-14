import { deepStrictEqual as equal } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import * as windows from "./windows/mod.ts";
import * as posix from "./posix/mod.ts";

test("path::windows.joinGlobs() joins the glob patterns", function () {
  equal(windows.joinGlobs(["foo", "*", "bar"]), `foo\\*\\bar`);
  equal(windows.joinGlobs([""], { globstar: true }), ".");
  equal(windows.joinGlobs(["**", ".."], { globstar: true }), `**\\..`);
});

test("path::windows.joinGlobs() joins the glob patterns", function () {
  equal(posix.joinGlobs(["foo", "*", "bar"]), `foo/*/bar`);
  equal(posix.joinGlobs([""], { globstar: true }), ".");
  equal(posix.joinGlobs(["**", ".."], { globstar: true }), `**/..`);
});
