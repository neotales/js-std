import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { ensureFile, ensureFileSync } from "./ensure_file.ts";
import { isfile, isfileSync } from "./isfile.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { readTextFile } from "./read_text_file.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("ensureFile creates parents without truncating", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "one", "file");
    await ensureFile(file);
    await writeTextFile(file, "value");
    await ensureFile(file);
    strictEqual(await isfile(file), true);
  });
});

test("ensureFileSync creates parents without truncating", () => {
  withTestRootSync((root) => {
    const file = join(root, "one", "file");
    ensureFileSync(file);
    writeTextFileSync(file, "value");
    ensureFileSync(file);
    strictEqual(isfileSync(file), true);
  });
});

test("ensureFile accepts URL paths and rejects directories", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await ensureFile(pathToFileURL(file));
    await writeTextFile(file, "value");
    await ensureFile(file);
    strictEqual(await readTextFile(file), "value");
    await rejects(ensureFile(root));
  });
});

test("ensureFileSync rejects directories without changing existing content", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    ensureFileSync(file);
    strictEqual(isfileSync(file), true);
    throws(() => ensureFileSync(root));
  });
});
