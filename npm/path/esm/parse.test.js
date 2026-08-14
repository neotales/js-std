// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import { deepStrictEqual as equal } from "node:assert/strict";
import * as windows from "./windows/mod.js";
test("path::windows.parse() parses UNC root only path", () => {
    const parsed = windows.parse("\\\\server\\share");
    equal(parsed, {
        base: "\\",
        dir: "\\\\server\\share",
        ext: "",
        name: "",
        root: "\\\\server\\share",
    });
});
