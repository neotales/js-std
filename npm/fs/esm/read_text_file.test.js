import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("readTextFile reads generated UTF-8 text", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "hello\nworld");
        strictEqual(await readTextFile(file), "hello\nworld");
        await rejects(readTextFile(join(root, "missing")));
    });
});
test("readTextFileSync reads generated UTF-8 text", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "hello\nworld");
        strictEqual(readTextFileSync(file), "hello\nworld");
        throws(() => readTextFileSync(join(root, "missing")));
    });
});
test("readTextFile accepts URLs and preserves a byte order mark", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "\ufeffvalue");
        strictEqual(await readTextFile(pathToFileURL(file)), "\ufeffvalue");
        await rejects(readTextFile(root));
    });
});
test("readTextFileSync preserves byte order marks and rejects directories", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "\ufeffvalue");
        strictEqual(readTextFileSync(file), "\ufeffvalue");
        throws(() => readTextFileSync(root));
    });
});
test("readTextFile honors an already-aborted signal", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        const controller = new AbortController();
        await writeTextFile(file, "value");
        controller.abort();
        await rejects(readTextFile(file, { signal: controller.signal }));
    });
});
test("readTextFile exposes queued abort names and reasons", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        const aborted = new AbortController();
        queueMicrotask(() => aborted.abort());
        await rejects(readTextFile(file, { signal: aborted.signal }), (error) => {
            strictEqual(error.name, "AbortError");
            return true;
        });
        const reason = new Error("reason");
        const withReason = new AbortController();
        queueMicrotask(() => withReason.abort(reason));
        await rejects(readTextFile(file, { signal: withReason.signal }), (error) => {
            strictEqual(error === reason || error.cause === reason, true);
            return true;
        });
        const primitiveReason = "cancelled";
        const primitive = new AbortController();
        queueMicrotask(() => primitive.abort(primitiveReason));
        await rejects(readTextFile(file, { signal: primitive.signal }), (error) => {
            strictEqual(error === primitiveReason ||
                error.cause === primitiveReason, true);
            return true;
        });
    });
});
