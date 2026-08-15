import { deepStrictEqual as equal } from "node:assert/strict";
import { test } from "node:test";
import * as env from "./mod.js";
import * as expandModule from "./expand.js";
import * as exportModule from "./export.js";
test("env::mod exports the public API", () => {
    equal(Object.keys(env).sort(), [
        "appendPath",
        "expand",
        "get",
        "getPath",
        "has",
        "hasPath",
        "home",
        "hostname",
        "joinPath",
        "merge",
        "os",
        "path",
        "prependPath",
        "proxy",
        "remove",
        "removePath",
        "replacePath",
        "set",
        "setPath",
        "shell",
        "splitPath",
        "toObject",
        "union",
        "user",
    ]);
    equal(Object.keys(expandModule).sort(), ["UnpermittedCommandError", "expand", "expandAsync"]);
    equal(Object.keys(exportModule), ["env"]);
});
