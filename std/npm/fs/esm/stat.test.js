import "./_dnt.test_polyfills.js";
import { ok, rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { stat, statSync } from "./stat.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("stat reports generated file metadata", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        const info = await stat(file);
        strictEqual(info.isFile, true);
        strictEqual(info.size, 5);
        ok(info.mtime instanceof Date);
    });
});
test("statSync reports generated file metadata", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        const info = statSync(file);
        strictEqual(info.isFile, true);
        strictEqual(info.size, 5);
        ok(info.mtime instanceof Date);
    });
});
test("stat follows URL-addressed files and reports directories", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        strictEqual((await stat(pathToFileURL(file))).isFile, true);
        strictEqual((await stat(root)).isDirectory, true);
        await rejects(stat(join(root, "missing")));
    });
});
test("statSync rejects missing generated paths", () => {
    withTestRootSync((root) => throws(() => statSync(join(root, "missing"))));
});
test("statSync reports generated directory metadata", () => {
    withTestRootSync((root) => {
        strictEqual(statSync(root).isDirectory, true);
        strictEqual(statSync(root).isFile, false);
    });
});
