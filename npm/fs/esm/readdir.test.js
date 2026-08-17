import "./_dnt.test_polyfills.js";
import { deepStrictEqual, rejects, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { readdir, readdirSync } from "./readdir.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("readdir yields generated entry metadata", async () => {
    await withTestRoot(async (root) => {
        await ensureDir(join(root, "directory"));
        await writeTextFile(join(root, "file"), "value");
        const entries = await Array.fromAsync(readdir(root));
        deepStrictEqual(entries.map(({ name }) => name).sort(), ["directory", "file"]);
        deepStrictEqual(entries.map(({ isDirectory }) => isDirectory).sort(), [false, true]);
    });
});
test("readdirSync yields generated entry metadata", () => {
    withTestRootSync((root) => {
        ensureDirSync(join(root, "directory"));
        writeTextFileSync(join(root, "file"), "value");
        deepStrictEqual([...readdirSync(root)].map(({ name }) => name).sort(), ["directory", "file"]);
    });
});
test("readdir accepts URLs and rejects files and missing directories", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        deepStrictEqual((await Array.fromAsync(readdir(pathToFileURL(root)))).map(({ name }) => name), ["file"]);
        await rejects(Array.fromAsync(readdir(file)));
        await rejects(Array.fromAsync(readdir(join(root, "missing"))));
    });
});
test("readdirSync rejects files and missing directories", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        throws(() => [...readdirSync(file)]);
        throws(() => [...readdirSync(join(root, "missing"))]);
    });
});
