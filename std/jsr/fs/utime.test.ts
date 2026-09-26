import { ok, rejects, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { stat, statSync } from "./stat.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { utime, utimeSync } from "./utime.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("utime sets generated file access and modification timestamps", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const atime = new Date("2001-02-03T04:05:06Z");
    const mtime = new Date("2002-03-04T05:06:07Z");
    await writeTextFile(file, "value");
    await utime(file, atime, mtime);
    const info = await stat(file);
    ok(Math.abs(info.atime!.getTime() - atime.getTime()) < 1000);
    ok(Math.abs(info.mtime!.getTime() - mtime.getTime()) < 1000);
  });
});

test("utimeSync sets generated file access and modification timestamps", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const atime = new Date("2001-02-03T04:05:06Z");
    const mtime = new Date("2002-03-04T05:06:07Z");
    writeTextFileSync(file, "value");
    utimeSync(file, atime, mtime);
    const info = statSync(file);
    ok(Math.abs(info.atime!.getTime() - atime.getTime()) < 1000);
    ok(Math.abs(info.mtime!.getTime() - mtime.getTime()) < 1000);
  });
});

test("utime accepts URL paths and rejects missing files", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await utime(pathToFileURL(file), 1, 2);
    ok((await stat(file)).mtime!.getTime() < 10_000);
    await rejects(utime(join(root, "missing"), 1, 2));
  });
});

test("utimeSync rejects missing files", () => {
  withTestRootSync((root) => throws(() => utimeSync(join(root, "missing"), 1, 2)));
});
