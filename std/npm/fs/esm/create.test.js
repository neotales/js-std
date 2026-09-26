import "./_dnt.test_polyfills.js";
import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { create, createSync } from "./create.js";
import { withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { readTextFile, readTextFileSync } from "./read_text_file.js";
import { stat, statSync } from "./stat.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("create truncates a generated file", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        await writeTextFile(file, "value");
        (await create(file)).close();
        strictEqual(await readTextFile(file), "");
    });
});
test("createSync truncates a generated file", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        writeTextFileSync(file, "value");
        createSync(file).close();
        strictEqual(readTextFileSync(file), "");
    });
});
test("create makes empty URL-addressed files and rejects directories", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "new");
        (await create(pathToFileURL(file))).close();
        strictEqual(await readTextFile(file), "");
        await rejects(create(root));
    });
});
test("createSync makes empty files and rejects directories", () => {
    withTestRootSync((root) => {
        const file = join(root, "new");
        createSync(file).close();
        strictEqual(readTextFileSync(file), "");
        throws(() => createSync(root));
    });
});
test("create returns a writable handle whose stat reports generated data", async () => {
    await withTestRoot(async (root) => {
        const file = join(root, "file");
        const handle = await create(file);
        try {
            await handle.write(new TextEncoder().encode("value"));
            strictEqual((await handle.stat()).size, 5);
        }
        finally {
            handle.close();
        }
        strictEqual((await stat(file)).size, 5);
    });
});
test("createSync returns a writable handle whose stat reports generated data", () => {
    withTestRootSync((root) => {
        const file = join(root, "file");
        const handle = createSync(file);
        try {
            handle.writeSync(new TextEncoder().encode("value"));
            strictEqual(handle.statSync().size, 5);
        }
        finally {
            handle.close();
        }
        strictEqual(statSync(file).size, 5);
    });
});
