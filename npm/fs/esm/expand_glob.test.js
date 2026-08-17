import "./_dnt.test_polyfills.js";
import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join, relative } from "node:path";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { expandGlob, expandGlobSync } from "./expand_glob.js";
import { isWindows, withTestRoot, withTestRootSync } from "./_test_helpers.js";
import { realpath, realpathSync } from "./realpath.js";
import { symlink, symlinkSync } from "./symlink.js";
import { writeTextFile, writeTextFileSync } from "./write_text_file.js";
test("expandGlob matches generated nested names and exclusions", async () => {
    await withTestRoot(async (root) => {
        await ensureDir(join(root, "nested"));
        await writeTextFile(join(root, "main.ts"), "");
        await writeTextFile(join(root, "nested", "child.ts"), "");
        await writeTextFile(join(root, "nested", "note.md"), "");
        const paths = (await Array.fromAsync(expandGlob("**/*.ts", { exclude: ["nested/**"], root })))
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(paths, ["main.ts"]);
    });
});
test("expandGlobSync matches generated nested names", () => {
    withTestRootSync((root) => {
        ensureDirSync(join(root, "nested"));
        writeTextFileSync(join(root, "nested", "child.ts"), "");
        writeTextFileSync(join(root, "nested", "note.md"), "");
        const paths = [...expandGlobSync("**/*.ts", { includeDirs: false, root })]
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(paths, [join("nested", "child.ts")]);
    });
});
test("expandGlob handles trailing separators and globstar", async () => {
    await withTestRoot(async (root) => {
        await ensureDir(join(root, "one", "two"));
        await writeTextFile(join(root, "one", "file.ts"), "");
        await writeTextFile(join(root, "one", "two", "file.ts"), "");
        const directories = (await Array.fromAsync(expandGlob("**/", { root })))
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(directories, ["", "one", join("one", "two")]);
        const oneLevel = (await Array.fromAsync(expandGlob("**/*.ts", { globstar: false, root })))
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(oneLevel, [join("one", "file.ts")]);
    });
});
test("expandGlobSync includes literal paths and can exclude directories", () => {
    withTestRootSync((root) => {
        ensureDirSync(join(root, "nested"));
        writeTextFileSync(join(root, "root.ts"), "");
        writeTextFileSync(join(root, "nested", "child.ts"), "");
        deepStrictEqual([...expandGlobSync("root.ts", { root })].map(({ path }) => relative(root, path)), ["root.ts"]);
        deepStrictEqual([...expandGlobSync("**/*.ts", { exclude: ["nested/**"], root })].map(({ path }) => relative(root, path)), ["root.ts"]);
    });
});
test("expandGlob supports parent patterns and extended matching", async () => {
    await withTestRoot(async (root) => {
        await ensureDir(join(root, "nested"));
        await writeTextFile(join(root, "one.ts"), "");
        await writeTextFile(join(root, "two.ts"), "");
        deepStrictEqual((await Array.fromAsync(expandGlob("nested/../*.ts", { root })))
            .map(({ path }) => relative(root, path))
            .sort(), ["one.ts", "two.ts"]);
        deepStrictEqual((await Array.fromAsync(expandGlob("@(one|two).ts", { extended: true, root })))
            .map(({ path }) => relative(root, path))
            .sort(), ["one.ts", "two.ts"]);
    });
});
test("expandGlobSync supports parent patterns and extended matching", () => {
    withTestRootSync((root) => {
        ensureDirSync(join(root, "nested"));
        writeTextFileSync(join(root, "one.ts"), "");
        writeTextFileSync(join(root, "two.ts"), "");
        deepStrictEqual([...expandGlobSync("nested/../*.ts", { root })]
            .map(({ path }) => relative(root, path))
            .sort(), ["one.ts", "two.ts"]);
        deepStrictEqual([...expandGlobSync("@(one|two).ts", { extended: true, root })]
            .map(({ path }) => relative(root, path))
            .sort(), ["one.ts", "two.ts"]);
    });
});
test("expandGlob honors each extended operator with generated names", async () => {
    await withTestRoot(async (root) => {
        for (const file of ["abc", "abcdef", "abcdefghi"]) {
            await writeTextFile(join(root, file), "");
        }
        const paths = async (pattern) => (await Array.fromAsync(expandGlob(pattern, { extended: true, root })))
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(await paths("abc?(def|ghi)"), ["abc", "abcdef"]);
        deepStrictEqual(await paths("abc*(def|ghi)"), ["abc", "abcdef", "abcdefghi"]);
        deepStrictEqual(await paths("abc+(def|ghi)"), ["abcdef", "abcdefghi"]);
        deepStrictEqual(await paths("abc@(def|ghi)"), ["abcdef"]);
        deepStrictEqual(await paths("abc{def,ghi}"), ["abcdef"]);
        deepStrictEqual(await paths("abc!(def|ghi)"), ["abc"]);
    });
});
test("expandGlobSync honors each extended operator with generated names", () => {
    withTestRootSync((root) => {
        for (const file of ["abc", "abcdef", "abcdefghi"]) {
            writeTextFileSync(join(root, file), "");
        }
        const paths = (pattern) => [...expandGlobSync(pattern, { extended: true, root })]
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(paths("abc?(def|ghi)"), ["abc", "abcdef"]);
        deepStrictEqual(paths("abc*(def|ghi)"), ["abc", "abcdef", "abcdefghi"]);
        deepStrictEqual(paths("abc+(def|ghi)"), ["abcdef", "abcdefghi"]);
        deepStrictEqual(paths("abc@(def|ghi)"), ["abcdef"]);
        deepStrictEqual(paths("abc{def,ghi}"), ["abcdef"]);
        deepStrictEqual(paths("abc!(def|ghi)"), ["abc"]);
    });
});
test("expandGlob returns the root for a non-globstar pattern when globstar is disabled", async () => {
    await withTestRoot(async (root) => {
        await ensureDir(join(root, "directory"));
        await writeTextFile(join(root, "file"), "");
        const paths = (await Array.fromAsync(expandGlob("**", { globstar: false, root })))
            .map(({ path }) => relative(root, path) || ".")
            .sort();
        deepStrictEqual(paths, [".", "directory", "file"]);
    });
});
test("expandGlobSync returns the root for a non-globstar pattern when globstar is disabled", () => {
    withTestRootSync((root) => {
        ensureDirSync(join(root, "directory"));
        writeTextFileSync(join(root, "file"), "");
        const paths = [...expandGlobSync("**", { globstar: false, root })]
            .map(({ path }) => relative(root, path) || ".")
            .sort();
        deepStrictEqual(paths, [".", "directory", "file"]);
    });
});
test("expandGlob handles trailing directories, parent globstars, excludes, and narrowed roots", async () => {
    await withTestRoot(async (root) => {
        const nested = join(root, "nested");
        const directories = join(root, "directories");
        const narrow = join(root, "narrow");
        await ensureDir(join(directories, "child"));
        await ensureDir(nested);
        await ensureDir(narrow);
        await writeTextFile(join(root, "literal.ts"), "");
        await writeTextFile(join(root, "outside.ts"), "");
        await writeTextFile(join(narrow, "inside.ts"), "");
        deepStrictEqual((await Array.fromAsync(expandGlob("directories/*/", { root }))).map(({ path }) => relative(root, path)), [join("directories", "child")]);
        deepStrictEqual((await Array.fromAsync(expandGlob("nested/../**/*.ts", { root })))
            .map(({ path }) => relative(root, path))
            .sort(), ["literal.ts", join("narrow", "inside.ts"), "outside.ts"]);
        deepStrictEqual(await Array.fromAsync(expandGlob("literal.ts", { exclude: ["literal.ts"], root })), []);
        deepStrictEqual((await Array.fromAsync(expandGlob("**/*.ts", { root: narrow }))).map(({ path }) => relative(narrow, path)), ["inside.ts"]);
    });
});
test("expandGlobSync handles trailing directories, parent globstars, excludes, and narrowed roots", () => {
    withTestRootSync((root) => {
        const nested = join(root, "nested");
        const directories = join(root, "directories");
        const narrow = join(root, "narrow");
        ensureDirSync(join(directories, "child"));
        ensureDirSync(nested);
        ensureDirSync(narrow);
        writeTextFileSync(join(root, "literal.ts"), "");
        writeTextFileSync(join(root, "outside.ts"), "");
        writeTextFileSync(join(narrow, "inside.ts"), "");
        deepStrictEqual([...expandGlobSync("directories/*/", { root })].map(({ path }) => relative(root, path)), [join("directories", "child")]);
        deepStrictEqual([...expandGlobSync("nested/../**/*.ts", { root })]
            .map(({ path }) => relative(root, path))
            .sort(), ["literal.ts", join("narrow", "inside.ts"), "outside.ts"]);
        deepStrictEqual([...expandGlobSync("literal.ts", { exclude: ["literal.ts"], root })], []);
        deepStrictEqual([...expandGlobSync("**/*.ts", { root: narrow })].map(({ path }) => relative(narrow, path)), ["inside.ts"]);
    });
});
test("expandGlob accepts a generated symlink as its root", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await ensureDir(target);
        await writeTextFile(join(target, "child.ts"), "");
        await symlink(target, link, { type: "dir" });
        deepStrictEqual((await Array.fromAsync(expandGlob("**/*.ts", { root: link }))).map(({ path }) => relative(link, path)), ["child.ts"]);
    });
});
test("expandGlobSync accepts a generated symlink as its root", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        ensureDirSync(target);
        writeTextFileSync(join(target, "child.ts"), "");
        symlinkSync(target, link, { type: "dir" });
        deepStrictEqual([...expandGlobSync("**/*.ts", { root: link })].map(({ path }) => relative(link, path)), ["child.ts"]);
    });
});
test("expandGlob follows generated links with and without canonical paths", { skip: isWindows }, async () => {
    await withTestRoot(async (root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        await ensureDir(target);
        await writeTextFile(join(target, "abc"), "");
        await symlink(target, link, { type: "dir" });
        const canonical = (await Array.fromAsync(expandGlob("**/abc", { followSymlinks: true, root })))
            .map(({ path }) => path)
            .sort();
        deepStrictEqual(canonical, [await realpath(join(target, "abc"))]);
        const linkPaths = (await Array.fromAsync(expandGlob("**/abc", { canonicalize: false, followSymlinks: true, root })))
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(linkPaths, [join("link", "abc"), join("target", "abc")]);
    });
});
test("expandGlobSync follows generated links with and without canonical paths", { skip: isWindows }, () => {
    withTestRootSync((root) => {
        const target = join(root, "target");
        const link = join(root, "link");
        ensureDirSync(target);
        writeTextFileSync(join(target, "abc"), "");
        symlinkSync(target, link, { type: "dir" });
        const canonical = [...expandGlobSync("**/abc", { followSymlinks: true, root })]
            .map(({ path }) => path)
            .sort();
        deepStrictEqual(canonical, [realpathSync(join(target, "abc"))]);
        const linkPaths = [
            ...expandGlobSync("**/abc", { canonicalize: false, followSymlinks: true, root }),
        ]
            .map(({ path }) => relative(root, path))
            .sort();
        deepStrictEqual(linkPaths, [join("link", "abc"), join("target", "abc")]);
    });
});
