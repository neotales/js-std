import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { exists, existsSync } from "./exists.ts";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { move, moveSync } from "./move.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { readTextFile, readTextFileSync } from "./read_text_file.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("move relocates a generated file", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await writeTextFile(source, "value");
    await move(source, destination);
    strictEqual(await exists(source), false);
    strictEqual(await readTextFile(destination), "value");
  });
});

test("moveSync requires overwrite for an existing destination", () => {
  withTestRootSync((root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    writeTextFileSync(source, "value");
    writeTextFileSync(destination, "old");
    throws(() => moveSync(source, destination));
    moveSync(source, destination, { overwrite: true });
    strictEqual(existsSync(source), false);
    strictEqual(readTextFileSync(destination), "value");
  });
});

test("move overwrites generated files and rejects missing and nested sources", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await writeTextFile(source, "new");
    await writeTextFile(destination, "old");
    await rejects(move(source, destination));
    await move(pathToFileURL(source), pathToFileURL(destination), { overwrite: true });
    strictEqual(await readTextFile(destination), "new");
    await rejects(move(join(root, "missing"), join(root, "other")));
  });
});

test("moveSync moves directories and rejects moving into a descendant", () => {
  withTestRootSync((root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    ensureDirSync(source);
    writeTextFileSync(join(root, "file"), "value");
    throws(() => moveSync(join(root, "missing"), destination));
    throws(() => moveSync(source, join(source, "child")));
    moveSync(join(root, "file"), destination);
    strictEqual(readTextFileSync(destination), "value");
  });
});

test("move overwrites generated directories", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await ensureDir(join(source, "nested"));
    await writeTextFile(join(source, "nested", "file"), "source");
    await ensureDir(destination);
    await writeTextFile(join(destination, "old"), "old");
    await rejects(move(source, destination));
    await move(source, destination, { overwrite: true });
    strictEqual(await readTextFile(join(destination, "nested", "file")), "source");
  });
});

test("moveSync overwrites generated directories", () => {
  withTestRootSync((root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    ensureDirSync(join(source, "nested"));
    writeTextFileSync(join(source, "nested", "file"), "source");
    ensureDirSync(destination);
    writeTextFileSync(join(destination, "old"), "old");
    throws(() => moveSync(source, destination));
    moveSync(source, destination, { overwrite: true });
    strictEqual(readTextFileSync(join(destination, "nested", "file")), "source");
  });
});

test("move accepts every string and URL self-file pair when overwrite is enabled", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const url = pathToFileURL(file);
    await writeTextFile(file, "value");
    for (
      const [source, destination] of [
        [file, file],
        [file, url],
        [url, file],
        [url, url],
      ] as const
    ) {
      await move(source, destination, { overwrite: true });
      strictEqual(await readTextFile(file), "value");
    }
  });
});

test("move rejects every string and URL self-directory pair", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    const url = pathToFileURL(directory);
    await ensureDir(directory);
    for (
      const [source, destination] of [
        [directory, directory],
        [directory, url],
        [url, directory],
        [url, url],
      ] as const
    ) {
      await rejects(move(source, destination));
      strictEqual(await exists(directory), true);
    }
  });
});

test("moveSync accepts every string and URL self-file pair when overwrite is enabled", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const url = pathToFileURL(file);
    writeTextFileSync(file, "value");
    for (
      const [source, destination] of [
        [file, file],
        [file, url],
        [url, file],
        [url, url],
      ] as const
    ) {
      moveSync(source, destination, { overwrite: true });
      strictEqual(readTextFileSync(file), "value");
    }
  });
});

test("moveSync rejects every string and URL self-directory pair", () => {
  withTestRootSync((root) => {
    const directory = join(root, "directory");
    const url = pathToFileURL(directory);
    ensureDirSync(directory);
    for (
      const [source, destination] of [
        [directory, directory],
        [directory, url],
        [url, directory],
        [url, url],
      ] as const
    ) {
      throws(() => moveSync(source, destination));
      strictEqual(existsSync(directory), true);
    }
  });
});

test("move relocates a generated directory", async () => {
  await withTestRoot(async (root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    await ensureDir(source);
    await writeTextFile(join(source, "child"), "value");
    await move(source, destination);
    strictEqual(await exists(source), false);
    strictEqual(await readTextFile(join(destination, "child")), "value");
  });
});

test("moveSync relocates a generated directory", () => {
  withTestRootSync((root) => {
    const source = join(root, "source");
    const destination = join(root, "destination");
    ensureDirSync(source);
    writeTextFileSync(join(source, "child"), "value");
    moveSync(source, destination);
    strictEqual(existsSync(source), false);
    strictEqual(readTextFileSync(join(destination, "child")), "value");
  });
});
