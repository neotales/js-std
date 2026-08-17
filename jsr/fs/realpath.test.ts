import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { realpath, realpathSync } from "./realpath.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("realpath resolves a generated symlink", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const target = join(root, "target");
    const link = join(root, "link");
    await writeTextFile(target, "value");
    await symlink(target, link);
    strictEqual(await realpath(link), await realpath(target));
  });
});

test("realpathSync resolves a generated symlink", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const target = join(root, "target");
    const link = join(root, "link");
    writeTextFileSync(target, "value");
    symlinkSync(target, link);
    strictEqual(realpathSync(link), realpathSync(target));
  });
});

test("realpath accepts URL paths and rejects missing files", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    strictEqual(await realpath(pathToFileURL(file)), await realpath(file));
    await rejects(realpath(join(root, "missing")));
  });
});

test("realpathSync rejects missing files", () => {
  withTestRootSync((root) => throws(() => realpathSync(join(root, "missing"))));
});

test("realpath resolves a generated relative string path", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    strictEqual(await realpath(relative(process.cwd(), file)), await realpath(file));
  });
});

test("realpathSync resolves a generated relative string path", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    strictEqual(realpathSync(relative(process.cwd(), file)), realpathSync(file));
  });
});
