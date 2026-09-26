import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { copy, copySync } from "./copy.js";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { exists, existsSync } from "./exists.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { lstat, lstatSync } from "./lstat.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { readlink, readlinkSync } from "./readlink.js";
import { stat, statSync } from "./stat.js";
import { symlink, symlinkSync } from "./symlink.js";
import { utime, utimeSync } from "./utime.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("copy recursively copies a generated tree", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await ensureDir(join(source, "nested"));
        await writeTextFile(join(source, "nested", "file.txt"), "value");
        await copy(source, destination);
        strictEqual(await readTextFile(join(destination, "nested", "file.txt")), "value");
    });
});
test("copySync rejects copying a directory into itself", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        ensureDirSync(source);
        throws(() => copySync(source, join(source, "child")));
        writeTextFileSync(join(source, "file"), "value");
        copySync(source, join(root, "destination"));
        strictEqual(readTextFileSync(join(root, "destination", "file")), "value");
    });
});
test("copy overwrites files, preserves timestamps, and accepts URLs", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source.txt");
        const destination = join(root, "destination.txt");
        await writeTextFile(source, "source");
        await writeTextFile(destination, "destination");
        await rejects(copy(source, destination));
        await copy(pathToFileURL(source), pathToFileURL(destination), {
            overwrite: true,
            preserveTimestamps: true,
        });
        strictEqual(await readTextFile(destination), "source");
        await rejects(copy(join(root, "missing"), join(root, "other")));
        await rejects(copy(source, source));
    });
});
test("copySync handles directory overwrite and rejects non-directory destinations", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        ensureDirSync(join(source, "nested"));
        writeTextFileSync(join(source, "nested", "file"), "source");
        ensureDirSync(join(destination, "nested"));
        writeTextFileSync(join(destination, "nested", "file"), "old");
        throws(() => copySync(source, destination));
        copySync(source, destination, { overwrite: true });
        strictEqual(readTextFileSync(join(destination, "nested", "file")), "source");
        writeTextFileSync(join(root, "file"), "not a directory");
        throws(() => copySync(source, join(root, "file")));
        throws(() => copySync(source, join(source, "child")));
    });
});
test("copy preserves generated symbolic links", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const source = join(root, "source-link");
        const destination = join(root, "destination-link");
        await writeTextFile(target, "value");
        await symlink(target, source);
        await copy(source, destination);
        strictEqual((await lstat(destination)).isSymlink, true);
        strictEqual(await readTextFile(destination), "value");
    });
});
test("copy preserves generated directory links", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const source = join(root, "source-link");
        const destination = join(root, "destination-link");
        await ensureDir(target);
        await writeTextFile(join(target, "file"), "value");
        await symlink(target, source, { type: "dir" });
        await copy(source, destination);
        strictEqual((await lstat(destination)).isSymlink, true);
        strictEqual(await readTextFile(join(destination, "file")), "value");
    });
});
test("copySync covers generated file options and errors", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "source");
        throws(() => copySync(join(root, "missing"), destination));
        throws(() => copySync(source, source));
        copySync(source, destination);
        throws(() => copySync(source, destination));
        writeTextFileSync(destination, "old");
        copySync(source, destination, { overwrite: true, preserveTimestamps: true });
        strictEqual(readTextFileSync(destination), "source");
        strictEqual(statSync(destination).mtime?.getTime(), statSync(source).mtime?.getTime());
    });
});
test("copySync copies generated directories and rejects file destinations", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        ensureDirSync(join(source, "nested"));
        writeTextFileSync(join(source, "nested", "file"), "source");
        writeTextFileSync(join(root, "file"), "not a directory");
        throws(() => copySync(source, join(root, "file")));
        copySync(source, destination);
        writeTextFileSync(join(destination, "nested", "file"), "old");
        copySync(source, destination, { overwrite: true });
        strictEqual(readTextFileSync(join(destination, "nested", "file")), "source");
    });
});
test("copySync preserves generated symbolic links", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const fileTarget = join(root, "file-target");
        const dirTarget = join(root, "dir-target");
        const fileSource = join(root, "file-source-link");
        const dirSource = join(root, "dir-source-link");
        const fileDestination = join(root, "file-destination-link");
        const dirDestination = join(root, "dir-destination-link");
        writeTextFileSync(fileTarget, "value");
        ensureDirSync(dirTarget);
        writeTextFileSync(join(dirTarget, "file"), "value");
        symlinkSync(fileTarget, fileSource);
        symlinkSync(dirTarget, dirSource, { type: "dir" });
        copySync(fileSource, fileDestination);
        copySync(dirSource, dirDestination);
        strictEqual(lstatSync(fileDestination).isSymlink, true);
        strictEqual(lstatSync(dirDestination).isSymlink, true);
        strictEqual(readTextFileSync(fileDestination), "value");
        strictEqual(readTextFileSync(join(dirDestination, "file")), "value");
    });
});
test("copy preserves timestamps with generated files", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        await copy(source, destination, { preserveTimestamps: true });
        strictEqual((await stat(destination)).mtime?.getTime(), (await stat(source)).mtime?.getTime());
    });
});
test("copy rejects a missing source with an absent destination", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "missing");
        const destination = join(root, "destination");
        await rejects(copy(source, destination));
        strictEqual(await exists(source), false);
        strictEqual(await exists(destination), false);
    });
});
test("copy rejects an identical generated path with the upstream message", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        await writeTextFile(source, "value");
        await rejects(copy(source, source), {
            message: "Source and destination cannot be the same.",
        });
        strictEqual(await readTextFile(source), "value");
    });
});
test("copy preserves source existence and root and nested directory contents", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await ensureDir(join(source, "nested"));
        await writeTextFile(join(source, "root.txt"), "root");
        await writeTextFile(join(source, "nested", "child.txt"), "child");
        strictEqual(await exists(source), true);
        strictEqual(await exists(destination), false);
        await copy(source, destination);
        strictEqual(await exists(source), true);
        strictEqual(await exists(destination), true);
        strictEqual(await readTextFile(join(destination, "root.txt")), "root");
        strictEqual(await readTextFile(join(destination, "nested", "child.txt")), "child");
    });
});
test("copy rejects a destination inside its generated source directory", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "parent");
        const destination = join(source, "child");
        await ensureDir(source);
        await rejects(copy(source, destination), {
            message: `Cannot copy '${source}' to a subdirectory of itself, '${destination}'.`,
        });
        strictEqual(await exists(destination), false);
    });
});
test("copy rejects overwriting a file with a generated directory", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination.txt");
        await ensureDir(source);
        await writeTextFile(destination, "file");
        await rejects(copy(source, destination), {
            message: `Cannot overwrite non-directory '${destination}' with directory '${source}'.`,
        });
        strictEqual(await readTextFile(destination), "file");
    });
});
test("copy overwrites mutated generated directory contents only when requested", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await ensureDir(join(source, "nested"));
        await writeTextFile(join(source, "nested", "file"), "source");
        await copy(source, destination);
        await writeTextFile(join(destination, "nested", "file"), "mutated");
        await rejects(copy(source, destination), { message: `'${destination}' already exists.` });
        strictEqual(await readTextFile(join(destination, "nested", "file")), "mutated");
        await copy(source, destination, { overwrite: true });
        strictEqual(await readTextFile(join(destination, "nested", "file")), "source");
    });
});
test("copy preserves atime and mtime for generated files", async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        await writeTextFile(source, "value");
        const atime = new Date("2001-02-03T04:05:06.000Z");
        const mtime = new Date("2002-03-04T05:06:07.000Z");
        await utime(source, atime, mtime);
        await copy(source, destination, { preserveTimestamps: true });
        const sourceInfo = await stat(source);
        const destinationInfo = await stat(destination);
        strictEqual(destinationInfo.atime?.getTime(), sourceInfo.atime?.getTime());
        strictEqual(destinationInfo.mtime?.getTime(), sourceInfo.mtime?.getTime());
    });
});
test("copy preserves generated file and directory link targets", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const fileTarget = join(root, "file-target");
        const directoryTarget = join(root, "directory-target");
        const fileLink = join(root, "file-link");
        const directoryLink = join(root, "directory-link");
        const fileDestination = join(root, "file-copy");
        const directoryDestination = join(root, "directory-copy");
        await writeTextFile(fileTarget, "file");
        await ensureDir(directoryTarget);
        await symlink(fileTarget, fileLink);
        await symlink(directoryTarget, directoryLink, { type: "dir" });
        await copy(fileLink, fileDestination);
        await copy(directoryLink, directoryDestination);
        strictEqual((await lstat(fileDestination)).isSymlink, true);
        strictEqual((await lstat(directoryDestination)).isSymlink, true);
        strictEqual(await readlink(fileDestination), await readlink(fileLink));
        strictEqual(await readlink(directoryDestination), await readlink(directoryLink));
    });
});
test("copySync rejects a missing source with an absent destination", () => {
    withTestRootSync((root) => {
        const source = join(root, "missing");
        const destination = join(root, "destination");
        throws(() => copySync(source, destination));
        strictEqual(existsSync(source), false);
        strictEqual(existsSync(destination), false);
    });
});
test("copySync rejects an identical generated path with the upstream message", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        writeTextFileSync(source, "value");
        throws(() => copySync(source, source), {
            message: "Source and destination cannot be the same.",
        });
        strictEqual(readTextFileSync(source), "value");
    });
});
test("copySync preserves source existence and root and nested directory contents", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        ensureDirSync(join(source, "nested"));
        writeTextFileSync(join(source, "root.txt"), "root");
        writeTextFileSync(join(source, "nested", "child.txt"), "child");
        strictEqual(existsSync(source), true);
        strictEqual(existsSync(destination), false);
        copySync(source, destination);
        strictEqual(existsSync(source), true);
        strictEqual(existsSync(destination), true);
        strictEqual(readTextFileSync(join(destination, "root.txt")), "root");
        strictEqual(readTextFileSync(join(destination, "nested", "child.txt")), "child");
    });
});
test("copySync rejects a destination inside its generated source directory", () => {
    withTestRootSync((root) => {
        const source = join(root, "parent");
        const destination = join(source, "child");
        ensureDirSync(source);
        throws(() => copySync(source, destination), {
            message: `Cannot copy '${source}' to a subdirectory of itself, '${destination}'.`,
        });
        strictEqual(existsSync(destination), false);
    });
});
test("copySync rejects overwriting a file with a generated directory", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination.txt");
        ensureDirSync(source);
        writeTextFileSync(destination, "file");
        throws(() => copySync(source, destination), {
            message: `Cannot overwrite non-directory '${destination}' with directory '${source}'.`,
        });
        strictEqual(readTextFileSync(destination), "file");
    });
});
test("copySync overwrites mutated generated directory contents only when requested", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        ensureDirSync(join(source, "nested"));
        writeTextFileSync(join(source, "nested", "file"), "source");
        copySync(source, destination);
        writeTextFileSync(join(destination, "nested", "file"), "mutated");
        throws(() => copySync(source, destination), { message: `'${destination}' already exists.` });
        strictEqual(readTextFileSync(join(destination, "nested", "file")), "mutated");
        copySync(source, destination, { overwrite: true });
        strictEqual(readTextFileSync(join(destination, "nested", "file")), "source");
    });
});
test("copySync preserves atime and mtime for generated files", () => {
    withTestRootSync((root) => {
        const source = join(root, "source");
        const destination = join(root, "destination");
        writeTextFileSync(source, "value");
        const atime = new Date("2001-02-03T04:05:06.000Z");
        const mtime = new Date("2002-03-04T05:06:07.000Z");
        utimeSync(source, atime, mtime);
        copySync(source, destination, { preserveTimestamps: true });
        const sourceInfo = statSync(source);
        const destinationInfo = statSync(destination);
        strictEqual(destinationInfo.atime?.getTime(), sourceInfo.atime?.getTime());
        strictEqual(destinationInfo.mtime?.getTime(), sourceInfo.mtime?.getTime());
    });
});
test("copySync preserves generated file and directory link targets", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const fileTarget = join(root, "file-target");
        const directoryTarget = join(root, "directory-target");
        const fileLink = join(root, "file-link");
        const directoryLink = join(root, "directory-link");
        const fileDestination = join(root, "file-copy");
        const directoryDestination = join(root, "directory-copy");
        writeTextFileSync(fileTarget, "file");
        ensureDirSync(directoryTarget);
        symlinkSync(fileTarget, fileLink);
        symlinkSync(directoryTarget, directoryLink, { type: "dir" });
        copySync(fileLink, fileDestination);
        copySync(directoryLink, directoryDestination);
        strictEqual(lstatSync(fileDestination).isSymlink, true);
        strictEqual(lstatSync(directoryDestination).isSymlink, true);
        strictEqual(readlinkSync(fileDestination), readlinkSync(fileLink));
        strictEqual(readlinkSync(directoryDestination), readlinkSync(directoryLink));
    });
});
