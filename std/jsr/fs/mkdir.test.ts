import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { isdir, isdirSync } from "./isdir.ts";
import { mkdir, mkdirSync } from "./mkdir.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { stat, statSync } from "./stat.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";
import { umask } from "./umask.ts";

test("mkdir creates generated nested directories recursively", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "one", "two");
    await mkdir(directory, { recursive: true });
    strictEqual(await isdir(directory), true);
  });
});

test("mkdirSync rejects an existing directory without recursive", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    mkdirSync(directory);
    strictEqual(isdirSync(directory), true);
    throws(() => mkdirSync(directory));
  });
});

test("mkdir accepts URL paths and recursive creation is idempotent", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "one", "two");
    await mkdir(pathToFileURL(directory), { recursive: true });
    await mkdir(directory, { recursive: true });
    strictEqual(await isdir(directory), true);
    await rejects(mkdir(directory));
  });
});

test("mkdirSync rejects files and supports recursive paths", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    throws(() => mkdirSync(file));
    const directory = join(root, "one", "two");
    mkdirSync(directory, { recursive: true });
    strictEqual(isdirSync(directory), true);
  });
});

test("mkdir applies an explicit mode to generated directories", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await mkdir(directory, { mode: 0o700 });
    strictEqual((await stat(directory)).mode! & 0o777, 0o700);
    await rejects(mkdir(directory));
    await mkdir(directory, { recursive: true, mode: 0o777 });
    strictEqual((await stat(directory)).mode! & 0o777, 0o700);
  });
});

test("mkdir rejects generated links at the destination", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const target = join(root, "target");
    const link = join(root, "link");
    await mkdir(target);
    await symlink(target, link, { type: "dir" });
    await rejects(mkdir(link));
    strictEqual(await isdir(link), true);
  });
});

test("mkdirSync applies an explicit mode to generated directories", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    mkdirSync(directory, { mode: 0o700 });
    strictEqual(statSync(directory).mode! & 0o777, 0o700);
    throws(() => mkdirSync(directory));
    mkdirSync(directory, { recursive: true, mode: 0o777 });
    strictEqual(statSync(directory).mode! & 0o777, 0o700);
  });
});

test("mkdirSync rejects generated links at the destination", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const target = join(root, "target");
    const link = join(root, "link");
    mkdirSync(target);
    symlinkSync(target, link, { type: "dir" });
    throws(() => mkdirSync(link));
    strictEqual(isdirSync(link), true);
  });
});

test("mkdir applies its default mode before the current umask", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    strictEqual((await stat(root)).mode == null, false);
    const mask = umask();
    await mkdir(directory);
    strictEqual((await stat(directory)).mode! & 0o777, 0o777 & ~mask);
  });
});

test("mkdirSync applies its default mode before the current umask", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    strictEqual(statSync(root).mode == null, false);
    const mask = umask();
    mkdirSync(directory);
    strictEqual(statSync(directory).mode! & 0o777, 0o777 & ~mask);
  });
});

test("mkdir rejects recursive file collisions", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await rejects(mkdir(file, { recursive: true }));
  });
});

test("mkdirSync rejects recursive file collisions", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    throws(() => mkdirSync(file, { recursive: true }));
  });
});

test("mkdir rejects dangling links", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const link = join(root, "dangling-link");
    await symlink(join(root, "missing"), link, { type: "dir" });
    await rejects(mkdir(link));
    await rejects(mkdir(link, { recursive: true }));
  });
});

test("mkdirSync rejects dangling links", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const link = join(root, "dangling-link");
    symlinkSync(join(root, "missing"), link, { type: "dir" });
    throws(() => mkdirSync(link));
    throws(() => mkdirSync(link, { recursive: true }));
  });
});
