import { deepStrictEqual as equal } from "node:assert/strict";
import { test } from "node:test";
import * as args from "./mod.js";
test("args::mod exports the public API", () => {
    equal(Object.keys(args).sort(), [
        "SplatSymbols",
        "join",
        "parse",
        "splat",
        "split",
        "unixJoin",
        "windowsJoin",
    ]);
});
