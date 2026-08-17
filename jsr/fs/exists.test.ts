import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { chmod, chmodSync } from "./chmod.ts";
import { exists, existsSync } from "./exists.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { uid } from "./uid.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("exists distinguishes generated files and directories", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const directory = join(root, "directory");
    await writeTextFile(file, "value");
    await ensureDir(directory);
    strictEqual(await exists(file, { isFile: true }), true);
    strictEqual(await exists(directory, { isDirectory: true }), true);
    strictEqual(await exists(join(root, "missing")), false);
  });
});

test("existsSync rejects conflicting type filters", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    strictEqual(existsSync(file), true);
    throws(() => existsSync(file, { isDirectory: true, isFile: true }), TypeError);
  });
});

test("exists follows generated links and accepts URL paths", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    strictEqual(await exists(pathToFileURL(file)), true);
    strictEqual(await exists(file, { isDirectory: true }), false);
    throws(() => existsSync(file, { isDirectory: true, isFile: true }), TypeError);
  });
});

test("exists checks every generated file and directory type-filter branch", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const directory = join(root, "directory");
    await writeTextFile(file, "value");
    await ensureDir(directory);
    strictEqual(await exists(file), true);
    strictEqual(await exists(file, { isFile: true }), true);
    strictEqual(await exists(file, { isDirectory: true }), false);
    strictEqual(await exists(directory), true);
    strictEqual(await exists(directory, { isDirectory: true }), true);
    strictEqual(await exists(directory, { isFile: true }), false);
    strictEqual(await exists(join(root, "missing"), { isFile: true }), false);
    await rejects(exists(file, { isDirectory: true, isFile: true }), TypeError);
  });
});

test("existsSync checks every generated file and directory type-filter branch", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const directory = join(root, "directory");
    writeTextFileSync(file, "value");
    ensureDirSync(directory);
    strictEqual(existsSync(file), true);
    strictEqual(existsSync(file, { isFile: true }), true);
    strictEqual(existsSync(file, { isDirectory: true }), false);
    strictEqual(existsSync(directory), true);
    strictEqual(existsSync(directory, { isDirectory: true }), true);
    strictEqual(existsSync(directory, { isFile: true }), false);
    strictEqual(existsSync(join(root, "missing"), { isDirectory: true }), false);
    throws(() => existsSync(file, { isDirectory: true, isFile: true }), TypeError);
  });
});

test(
  "exists follows generated file and directory links for async and sync calls",
  {
    skip: isWindows,
  },
  async () => {
    await withTestRoot(async (root) => {
      const file = join(root, "file");
      const directory = join(root, "directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      await writeTextFile(file, "value");
      await ensureDir(directory);
      await symlink(file, fileLink);
      await symlink(directory, directoryLink, { type: "dir" });
      strictEqual(await exists(fileLink, { isFile: true }), true);
      strictEqual(await exists(directoryLink, { isDirectory: true }), true);
      strictEqual(await exists(fileLink, { isDirectory: true }), false);
      strictEqual(await exists(directoryLink, { isFile: true }), false);
    });
    withTestRootSync((root) => {
      const file = join(root, "file");
      const directory = join(root, "directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      writeTextFileSync(file, "value");
      ensureDirSync(directory);
      symlinkSync(file, fileLink);
      symlinkSync(directory, directoryLink, { type: "dir" });
      strictEqual(existsSync(fileLink, { isFile: true }), true);
      strictEqual(existsSync(directoryLink, { isDirectory: true }), true);
      strictEqual(existsSync(fileLink, { isDirectory: true }), false);
      strictEqual(existsSync(directoryLink, { isFile: true }), false);
    });
  },
);

test(
  "exists reports mode-000 files, directories, and links as unreadable",
  {
    skip: isWindows || uid() === 0,
  },
  async () => {
    await withTestRoot(async (root) => {
      const file = join(root, "file");
      const directory = join(root, "directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      await writeTextFile(file, "value");
      await ensureDir(directory);
      await symlink(file, fileLink);
      await symlink(directory, directoryLink, { type: "dir" });
      try {
        await chmod(file, 0o000);
        await chmod(directory, 0o000);
        strictEqual(await exists(file, { isReadable: true }), false);
        strictEqual(await exists(directory, { isReadable: true }), false);
        strictEqual(await exists(fileLink, { isReadable: true }), false);
        strictEqual(await exists(directoryLink, { isReadable: true }), false);
      } finally {
        await chmod(file, 0o600);
        await chmod(directory, 0o700);
      }
    });
  },
);

test(
  "existsSync reports mode-000 files, directories, and links as unreadable",
  {
    skip: isWindows || uid() === 0,
  },
  () => {
    withTestRootSync((root) => {
      const file = join(root, "file");
      const directory = join(root, "directory");
      const fileLink = join(root, "file-link");
      const directoryLink = join(root, "directory-link");
      writeTextFileSync(file, "value");
      ensureDirSync(directory);
      symlinkSync(file, fileLink);
      symlinkSync(directory, directoryLink, { type: "dir" });
      try {
        chmodSync(file, 0o000);
        chmodSync(directory, 0o000);
        strictEqual(existsSync(file, { isReadable: true }), false);
        strictEqual(existsSync(directory, { isReadable: true }), false);
        strictEqual(existsSync(fileLink, { isReadable: true }), false);
        strictEqual(existsSync(directoryLink, { isReadable: true }), false);
      } finally {
        chmodSync(file, 0o600);
        chmodSync(directory, 0o700);
      }
    });
  },
);
