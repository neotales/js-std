import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { exists, existsSync } from "./exists.ts";
import { rename, renameSync } from "./rename.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { readTextFile, readTextFileSync } from "./read_text_file.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("rename relocates a generated file", async () => {
  await withTestRoot(async (root) => {
    const oldPath = join(root, "old");
    const newPath = join(root, "new");
    await writeTextFile(oldPath, "value");
    await rename(oldPath, newPath);
    strictEqual(await exists(oldPath), false);
    strictEqual(await readTextFile(newPath), "value");
  });
});

test("renameSync relocates a generated file", () => {
  withTestRootSync((root) => {
    const oldPath = join(root, "old");
    const newPath = join(root, "new");
    writeTextFileSync(oldPath, "value");
    renameSync(oldPath, newPath);
    strictEqual(existsSync(oldPath), false);
    strictEqual(readTextFileSync(newPath), "value");
  });
});

test("rename accepts URL files, replaces files, and rejects missing sources", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await writeTextFile(source, "source");
    await writeTextFile(destination, "destination");
    await rename(pathToFileURL(source), pathToFileURL(destination));
    strictEqual(await readTextFile(destination), "source");
    await rejects(rename(join(root, "missing"), join(root, "other")));
  });
});

test("renameSync moves empty directories and rejects file-to-directory replacement", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    const renamed = join(root, "renamed");
    ensureDirSync(directory);
    renameSync(directory, renamed);
    strictEqual(existsSync(renamed), true);
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    ensureDirSync(directory);
    throws(() => renameSync(file, directory));
  });
});

test("rename handles platform-specific empty directory replacement", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await ensureDir(source);
    await ensureDir(destination);
    if (isWindows) {
      await rejects(rename(source, destination));
      strictEqual(await exists(source, { isDirectory: true }), true);
      strictEqual(await exists(destination, { isDirectory: true }), true);
    } else {
      await rename(source, destination);
      strictEqual(await exists(source), false);
      strictEqual(await exists(destination, { isDirectory: true }), true);
    }
  });
});

test("rename handles platform-specific directory-to-file replacement", async () => {
  await withTestRoot(async (root) => {
    const sourceDirectory = join(root, "source-directory");
    const fullDirectory = join(root, "full-directory");
    const sourceFile = join(root, "source-file");
    const destinationFile = join(root, "destination-file");
    await ensureDir(sourceDirectory);
    await ensureDir(fullDirectory);
    await writeTextFile(join(fullDirectory, "child"), "child");
    await writeTextFile(sourceFile, "source");
    await writeTextFile(destinationFile, "destination");
    await rejects(rename(sourceDirectory, fullDirectory));
    await ensureDir(join(root, "directory"));
    await rejects(rename(sourceFile, join(root, "directory")));
    if (isWindows) {
      await rename(sourceDirectory, destinationFile);
      strictEqual(await exists(sourceDirectory), false);
      strictEqual(await exists(destinationFile, { isDirectory: true }), true);
    } else {
      await rejects(rename(sourceDirectory, destinationFile));
      strictEqual(await exists(sourceDirectory), true);
      strictEqual(await readTextFile(destinationFile), "destination");
    }
  });
});

test(
  "rename rejects directory destinations that are generated links",
  { skip: isWindows },
  async () => {
    await withTestRoot(async (root) => {
      const source = join(root, "source");
      const targetFile = join(root, "target-file");
      const targetDirectory = join(root, "target-directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      const brokenLink = join(root, "broken-link");
      await ensureDir(source);
      await writeTextFile(targetFile, "target");
      await ensureDir(targetDirectory);
      await symlink(targetFile, fileLink);
      await symlink(targetDirectory, directoryLink, { type: "dir" });
      await symlink("missing", brokenLink);
      await rejects(rename(source, fileLink));
      await rejects(rename(source, directoryLink));
      await rejects(rename(source, brokenLink));
      strictEqual(await exists(source), true);
    });
  },
);

test("renameSync handles platform-specific empty directory replacement", () => {
  withTestRootSync((root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    ensureDirSync(source);
    ensureDirSync(destination);
    if (isWindows) {
      throws(() => renameSync(source, destination));
      strictEqual(existsSync(source, { isDirectory: true }), true);
      strictEqual(existsSync(destination, { isDirectory: true }), true);
    } else {
      renameSync(source, destination);
      strictEqual(existsSync(source), false);
      strictEqual(existsSync(destination, { isDirectory: true }), true);
    }
  });
});

test("renameSync handles platform-specific directory-to-file replacement", () => {
  withTestRootSync((root) => {
    const sourceDirectory = join(root, "source-directory");
    const fullDirectory = join(root, "full-directory");
    const sourceFile = join(root, "source-file");
    const destinationFile = join(root, "destination-file");
    ensureDirSync(sourceDirectory);
    ensureDirSync(fullDirectory);
    writeTextFileSync(join(fullDirectory, "child"), "child");
    writeTextFileSync(sourceFile, "source");
    writeTextFileSync(destinationFile, "destination");
    throws(() => renameSync(sourceDirectory, fullDirectory));
    ensureDirSync(join(root, "directory"));
    throws(() => renameSync(sourceFile, join(root, "directory")));
    if (isWindows) {
      renameSync(sourceDirectory, destinationFile);
      strictEqual(existsSync(sourceDirectory), false);
      strictEqual(existsSync(destinationFile, { isDirectory: true }), true);
    } else {
      throws(() => renameSync(sourceDirectory, destinationFile));
      strictEqual(existsSync(sourceDirectory), true);
      strictEqual(readTextFileSync(destinationFile), "destination");
    }
  });
});

test(
  "renameSync rejects directory destinations that are generated links",
  { skip: isWindows },
  () => {
    withTestRootSync((root) => {
      const source = join(root, "source");
      const targetFile = join(root, "target-file");
      const targetDirectory = join(root, "target-directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      const brokenLink = join(root, "broken-link");
      ensureDirSync(source);
      writeTextFileSync(targetFile, "target");
      ensureDirSync(targetDirectory);
      symlinkSync(targetFile, fileLink);
      symlinkSync(targetDirectory, directoryLink, { type: "dir" });
      symlinkSync("missing", brokenLink);
      throws(() => renameSync(source, fileLink));
      throws(() => renameSync(source, directoryLink));
      throws(() => renameSync(source, brokenLink));
      strictEqual(existsSync(source), true);
    });
  },
);
