import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { withTestRoot } from "./_test_helpers.ts";
import { copyFile } from "./copy_file.ts";
import { readTextFile } from "./read_text_file.ts";
import { writeTextFile } from "./write_text_file.ts";

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

test("fs::Bun supports default asynchronous file I/O", { skip: !isBun }, async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source.txt");
    const destination = join(root, "destination.txt");
    await writeTextFile(source, "bun");
    await copyFile(source, destination);
    strictEqual(await readTextFile(destination), "bun");
  });
});
