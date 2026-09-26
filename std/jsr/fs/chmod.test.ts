import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chmod, chmodSync } from "./chmod.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { mkdir, mkdirSync } from "./mkdir.ts";
import { stat, statSync } from "./stat.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("chmod changes file modes", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await chmod(file, 0o640);
    strictEqual((await stat(file)).mode! & 0o777, 0o640);
  });
});

test("chmodSync changes file modes", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    chmodSync(file, 0o600);
    strictEqual(statSync(file).mode! & 0o777, 0o600);
  });
});

test("chmod accepts URLs and rejects missing paths", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await chmod(pathToFileURL(file), 0o600);
    strictEqual((await stat(file)).mode! & 0o777, 0o600);
    await rejects(chmod(join(root, "missing"), 0o600));
  });
});

test("chmodSync rejects missing paths", { skip: isWindows }, () => {
  withTestRootSync((root) => throws(() => chmodSync(join(root, "missing"), 0o600)));
});

test("chmod changes generated directories and follows links", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    const file = join(root, "file");
    const link = join(root, "link");
    await mkdir(directory, { mode: 0o700 });
    await writeTextFile(file, "value");
    await symlink(file, link);
    await chmod(directory, 0o500);
    await chmod(link, 0o200);
    strictEqual((await stat(directory)).mode! & 0o777, 0o500);
    strictEqual((await stat(file)).mode! & 0o777, 0o200);
  });
});

test("chmodSync changes generated directories and follows links", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    const file = join(root, "file");
    const link = join(root, "link");
    mkdirSync(directory, { mode: 0o700 });
    writeTextFileSync(file, "value");
    symlinkSync(file, link);
    chmodSync(directory, 0o500);
    chmodSync(link, 0o200);
    strictEqual(statSync(directory).mode! & 0o777, 0o500);
    strictEqual(statSync(file).mode! & 0o777, 0o200);
  });
});
