import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { exists, existsSync } from "./exists.ts";
import { rm, rmSync } from "./rm.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("rm recursively removes a generated tree", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(directory);
    await writeTextFile(join(directory, "file"), "value");
    await rm(directory, { recursive: true });
    strictEqual(await exists(directory), false);
  });
});

test("rmSync reports missing generated paths", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    ensureDirSync(directory);
    writeTextFileSync(join(directory, "file"), "value");
    rmSync(directory, { recursive: true });
    strictEqual(existsSync(directory), false);
    throws(() => rmSync(directory));
  });
});

test("rm requires recursive removal for non-empty directories and rejects missing URLs", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(directory);
    await writeTextFile(join(directory, "file"), "value");
    await rejects(rm(directory));
    await rm(pathToFileURL(directory), { recursive: true });
    await rejects(rm(pathToFileURL(join(root, "missing"))));
  });
});

test("rmSync removes generated files and reports missing paths", () => {
  withTestRootSync((root) => {
    throws(() => rmSync(join(root, "missing")));
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    rmSync(file);
    strictEqual(existsSync(file), false);
  });
});

test("rm removes empty directories and reports missing recursive paths", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(directory);
    await rm(directory);
    strictEqual(await exists(directory), false);
    await rejects(rm(join(root, "missing"), { recursive: true }));
  });
});

test("rmSync removes non-empty directories and reports missing recursive paths", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    ensureDirSync(directory);
    writeTextFileSync(join(directory, "file"), "value");
    rmSync(directory, { recursive: true });
    strictEqual(existsSync(directory), false);
    throws(() => rmSync(join(root, "missing"), { recursive: true }));
  });
});
