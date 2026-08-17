import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { exists } from "./exists.js";
import { stat, statSync } from "./stat.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("writeTextFile writes and appends generated text", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "hello");
        await writeTextFile(file, " world", { append: true });
        strictEqual(await readTextFile(file), "hello world");
        await rejects(writeTextFile(join(root, "missing", "file"), "", { create: false }));
    });
});
test("writeTextFileSync writes generated text", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "hello");
        writeTextFileSync(file, " world", { append: true });
        strictEqual(readTextFileSync(file), "hello world");
        throws(() => writeTextFileSync(join(root, "missing", "file"), "", { create: false }));
    });
});
test("writeTextFile honors create and createNew flags with URL paths", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(pathToFileURL(file), "first", { createNew: true });
        await rejects(writeTextFile(file, "second", { createNew: true }));
        await writeTextFile(file, "replacement", { create: false });
        strictEqual(await readTextFile(file), "replacement");
    });
});
test("writeTextFileSync creates only when requested", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        throws(() => writeTextFileSync(file, "", { create: false }));
        writeTextFileSync(file, "first", { createNew: true });
        writeTextFileSync(file, "replacement", { append: false, create: false });
        strictEqual(readTextFileSync(file), "replacement");
        throws(() => writeTextFileSync(file, "second", { createNew: true }));
    });
});
test("writeTextFile accepts streams and abort signals", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue("streamed");
                controller.close();
            },
        });
        await writeTextFile(file, stream);
        strictEqual(await readTextFile(file), "streamed");
        const controller = new AbortController();
        controller.abort();
        await rejects(writeTextFile(join(root, "aborted"), "", { signal: controller.signal }));
    });
});
test("writeTextFile applies generated file modes", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value", { mode: 0o600 });
        strictEqual((await stat(file)).mode & 0o777, 0o600);
    });
});
test("writeTextFileSync applies generated file modes", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value", { mode: 0o600 });
        strictEqual(statSync(file).mode & 0o777, 0o600);
    });
});
test("writeTextFile accepts an active signal and exposes abort names and reasons", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        const active = new AbortController();
        await writeTextFile(file, "value", { signal: active.signal });
        strictEqual(await readTextFile(file), "value");
        const aborted = new AbortController();
        queueMicrotask(() => aborted.abort());
        await rejects(writeTextFile(join(root, "aborted"), "value", { signal: aborted.signal }), (error) => {
            strictEqual(error.name, "AbortError");
            return true;
        });
        const reason = new Error("reason");
        const withReason = new AbortController();
        queueMicrotask(() => withReason.abort(reason));
        await rejects(writeTextFile(join(root, "reason"), "value", { signal: withReason.signal }), (error) => {
            strictEqual(error === reason || error.cause === reason, true);
            return true;
        });
        const primitiveReason = "cancelled";
        const primitive = new AbortController();
        queueMicrotask(() => primitive.abort(primitiveReason));
        await rejects(writeTextFile(join(root, "primitive-reason"), "value", { signal: primitive.signal }), (error) => {
            strictEqual(error === primitiveReason ||
                error.cause === primitiveReason, true);
            return true;
        });
    });
});
test("writeTextFile does not create a path when its signal is already aborted", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "aborted");
        const controller = new AbortController();
        controller.abort();
        await rejects(writeTextFile(file, "value", { signal: controller.signal }), (error) => {
            strictEqual(error.name, "AbortError");
            return true;
        });
        strictEqual(await exists(file), false);
    });
});
test("writeTextFile overwrites generated text when append is false", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "first");
        await writeTextFile(file, "replacement", { append: false });
        strictEqual(await readTextFile(file), "replacement");
    });
});
test("writeTextFileSync appends text and rejects missing parents with default creation", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "first");
        writeTextFileSync(file, " second", { append: true });
        strictEqual(readTextFileSync(file), "first second");
        throws(() => writeTextFileSync(join(root, "missing", "file"), "value"));
    });
});
test("writeTextFileSync changes an existing generated file mode", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "first", { mode: 0o600 });
        writeTextFileSync(file, "replacement", { mode: 0o777 });
        strictEqual(statSync(file).mode & 0o777, 0o777);
    });
});
