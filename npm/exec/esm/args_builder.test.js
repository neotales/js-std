import "./_dnt.test_polyfills.js";
import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { ArgsBuilder } from "./args_builder.js";
test("exec::ArgsBuilder constructs command, flags, options, and post arguments", () => {
    const args = new ArgsBuilder()
        .subcommand("git", "commit")
        .args("README.md")
        .flag("verbose", "q")
        .option("message", "release notes")
        .postArgs("--amend")
        .build();
    deepStrictEqual(args, [
        "git",
        "commit",
        "README.md",
        "--verbose",
        "-q",
        "--message",
        "release notes",
        "--",
        "--amend",
    ]);
});
test("exec::ArgsBuilder applies default prefixes and quotes assigned values with spaces", () => {
    const args = new ArgsBuilder({ appendArgs: true, assign: "=" })
        .subcommand("tool")
        .args("input.txt")
        .option("output", "release notes")
        .option("q", "value")
        .build();
    deepStrictEqual(args, ["tool", '--output="release notes"', "-q=value", "input.txt"]);
});
