import "./_dnt.test_polyfills.js";
import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { withTestRoot } from "./_test_helpers.js";
import { copyFile } from "./copy_file.js";
import { readTextFile } from "./read_text_file.js";
import { writeTextFile } from "./write_text_file.js";
const isBun = typeof globalThis.Bun !== "undefined";
test("fs::Bun supports default asynchronous file I/O", { skip: !isBun }, async () => {
    await withTestRoot(async (root) => {
        const source = join(root, "source.txt");
        const destination = join(root, "destination.txt");
        await writeTextFile(source, "bun");
        await copyFile(source, destination);
        strictEqual(await readTextFile(destination), "bun");
    });
});
