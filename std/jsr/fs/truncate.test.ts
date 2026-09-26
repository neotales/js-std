import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { readTextFile, readTextFileSync } from "./read_text_file.ts";
import { truncate, truncateSync } from "./truncate.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("truncate shortens a generated file", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await truncate(file, 3);
    strictEqual(await readTextFile(file), "val");
  });
});

test("truncateSync extends a generated file with zero bytes", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "v");
    truncateSync(file, 3);
    strictEqual(readTextFileSync(file), "v\0\0");
    throws(() => truncateSync(join(root, "missing"), 1));
  });
});

test("truncate defaults to zero and rejects directories", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await truncate(file);
    strictEqual(await readTextFile(file), "");
    await rejects(truncate(root));
  });
});

test("truncate reports missing paths and truncateSync defaults to zero", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    truncateSync(file);
    strictEqual(readTextFileSync(file), "");
    throws(() => truncateSync(root));
    throws(() => truncateSync(join(root, "missing")));
  });
});

test("truncate grows, shrinks, and clamps negative lengths to zero", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await truncate(file, 8);
    strictEqual(await readTextFile(file), "value\0\0\0");
    await truncate(file, 3);
    strictEqual(await readTextFile(file), "val");
    await truncate(file, -1);
    strictEqual(await readTextFile(file), "");
  });
});

test("truncateSync grows, shrinks, and clamps negative lengths to zero", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    truncateSync(file, 8);
    strictEqual(readTextFileSync(file), "value\0\0\0");
    truncateSync(file, 3);
    strictEqual(readTextFileSync(file), "val");
    truncateSync(file, -1);
    strictEqual(readTextFileSync(file), "");
  });
});
