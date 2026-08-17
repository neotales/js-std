import { rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { open, openSync } from "./open.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { readTextFile, readTextFileSync } from "./read_text_file.ts";
import { umask } from "./umask.ts";

test("open creates, writes, and reads a generated file", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const writer = await open(file, { createNew: true, write: true });
    try {
      await writer.write(new TextEncoder().encode("value"));
    } finally {
      writer.close();
    }
    strictEqual(await readTextFile(file), "value");
    await rejects(open(file, { createNew: true, write: true }));
  });
});

test("openSync appends to a generated file", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const writer = openSync(file, { create: true, append: true });
    try {
      writer.writeSync(new TextEncoder().encode("value"));
    } finally {
      writer.close();
    }
    strictEqual(readTextFileSync(file), "value");
    throws(() => openSync(file, { append: true, truncate: true, write: true }), TypeError);
  });
});

test("open honors create, truncate, read-only, and URL options", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    let handle = await open(pathToFileURL(file), { create: true, write: true });
    try {
      await handle.write(new TextEncoder().encode("value"));
    } finally {
      handle.close();
    }
    handle = await open(file, { write: true, truncate: true });
    handle.close();
    strictEqual(await readTextFile(file), "");
    await rejects(open(join(root, "missing")));
    await rejects(open(file, { read: false, write: false }));
  });
});

test("openSync supports createNew and validates mutually exclusive flags", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const handle = openSync(file, { createNew: true, write: true });
    handle.close();
    throws(() => openSync(file, { createNew: true, write: true }));
    throws(() => openSync(file, { append: true, truncate: true }));
    throws(() => openSync(join(root, "missing")));
  });
});

test("open rejects create and createNew without a writable mode and preserves overwrite data", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await rejects(open(file, { create: true }));
    await rejects(open(file, { createNew: true }));
    await rejects(open(file, { create: false, write: true }));
    let handle = await open(file, { create: true, write: true });
    await handle.write(new TextEncoder().encode("first"));
    handle.close();
    handle = await open(file, { create: false, write: true });
    await handle.write(new TextEncoder().encode("second"));
    handle.close();
    strictEqual(await readTextFile(file), "second");
  });
});

test("open supports create and repeated append modes", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    await rejects(open(file, { create: true, append: false }));
    for (const [options, value] of [
      [{ create: true, append: true }, "first"],
      [{ write: true, append: true }, " second"],
      [{ append: true }, " third"],
    ] as const) {
      const handle = await open(file, options);
      await handle.write(new TextEncoder().encode(value));
      handle.close();
    }
    strictEqual(await readTextFile(file), "first second third");
  });
});

test("open requires write for truncate and reports empty reads after truncation", async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    const writer = await open(file, { create: true, write: true });
    await writer.write(new TextEncoder().encode("value"));
    writer.close();
    await rejects(open(file, { truncate: true }));
    const truncater = await open(file, { truncate: true, write: true });
    truncater.close();
    const reader = await open(file);
    const bytesRead = await reader.read(new Uint8Array(1));
    reader.close();
    strictEqual(bytesRead, null);
  });
});

test("openSync rejects create and createNew without a writable mode and preserves overwrite data", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    throws(() => openSync(file, { create: true }));
    throws(() => openSync(file, { createNew: true }));
    throws(() => openSync(file, { create: false, write: true }));
    let handle = openSync(file, { create: true, write: true });
    handle.writeSync(new TextEncoder().encode("first"));
    handle.close();
    handle = openSync(file, { create: false, write: true });
    handle.writeSync(new TextEncoder().encode("second"));
    handle.close();
    strictEqual(readTextFileSync(file), "second");
  });
});

test("openSync supports create and repeated append modes", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    throws(() => openSync(file, { create: true, append: false }));
    for (const [options, value] of [
      [{ create: true, append: true }, "first"],
      [{ write: true, append: true }, " second"],
      [{ append: true }, " third"],
    ] as const) {
      const handle = openSync(file, options);
      handle.writeSync(new TextEncoder().encode(value));
      handle.close();
    }
    strictEqual(readTextFileSync(file), "first second third");
  });
});

test("openSync requires write for truncate and reports empty reads after truncation", () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    const writer = openSync(file, { create: true, write: true });
    writer.writeSync(new TextEncoder().encode("value"));
    writer.close();
    throws(() => openSync(file, { truncate: true }));
    const truncater = openSync(file, { truncate: true, write: true });
    truncater.close();
    const reader = openSync(file);
    const bytesRead = reader.readSync(new Uint8Array(1));
    reader.close();
    strictEqual(bytesRead, null);
  });
});

test("open applies a mode only when creating a generated file", { skip: isWindows }, async () => {
  await withTestRoot(async (root) => {
    const file = join(root, "file");
    let handle = await open(file, { createNew: true, write: true, mode: 0o600 });
    const initialMode = (await handle.stat()).mode! & 0o777;
    handle.close();
    handle = await open(file, { write: true, mode: 0o777 });
    strictEqual((await handle.stat()).mode! & 0o777, initialMode);
    handle.close();
  });
});

test("openSync applies a mode only when creating a generated file", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const file = join(root, "file");
    let handle = openSync(file, { createNew: true, write: true, mode: 0o600 });
    const initialMode = handle.statSync().mode! & 0o777;
    handle.close();
    handle = openSync(file, { write: true, mode: 0o777 });
    strictEqual(handle.statSync().mode! & 0o777, initialMode);
    handle.close();
  });
});

test(
  "open applies the requested mode after umask when creating a generated file",
  { skip: isWindows },
  async () => {
    await withTestRoot(async (root) => {
      const file = join(root, "file");
      const previous = umask(0o027);
      try {
        const handle = await open(file, { createNew: true, write: true, mode: 0o666 });
        try {
          strictEqual((await handle.stat()).mode! & 0o777, 0o640);
        } finally {
          handle.close();
        }
      } finally {
        umask(previous);
      }
    });
  },
);

test(
  "openSync applies the requested mode after umask when creating a generated file",
  {
    skip: isWindows,
  },
  () => {
    withTestRootSync((root) => {
      const file = join(root, "file");
      const previous = umask(0o027);
      try {
        const handle = openSync(file, { createNew: true, write: true, mode: 0o666 });
        try {
          strictEqual(handle.statSync().mode! & 0o777, 0o640);
        } finally {
          handle.close();
        }
      } finally {
        umask(previous);
      }
    });
  },
);
