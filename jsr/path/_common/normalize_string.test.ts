import { deepStrictEqual as equal } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.

import { test } from "node:test";
import { CHAR_FORWARD_SLASH } from "@neotales/chars/constants";
import { normalizeString } from "./normalize_string.ts";

function isSeparator(code: number): boolean {
  return code === CHAR_FORWARD_SLASH;
}

test("path::normalizeSring()", () => {
  equal(normalizeString("", true, "/", isSeparator), "");
  equal(normalizeString("", false, "/", isSeparator), "");
  equal(normalizeString("a/../b", true, "/", isSeparator), "b");
  equal(normalizeString("foo/bar/", true, "/", isSeparator), "foo/bar");
  equal(normalizeString("/foo/bar", true, "/", isSeparator), "foo/bar");
  equal(normalizeString("./foo/bar", true, "/", isSeparator), "foo/bar");
  equal(normalizeString("../foo/bar/baz/", true, "/", isSeparator), "../foo/bar/baz");
  equal(normalizeString("/foo/../../bar", true, "/", isSeparator), "../bar");
});
