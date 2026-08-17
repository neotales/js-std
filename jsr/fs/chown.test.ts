import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { chown, chownSync } from "./chown.ts";
import { gid } from "./gid.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { stat, statSync } from "./stat.ts";
import { uid } from "./uid.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

const isBun = typeof (globalThis as { Bun?: unknown }).Bun !== "undefined";

test("chown accepts the current owner", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    const currentUid = uid();
    const currentGid = gid();
    await chown(file, currentUid, currentGid);
    strictEqual((await stat(file)).uid, currentUid);
    strictEqual((await stat(file)).gid, currentGid);
  });
});

test("chownSync accepts the current owner", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    const currentUid = uid();
    const currentGid = gid();
    chownSync(file, currentUid, currentGid);
    strictEqual(statSync(file).uid, currentUid);
    strictEqual(statSync(file).gid, currentGid);
  });
});

test("chown accepts URLs and rejects missing paths", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    await chown(pathToFileURL(file), uid(), gid());
    await rejects(chown(join(root, "missing"), uid(), gid()));
  });
});

test("chownSync rejects missing paths", { skip: isWindows }, () => {
  withTestRootSync((root) => throws(() => chownSync(join(root, "missing"), uid(), gid())));
});

test("chown accepts null owner and group ids", { skip: isWindows || isBun }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await writeTextFile(file, "value");
    const before = await stat(file);
    const currentUid = uid();
    const currentGid = gid();
    await chown(file, currentUid, null);
    await chown(file, null, currentGid);
    strictEqual((await stat(file)).uid, before.uid);
    strictEqual((await stat(file)).gid, before.gid);
  });
});

test("chownSync accepts null owner and group ids", { skip: isWindows || isBun }, () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    writeTextFileSync(file, "value");
    const before = statSync(file);
    const currentUid = uid();
    const currentGid = gid();
    chownSync(file, currentUid, null);
    chownSync(file, null, currentGid);
    strictEqual(statSync(file).uid, before.uid);
    strictEqual(statSync(file).gid, before.gid);
  });
});

test(
  "chown rejects changing ownership when the runtime user is deterministically unprivileged",
  { skip: isWindows || uid() === null || uid() === 0 },
  async () => {
    await withTestRoot(async (root) => {
      const file = join(root, "file");
      const currentUid = uid()!;
      await writeTextFile(file, "value");
      await rejects(chown(file, currentUid + 1, gid()));
    });
  },
);

test(
  "chownSync rejects changing ownership when the runtime user is deterministically unprivileged",
  { skip: isWindows || uid() === null || uid() === 0 },
  () => {
    withTestRootSync((root) => {
      const file = join(root, "file");
      const currentUid = uid()!;
      writeTextFileSync(file, "value");
      throws(() => chownSync(file, currentUid + 1, gid()));
    });
  },
);
