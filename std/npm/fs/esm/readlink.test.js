import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readlink, readlinkSync } from "./readlink.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { symlink, symlinkSync } from "./symlink.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("readlink returns a generated link target", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await writeTextFile(target, "value");
        await symlink(target, link);
        strictEqual(await readlink(link), target);
    });
});
test("readlinkSync returns a generated link target", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        writeTextFileSync(target, "value");
        symlinkSync(target, link);
        strictEqual(readlinkSync(link), target);
        throws(() => readlinkSync(target));
    });
});
test("readlink accepts URL links and rejects non-links", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await writeTextFile(target, "value");
        await symlink(target, link);
        strictEqual(await readlink(pathToFileURL(link)), target);
        await rejects(readlink(target));
        await rejects(readlink(join(root, "missing")));
    });
});
test("readlinkSync rejects generated regular files and missing links", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        throws(() => readlinkSync(file));
        throws(() => readlinkSync(join(root, "missing")));
    });
});
