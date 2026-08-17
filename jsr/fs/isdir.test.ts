import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { isdir, isdirSync } from "./isdir.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("isdir recognizes generated directories", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(directory);
    strictEqual(await isdir(directory), true);
    strictEqual(await isdir(join(root, "missing")), false);
  });
});

test("isdirSync recognizes generated directories", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    ensureDirSync(directory);
    strictEqual(isdirSync(directory), true);
    strictEqual(isdirSync(join(root, "missing")), false);
  });
});

test("isdir accepts URL paths and excludes files", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    const file = join(root, "file");
    await ensureDir(directory);
    await writeTextFile(file, "value");
    strictEqual(await isdir(pathToFileURL(directory)), true);
    strictEqual(await isdir(file), false);
  });
});

test("isdirSync excludes generated files", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    strictEqual(isdirSync(file), false);
  });
});
