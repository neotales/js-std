import { ok, rejects, throws } from "node:assert/strict";
import { test } from "node:test";
import { dirname } from "node:path";
import { tmpdir } from "node:os";
import { isdir, isdirSync } from "./isdir.ts";
import { mkdtemp, mkdtempSync } from "./mkdtemp.ts";
import { rm, rmSync } from "./rm.ts";
import { withTestRoot, withTestRootSync } from "./_test_helpers.ts";

test("mkdtemp creates a uniquely named directory in a generated root", async () => {
  await withTestRoot(async (root) => {
    const directory = await mkdtemp({ dir: root, prefix: "directory-", suffix: ".tmp" });
    ok(directory.endsWith(".tmp"));
    ok(await isdir(directory));
    await rm(directory, { recursive: true });
  });
});

test("mkdtempSync creates a uniquely named directory in a generated root", () => {
  withTestRootSync((root) => {
    const directory = mkdtempSync({ dir: root, prefix: "directory-", suffix: ".tmp" });
    ok(directory.endsWith(".tmp"));
    ok(isdirSync(directory));
    rmSync(directory, { recursive: true });
  });
});

test("mkdtemp creates distinct generated directories and rejects missing parents", async () => {
  await withTestRoot(async (root) => {
    const first = await mkdtemp({ dir: root, prefix: "temp-" });
    const second = await mkdtemp({ dir: root, prefix: "temp-" });
    ok(first !== second);
    await rejects(mkdtemp({ dir: `${root}/missing` }));
  });
});

test("mkdtempSync rejects missing parents", () => {
  withTestRootSync((root) => throws(() => mkdtempSync({ dir: `${root}/missing` })));
});

test("mkdtemp uses the default temporary directory with generated prefix and suffix", async () => {
  let directory: string | undefined;
  try {
    directory = await mkdtemp({ prefix: "prefix-", suffix: ".suffix" });
    ok(dirname(directory) === tmpdir());
    ok(directory.split(/[/\\]/).at(-1)!.startsWith("prefix-"));
    ok(directory.endsWith(".suffix"));
    ok(await isdir(directory));
  } finally {
    if (directory) await rm(directory, { recursive: true });
  }
});

test("mkdtempSync uses the default temporary directory with generated prefix and suffix", () => {
  let directory: string | undefined;
  try {
    directory = mkdtempSync({ prefix: "prefix-", suffix: ".suffix" });
    ok(dirname(directory) === tmpdir());
    ok(directory.split(/[/\\]/).at(-1)!.startsWith("prefix-"));
    ok(directory.endsWith(".suffix"));
    ok(isdirSync(directory));
  } finally {
    if (directory) rmSync(directory, { recursive: true });
  }
});
