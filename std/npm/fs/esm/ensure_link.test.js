import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureLink, ensureLinkSync } from "./ensure_link.js";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { lstat, lstatSync } from "./lstat.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("ensureLink creates a hard link and parent directory", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const link = join(root, "nested", "link");
        await writeTextFile(source, "value");
        await ensureLink(source, link);
        strictEqual(await readTextFile(link), "value");
    });
});
test("ensureLinkSync creates a hard link and parent directory", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const link = join(root, "nested", "link");
        writeTextFileSync(source, "value");
        ensureLinkSync(source, link);
        strictEqual(readTextFileSync(link), "value");
    });
});
test("ensureLink accepts URL paths and rejects existing destinations", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await ensureLink(pathToFileURL(source), pathToFileURL(destination));
        await rejects(ensureLink(source, destination));
        await rejects(ensureLink(join(root, "missing"), join(root, "other")));
    });
});
test("ensureLinkSync mutations are visible through the original", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "value");
        ensureLinkSync(source, destination);
        strictEqual(lstatSync(source).isFile, true);
        strictEqual(lstatSync(destination).isFile, true);
        writeTextFileSync(source, "changed through source");
        strictEqual(readTextFileSync(destination), "changed through source");
        writeTextFileSync(destination, "changed");
        strictEqual(readTextFileSync(source), "changed");
        throws(() => ensureLinkSync(join(root, "missing"), join(root, "other")));
    });
});
test("ensureLink mutations are visible through the original and failed links preserve data", {
    skip: isWindows,
}, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await ensureLink(source, destination);
        strictEqual((await lstat(source)).isFile, true);
        strictEqual((await lstat(destination)).isFile, true);
        await writeTextFile(source, "changed through source");
        strictEqual(await readTextFile(destination), "changed through source");
        await writeTextFile(destination, "changed");
        strictEqual(await readTextFile(source), "changed");
        await rejects(ensureLink(join(root, "missing"), join(root, "other")));
        strictEqual(await readTextFile(source), "changed");
    });
});
test("ensureLink rejects directory sources", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await ensureDir(source);
        await rejects(ensureLink(source, destination));
    });
});
test("ensureLinkSync rejects directory sources", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        ensureDirSync(source);
        throws(() => ensureLinkSync(source, destination));
    });
});
