import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { lstat, lstatSync } from "./lstat.js";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { symlink, symlinkSync } from "./symlink.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("lstat does not follow a generated symlink", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const link = join(root, "link");
        await writeTextFile(source, "value");
        await symlink(source, link);
        strictEqual((await lstat(link)).isSymlink, true);
    });
});
test("lstatSync identifies a generated file", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        strictEqual(lstatSync(file).isFile, true);
        if (!isWindows) {
            symlinkSync(file, join(root, "link"));
            strictEqual(lstatSync(join(root, "link")).isSymlink, true);
        }
    });
});
test("lstat accepts URL paths and rejects missing paths", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        strictEqual((await lstat(pathToFileURL(file))).isFile, true);
        await rejects(lstat(join(root, "missing")));
    });
});
test("lstatSync rejects missing paths", () => {
    withTestRootSync((root) => throws(() => lstatSync(join(root, "missing"))));
});
test("lstat identifies generated files and directories", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        const directory = join(root, "directory");
        await writeTextFile(file, "value");
        await ensureDir(directory);
        strictEqual((await lstat(file)).isFile, true);
        strictEqual((await lstat(directory)).isDirectory, true);
    });
});
test("lstatSync identifies generated files and directories", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        const directory = join(root, "directory");
        writeTextFileSync(file, "value");
        ensureDirSync(directory);
        strictEqual(lstatSync(file).isFile, true);
        strictEqual(lstatSync(directory).isDirectory, true);
    });
});
