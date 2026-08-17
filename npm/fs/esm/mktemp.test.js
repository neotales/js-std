import "./_dnt.test_polyfills.js";
import { ok, rejects, throws } from "node:assert/strict";
import { test } from "node:test";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { isfile, isfileSync } from "./isfile.js";
import { mktemp, mktempSync } from "./mktemp.js";
import { rm, rmSync } from "./rm.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
test("mktemp creates a uniquely named file in a generated root", async () => {
    await withTestRoot(async (root) => {
        const file = await mktemp({ dir: root, prefix: "file-", suffix: ".tmp" });
        ok(file.endsWith(".tmp"));
        ok(await isfile(file));
    });
});
test("mktempSync creates a uniquely named file in a generated root", () => {
    withTestRootSync((root) => {
        const file = mktempSync({ dir: root, prefix: "file-", suffix: ".tmp" });
        ok(file.endsWith(".tmp"));
        ok(isfileSync(file));
    });
});
test("mktemp creates distinct generated files and rejects missing parents", async () => {
    await withTestRoot(async (root) => {
        const first = await mktemp({ dir: root, prefix: "temp-" });
        const second = await mktemp({ dir: root, prefix: "temp-" });
        ok(first !== second);
        await rejects(mktemp({ dir: `${root}/missing` }));
    });
});
test("mktempSync rejects missing parents", () => {
    withTestRootSync((root) => throws(() => mktempSync({ dir: `${root}/missing` })));
});
test("mktemp uses the default temporary directory with generated prefix and suffix", async () => {
    let file;
    try {
        file = await mktemp({ prefix: "prefix-", suffix: ".suffix" });
        ok(dirname(file) === tmpdir());
        ok(file.split(/[/\\]/).at(-1).startsWith("prefix-"));
        ok(file.endsWith(".suffix"));
        ok(await isfile(file));
    }
    finally {
        if (file)
            await rm(file);
    }
});
test("mktempSync uses the default temporary directory with generated prefix and suffix", () => {
    let file;
    try {
        file = mktempSync({ prefix: "prefix-", suffix: ".suffix" });
        ok(dirname(file) === tmpdir());
        ok(file.split(/[/\\]/).at(-1).startsWith("prefix-"));
        ok(file.endsWith(".suffix"));
        ok(isfileSync(file));
    }
    finally {
        if (file)
            rmSync(file);
    }
});
