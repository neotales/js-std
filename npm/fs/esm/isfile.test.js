import "./_dnt.test_polyfills.js";
import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { isfile, isfileSync } from "./isfile.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("isfile recognizes generated files", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        strictEqual(await isfile(file), true);
        strictEqual(await isfile(join(root, "missing")), false);
    });
});
test("isfileSync recognizes generated files", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        strictEqual(isfileSync(file), true);
        strictEqual(isfileSync(join(root, "missing")), false);
    });
});
test("isfile accepts URL paths and excludes directories", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        strictEqual(await isfile(pathToFileURL(file)), true);
        await ensureDir(join(root, "directory"));
        strictEqual(await isfile(join(root, "directory")), false);
    });
});
test("isfileSync excludes generated directories", () => {
    withTestRootSync((root) => {
        const directory = join(root, "directory");
        ensureDirSync(directory);
        strictEqual(isfileSync(directory), false);
    });
});
