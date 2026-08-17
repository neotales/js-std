import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { lstat, lstatSync } from "./lstat.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { symlink, symlinkSync } from "./symlink.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("symlink creates a generated file link", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await writeTextFile(target, "value");
        await symlink(target, link);
        strictEqual((await lstat(link)).isSymlink, true);
        strictEqual(await readTextFile(link), "value");
    });
});
test("symlinkSync rejects an existing generated destination", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        writeTextFileSync(target, "value");
        symlinkSync(target, link);
        strictEqual(lstatSync(link).isSymlink, true);
        strictEqual(readTextFileSync(link), "value");
        throws(() => symlinkSync(target, link));
    });
});
test("symlink accepts URLs and can target generated directories", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await ensureDir(target);
        await symlink(pathToFileURL(target), pathToFileURL(link), { type: "dir" });
        strictEqual((await lstat(link)).isSymlink, true);
        await rejects(symlink(target, link));
    });
});
test("symlink rejects duplicate generated file links without changing their targets", {
    skip: isWindows,
}, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await writeTextFile(target, "value");
        await symlink(target, link);
        await rejects(symlink(target, link));
        strictEqual(await readTextFile(link), "value");
    });
});
test("symlinkSync creates generated directory links", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        ensureDirSync(target);
        writeTextFileSync(join(target, "file"), "value");
        symlinkSync(target, link, { type: "dir" });
        strictEqual(lstatSync(link).isSymlink, true);
        strictEqual(readTextFileSync(join(link, "file")), "value");
    });
});
