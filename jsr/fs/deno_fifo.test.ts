import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { isWindows, withTestRoot } from "./_test_helpers.ts";
import { lstat, lstatSync } from "./lstat.ts";
import { walk, walkSync } from "./walk.ts";

type DenoRuntime = {
  Command: new (
    command: string,
    options: { args: string[] },
  ) => { outputSync(): { success: boolean } };
};

const deno = (globalThis as { Deno?: DenoRuntime }).Deno;

test("fs::walk reports generated Unix FIFOs", { skip: !deno || isWindows }, async () => {
  await withTestRoot(async (root) => {
    const fifo = join(root, "pipe");
    strictEqual(new deno!.Command("mkfifo", { args: [fifo] }).outputSync().success, true);

    const asyncEntries = [];
    for await (const entry of walk(root)) asyncEntries.push(entry);
    strictEqual(
      asyncEntries.some((entry) => entry.path === fifo),
      true,
    );
    strictEqual((await lstat(fifo)).isFifo, true);
    strictEqual(
      [...walkSync(root)].some((entry) => entry.path === fifo),
      true,
    );
    strictEqual(lstatSync(fifo).isFifo, true);
  });
});
