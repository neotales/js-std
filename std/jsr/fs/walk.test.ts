import { deepStrictEqual, rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { join, relative } from "node:path";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.ts";
import { rm } from "./rm.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { walk, walkSync } from "./walk.ts";
import { writeTextFile, writeTextFileSync } from "./write_text_file.ts";

test("walk filters generated nested trees", async () => {
  await withTestRoot(async (root) => {
    await ensureDir(join(root, "nested"));
    await writeTextFile(join(root, "main.ts"), "");
    await writeTextFile(join(root, "nested", "child.ts"), "");
    await writeTextFile(join(root, "nested", "note.md"), "");
    const paths = (await Array.fromAsync(walk(root, { exts: ["ts"], includeDirs: false })))
      .map(({ path }) => relative(root, path))
      .sort();
    deepStrictEqual(paths, ["main.ts", join("nested", "child.ts")]);
  });
});

test("walk returns exactly its empty generated root", async () => {
  await withTestRoot(async (root) => {
    deepStrictEqual(
      (await Array.fromAsync(walk(root))).map(({ path }) => path),
      [root],
    );
  });
});

test("walkSync returns exactly its empty generated root", () => {
  withTestRootSync((root) => {
    deepStrictEqual(
      [...walkSync(root)].map(({ path }) => path),
      [root],
    );
  });
});

test("walkSync observes generated depth limits", () => {
  withTestRootSync((root) => {
    ensureDirSync(join(root, "nested"));
    writeTextFileSync(join(root, "nested", "child.ts"), "");
    deepStrictEqual(
      [...walkSync(root, { maxDepth: 1 })].map(({ path }) => relative(root, path) || ".").sort(),
      [".", "nested"],
    );
  });
});

test("walk applies depth, file, directory, match, and skip filters", async () => {
  await withTestRoot(async (root) => {
    await ensureDir(join(root, "nested", "deep"));
    await writeTextFile(join(root, "root.ts"), "");
    await writeTextFile(join(root, "nested", "child.rs"), "");
    await writeTextFile(join(root, "nested", "deep", "skip.ts"), "");
    const files = (await Array.fromAsync(walk(root, { includeDirs: false, maxDepth: 2 })))
      .map(({ path }) => relative(root, path))
      .sort();
    deepStrictEqual(files, [join("nested", "child.rs"), "root.ts"]);
    const matched = (await Array.fromAsync(walk(root, { match: [/\.ts$/], skip: [/deep/] })))
      .map(({ path }) => relative(root, path))
      .sort();
    deepStrictEqual(matched, ["root.ts"]);
    await rejects(Array.fromAsync(walk(join(root, "missing"))));
  });
});

test("walkSync supports extension and file/directory filters", () => {
  withTestRootSync((root) => {
    ensureDirSync(join(root, "nested"));
    writeTextFileSync(join(root, "root.ts"), "");
    writeTextFileSync(join(root, "nested", "child.md"), "");
    deepStrictEqual(
      [...walkSync(root, { exts: ["ts"], includeDirs: false })]
        .map(({ path }) => relative(root, path))
        .sort(),
      ["root.ts"],
    );
    deepStrictEqual(
      [...walkSync(root, { includeFiles: false })]
        .map(({ path }) => relative(root, path) || ".")
        .sort(),
      [".", "nested"],
    );
    throws(() => [...walkSync(join(root, "missing"))]);
  });
});

test("walk excludes generated files when requested", async () => {
  await withTestRoot(async (root) => {
    await ensureDir(join(root, "nested"));
    await writeTextFile(join(root, "file"), "value");
    deepStrictEqual(
      (await Array.fromAsync(walk(root, { includeFiles: false })))
        .map(({ path }) => relative(root, path) || ".")
        .sort(),
      [".", "nested"],
    );
  });
});

test("walk accepts generated extension variants", async () => {
  await withTestRoot(async (root) => {
    await writeTextFile(join(root, "file.ts"), "");
    await writeTextFile(join(root, "file.md"), "");
    for (const extension of ["ts", ".ts"]) {
      deepStrictEqual(
        (await Array.fromAsync(walk(root, { exts: [extension], includeDirs: false }))).map(
          ({ path }) => relative(root, path),
        ),
        ["file.ts"],
      );
    }
  });
});

test("walkSync skips generated paths matching a regular expression", () => {
  withTestRootSync((root) => {
    ensureDirSync(join(root, "skip"));
    writeTextFileSync(join(root, "keep.ts"), "");
    writeTextFileSync(join(root, "skip", "ignored.ts"), "");
    deepStrictEqual(
      [...walkSync(root, { includeDirs: false, skip: [/skip/] })].map(({ path }) =>
        relative(root, path)
      ),
      ["keep.ts"],
    );
  });
});

test(
  "walk follows generated directory links only when requested",
  { skip: isWindows },
  async () => {
    await withTestRoot(async (root) => {
      const target = join(root, "target");
      const link = join(root, "link");
      await ensureDir(target);
      await writeTextFile(join(target, "child"), "value");
      await symlink(target, link, { type: "dir" });
      const withoutFollowing = await Array.fromAsync(walk(root, { followSymlinks: false }));
      const canonical = await Array.fromAsync(walk(root, { followSymlinks: true }));
      const following = await Array.fromAsync(
        walk(root, { followSymlinks: true, canonicalize: false }),
      );
      strictEqual(
        withoutFollowing.some(({ path }) => path === join(link, "child")),
        false,
      );
      strictEqual(
        following.some(({ path }) => path === join(link, "child")),
        true,
      );
      strictEqual(
        withoutFollowing.some(({ path }) => path === link),
        true,
      );
      strictEqual(withoutFollowing.find(({ path }) => path === link)?.isSymlink, true);
      strictEqual(
        canonical.some(({ path }) => path === join(link, "child")),
        false,
      );
    });
  },
);

test("walkSync follows generated directory links only when requested", { skip: isWindows }, () => {
  withTestRootSync((root) => {
    const target = join(root, "target");
    const link = join(root, "link");
    ensureDirSync(target);
    writeTextFileSync(join(target, "child"), "value");
    symlinkSync(target, link, { type: "dir" });
    const withoutFollowing = [...walkSync(root, { followSymlinks: false })];
    const canonical = [...walkSync(root, { followSymlinks: true })];
    const following = [...walkSync(root, { canonicalize: false, followSymlinks: true })];
    strictEqual(
      withoutFollowing.some(({ path }) => path === join(link, "child")),
      false,
    );
    strictEqual(
      following.some(({ path }) => path === join(link, "child")),
      true,
    );
    strictEqual(
      withoutFollowing.some(({ path }) => path === link),
      true,
    );
    strictEqual(withoutFollowing.find(({ path }) => path === link)?.isSymlink, true);
    strictEqual(
      canonical.some(({ path }) => path === join(link, "child")),
      false,
    );
  });
});

test("walk supports period-prefixed and regular-expression extensions", async () => {
  await withTestRoot(async (root) => {
    await ensureDir(join(root, "nested"));
    await writeTextFile(join(root, "root.ts"), "");
    await writeTextFile(join(root, "nested", "child.md"), "");
    deepStrictEqual(
      (await Array.fromAsync(walk(root, { match: [/\.ts$/], includeDirs: false })))
        .map(({ path }) => relative(root, path))
        .sort(),
      ["root.ts"],
    );
  });
});

test("walkSync supports period-prefixed and regular-expression extensions", () => {
  withTestRootSync((root) => {
    ensureDirSync(join(root, "nested"));
    writeTextFileSync(join(root, "root.ts"), "");
    writeTextFileSync(join(root, "nested", "child.md"), "");
    deepStrictEqual(
      [...walkSync(root, { exts: [".ts"], includeDirs: false })]
        .map(({ path }) => relative(root, path))
        .sort(),
      ["root.ts"],
    );
    deepStrictEqual(
      [...walkSync(root, { match: [/\.md$/], includeDirs: false })]
        .map(({ path }) => relative(root, path))
        .sort(),
      [join("nested", "child.md")],
    );
  });
});

test("walk rejects when its generated root is removed during iteration", async () => {
  await withTestRoot(async (root) => {
    const directory = join(root, "directory");
    await ensureDir(directory);
    await rejects(
      Array.fromAsync(walk(directory), async () => await rm(directory, { recursive: true })),
    );
  });
});
