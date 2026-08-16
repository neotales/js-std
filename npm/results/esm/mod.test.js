import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import * as results from "./mod.js";
test("results::mod exports the public API", () => {
    deepStrictEqual(Object.keys(results).sort(), [
        "EmptyResult",
        "Failure",
        "Ok",
        "Result",
        "ResultError",
        "all",
        "allAsync",
        "empty",
        "fail",
        "failAsError",
        "fromNullable",
        "fromPredicate",
        "match",
        "ok",
        "tryCatch",
        "tryCatchAsync",
    ]);
});
