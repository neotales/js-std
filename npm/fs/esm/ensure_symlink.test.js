import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { ensureSymlink, ensureSymlinkSync } from "./ensure_symlink.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { lstat, lstatSync } from "./lstat.js";
import { readlink, readlinkSync } from "./readlink.js";
import { symlink, symlinkSync } from "./symlink.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("ensureSymlink creates a generated link", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const link = join(root, "nested", "link");
        await writeTextFile(source, "value");
        await ensureSymlink(source, link);
        strictEqual(await readTextFile(link), "value");
    });
});
test("ensureSymlinkSync creates a generated link", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const link = join(root, "nested", "link");
        writeTextFileSync(source, "value");
        ensureSymlinkSync(source, link);
        strictEqual(readTextFileSync(link), "value");
    });
});
test("ensureSymlink accepts URLs, relative targets, and detects conflicts", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "nested", "link");
        const other = join(root, "other");
        await writeTextFile(target, "value");
        await writeTextFile(other, "other");
        await ensureSymlink(pathToFileURL(target), pathToFileURL(link));
        await ensureSymlink(target, link);
        strictEqual((await lstat(target)).isFile, true);
        strictEqual((await lstat(link)).isSymlink, true);
        await rejects(ensureSymlink(other, link));
        await rejects(ensureSymlink(join(root, "missing"), join(root, "missing-link")));
    });
});
test("ensureSymlinkSync rejects a non-link destination", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        writeTextFileSync(target, "value");
        writeTextFileSync(link, "not a link");
        throws(() => ensureSymlinkSync(target, link));
    });
});
test("ensureSymlink creates directory and relative generated links", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const directory = join(root, "directory");
        const directoryLink = join(root, "directory-link");
        const file = join(root, "file");
        const relativeLink = join(root, "relative-link");
        await ensureDir(directory);
        await writeTextFile(join(directory, "file"), "value");
        await writeTextFile(file, "value");
        await ensureSymlink(directory, directoryLink);
        await ensureSymlink("file", relativeLink);
        strictEqual((await lstat(directoryLink)).isSymlink, true);
        strictEqual((await lstat(relativeLink)).isSymlink, true);
        strictEqual(await readTextFile(join(directoryLink, "file")), "value");
        strictEqual(await readTextFile(relativeLink), "value");
    });
});
test("ensureSymlinkSync creates directory and relative generated links", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const directory = join(root, "directory");
        const directoryLink = join(root, "directory-link");
        const file = join(root, "file");
        const relativeLink = join(root, "relative-link");
        ensureDirSync(directory);
        writeTextFileSync(join(directory, "file"), "value");
        writeTextFileSync(file, "value");
        ensureSymlinkSync(directory, directoryLink);
        ensureSymlinkSync("file", relativeLink);
        strictEqual(lstatSync(directoryLink).isSymlink, true);
        strictEqual(lstatSync(relativeLink).isSymlink, true);
        strictEqual(readTextFileSync(join(directoryLink, "file")), "value");
        strictEqual(readTextFileSync(relativeLink), "value");
        throws(() => ensureSymlinkSync(join(root, "missing"), join(root, "missing-link")));
    });
});
test("ensureSymlink rejects every occupied destination without changing it", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const file = join(root, "file");
        const directory = join(root, "directory");
        const brokenLink = join(root, "broken-link");
        await writeTextFile(target, "target");
        await writeTextFile(file, "file");
        await ensureDir(directory);
        await symlink("missing", brokenLink);
        await rejects(ensureSymlink(target, file));
        await rejects(ensureSymlink(target, directory));
        await rejects(ensureSymlink(target, brokenLink));
        strictEqual(await readTextFile(file), "file");
        strictEqual((await lstat(directory)).isDirectory, true);
        strictEqual(await readlink(brokenLink), "missing");
        strictEqual(await readTextFile(target), "target");
    });
});
test("ensureSymlinkSync rejects every occupied destination without changing it", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const file = join(root, "file");
        const directory = join(root, "directory");
        const brokenLink = join(root, "broken-link");
        writeTextFileSync(target, "target");
        writeTextFileSync(file, "file");
        ensureDirSync(directory);
        symlinkSync("missing", brokenLink);
        throws(() => ensureSymlinkSync(target, file));
        throws(() => ensureSymlinkSync(target, directory));
        throws(() => ensureSymlinkSync(target, brokenLink));
        strictEqual(readTextFileSync(file), "file");
        strictEqual(lstatSync(directory).isDirectory, true);
        strictEqual(readlinkSync(brokenLink), "missing");
        strictEqual(readTextFileSync(target), "target");
    });
});
