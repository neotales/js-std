import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { isdir, isdirSync } from "./isdir.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("ensureDir creates nested directories", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "one", "two");
    await ensureDir(directory);
    await ensureDir(directory);
    strictEqual(await isdir(directory), true);
  });
});

test("ensureDirSync creates nested directories", () => {
  withTestRootSync((root) => {
    const directory = join(root, "one", "two");
    ensureDirSync(directory);
    ensureDirSync(directory);
    strictEqual(isdirSync(directory), true);
  });
});

test("ensureDir accepts URL paths and rejects existing files", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(pathToFileURL(directory));
    strictEqual(await isdir(directory), true);
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await rejects(ensureDir(file));
  });
});

test("ensureDirSync rejects existing files", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    throws(() => ensureDirSync(file));
  });
});

test("ensureDir accepts directory links and rejects file links", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    const file = join(root, "file");
    const directoryLink = join(root, "directory-link");
    const fileLink = join(root, "file-link");
    await ensureDir(directory);
    await writeTextFile(file, "value");
    await symlink(directory, directoryLink, { type: "dir" });
    await symlink(file, fileLink);
    await ensureDir(directoryLink);
    await rejects(ensureDir(fileLink));
  });
});

test("ensureDirSync accepts directory links and rejects file links", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    const file = join(root, "file");
    const directoryLink = join(root, "directory-link");
    const fileLink = join(root, "file-link");
    ensureDirSync(directory);
    writeTextFileSync(file, "value");
    symlinkSync(directory, directoryLink, { type: "dir" });
    symlinkSync(file, fileLink);
    ensureDirSync(directoryLink);
    throws(() => ensureDirSync(fileLink));
  });
});
