import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { link, linkSync } from "./link.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { rm, rmSync } from "./rm.js";
import { stat, statSync } from "./stat.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("link creates a hard link", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await link(source, destination);
        strictEqual(await readTextFile(destination), "value");
    });
});
test("linkSync creates a hard link", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "value");
        linkSync(source, destination);
        strictEqual(readTextFileSync(destination), "value");
    });
});
test("link shares mutations and rejects duplicate destinations", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await link(source, destination);
        await writeTextFile(destination, "changed");
        strictEqual(await readTextFile(source), "changed");
        await rejects(link(source, destination));
        await rejects(link(join(root, "missing"), join(root, "other")));
    });
});
test("linkSync rejects duplicate and missing generated paths", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "value");
        linkSync(source, destination);
        throws(() => linkSync(source, destination));
        throws(() => linkSync(join(root, "missing"), join(root, "other")));
    });
});
test("link leaves its generated hard link usable after the source is removed", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await link(source, destination);
        strictEqual((await stat(source)).nlink, 2);
        await rm(source);
        strictEqual((await stat(destination)).isFile, true);
        strictEqual((await stat(destination)).isSymlink, false);
        strictEqual((await stat(destination)).nlink, 1);
        strictEqual(await readTextFile(destination), "value");
    });
});
test("linkSync leaves its generated hard link usable after the source is removed", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "value");
        linkSync(source, destination);
        strictEqual(statSync(source).nlink, 2);
        rmSync(source);
        strictEqual(statSync(destination).isFile, true);
        strictEqual(statSync(destination).isSymlink, false);
        strictEqual(statSync(destination).nlink, 1);
        strictEqual(readTextFileSync(destination), "value");
    });
});
