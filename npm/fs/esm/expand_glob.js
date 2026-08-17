/**
 * The `expand-glob` module provides functions to expand glob patterns
 * asynchronously and synchronously.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { WIN } from "./globals.js";
import { globToRegExp, isAbsolute, isGlob, joinGlobs, resolve, SEPARATOR_PATTERN, } from "@neotales/path";
import { walk, walkSync } from "./walk.js";
import { cwd } from "./cwd.js";
import { toPathString } from "./utils.js";
import { createWalkEntry, createWalkEntrySync } from "./utils.js";
import { isNotFoundError } from "./errors.js";
function split(path) {
    const s = SEPARATOR_PATTERN.source;
    const segments = path.replace(new RegExp(`^${s}|${s}$`, "g"), "").split(SEPARATOR_PATTERN);
    const pathIsAbsolute = isAbsolute(path);
    return {
        segments,
        isAbsolute: pathIsAbsolute,
        hasTrailingSep: !!path.match(new RegExp(`${s}$`)),
        winRoot: WIN && pathIsAbsolute ? segments.shift() : undefined,
    };
}
function throwUnlessNotFound(error) {
    if (!isNotFoundError(error)) {
        throw error;
    }
}
function comparePath(a, b) {
    if (a.path < b.path)
        return -1;
    if (a.path > b.path)
        return 1;
    return 0;
}
/**
 * Returns an async iterator that yields each file path matching the given glob
 * pattern. The file paths are relative to the provided `root` directory.
 * If `root` is not provided, the current working directory is used.
 * The `root` directory is not included in the yielded file paths.
 *
 * Requires the `--allow-read` flag when using Deno.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 * @returns An async iterator that yields each walk entry matching the glob
 * pattern.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts
 * // script.ts
 * import { expandGlob } from "@neotales/fs";
 *
 * const entries = [];
 * for await (const entry of expandGlob("*.ts")) {
 *   entries.push(entry);
 * }
 *
 * entries[0]!.path; // "/Users/user/folder/script.ts"
 * entries[0]!.name; // "script.ts"
 * entries[0]!.isFile; // false
 * entries[0]!.isDirectory; // true
 * entries[0]!.isSymlink; // false
 *
 * entries[1]!.path; // "/Users/user/folder/foo.ts"
 * entries[1]!.name; // "foo.ts"
 * entries[1]!.isFile; // true
 * entries[1]!.isDirectory; // false
 * entries[1]!.isSymlink; // false
 * ```
 */
export async function* expandGlob(glob, { root, exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive, followSymlinks, canonicalize, } = {}) {
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot, } = split(toPathString(glob));
    root ??= isGlobAbsolute ? (winRoot ?? "/") : cwd();
    const globOptions = { extended, globstar, caseInsensitive };
    const absRoot = isGlobAbsolute ? root : resolve(root); // root is always string here
    const resolveFromRoot = (path) => resolve(absRoot, path);
    const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => globToRegExp(s, globOptions));
    const shouldInclude = (path) => !excludePatterns.some((p) => !!path.match(p));
    let fixedRoot = isGlobAbsolute ? (winRoot !== undefined ? winRoot : "/") : absRoot;
    while (segments.length > 0 && !isGlob(segments[0])) {
        const seg = segments.shift();
        if (seg === undefined) {
            throw new Error("seg is undefined");
        }
        fixedRoot = joinGlobs([fixedRoot, seg], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = await createWalkEntry(fixedRoot);
    }
    catch (error) {
        return throwUnlessNotFound(error);
    }
    async function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        }
        else if (globSegment === "..") {
            const parentPath = joinGlobs([walkInfo.path, ".."], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield await createWalkEntry(parentPath);
                }
            }
            catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        }
        else if (globSegment === "**") {
            return yield* walk(walkInfo.path, {
                skip: excludePatterns,
                maxDepth: globstar ? Infinity : 1,
                followSymlinks,
                canonicalize,
            });
        }
        const globPattern = globToRegExp(globSegment, globOptions);
        for await (const walkEntry of walk(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
            followSymlinks,
        })) {
            if (walkEntry.path !== walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [fixedRootInfo];
    for (const segment of segments) {
        // Advancing the list of current matches may introduce duplicates, so we
        // pass everything through this Map.
        const nextMatchMap = new Map();
        await Promise.all(currentMatches.map(async (currentMatch) => {
            for await (const nextMatch of advanceMatch(currentMatch, segment)) {
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }));
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
    }
    currentMatches = currentMatches.filter((entry) => shouldInclude(entry.path));
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
    }
    yield* currentMatches;
}
/**
 * Returns an iterator that yields each file path matching the given glob
 * pattern. The file paths are relative to the provided `root` directory.
 * If `root` is not provided, the current working directory is used.
 * The `root` directory is not included in the yielded file paths.
 *
 * Requires the `--allow-read` flag when using Deno.
 *
 * @param glob The glob pattern to expand.
 * @param options Additional options for the expansion.
 * @returns An iterator that yields each walk entry matching the glob pattern.
 *
 * @example Basic usage
 *
 * File structure:
 * ```
 * folder
 * ├── script.ts
 * └── foo.ts
 * ```
 *
 * ```ts
 * // script.ts
 * import { expandGlobSync } from "@neotales/fs";
 *
 * const entries = [];
 * for (const entry of expandGlobSync("*.ts")) {
 *   entries.push(entry);
 * }
 *
 * entries[0]!.path; // "/Users/user/folder/script.ts"
 * entries[0]!.name; // "script.ts"
 * entries[0]!.isFile; // false
 * entries[0]!.isDirectory; // true
 * entries[0]!.isSymlink; // false
 *
 * entries[1]!.path; // "/Users/user/folder/foo.ts"
 * entries[1]!.name; // "foo.ts"
 * entries[1]!.isFile; // true
 * entries[1]!.isDirectory; // false
 * entries[1]!.isSymlink; // false
 * ```
 */
export function* expandGlobSync(glob, { root, exclude = [], includeDirs = true, extended = true, globstar = true, caseInsensitive, followSymlinks, canonicalize, } = {}) {
    const { segments, isAbsolute: isGlobAbsolute, hasTrailingSep, winRoot, } = split(toPathString(glob));
    root ??= isGlobAbsolute ? (winRoot ?? "/") : cwd();
    const globOptions = { extended, globstar, caseInsensitive };
    const absRoot = isGlobAbsolute ? root : resolve(root); // root is always string here
    const resolveFromRoot = (path) => resolve(absRoot, path);
    const excludePatterns = exclude
        .map(resolveFromRoot)
        .map((s) => globToRegExp(s, globOptions));
    const shouldInclude = (path) => !excludePatterns.some((p) => !!path.match(p));
    let fixedRoot = isGlobAbsolute ? (winRoot !== undefined ? winRoot : "/") : absRoot;
    while (segments.length > 0 && !isGlob(segments[0])) {
        const seg = segments.shift();
        if (seg === undefined) {
            throw new Error("seg is undefined");
        }
        fixedRoot = joinGlobs([fixedRoot, seg], globOptions);
    }
    let fixedRootInfo;
    try {
        fixedRootInfo = createWalkEntrySync(fixedRoot);
    }
    catch (error) {
        return throwUnlessNotFound(error);
    }
    function* advanceMatch(walkInfo, globSegment) {
        if (!walkInfo.isDirectory) {
            return;
        }
        else if (globSegment === "..") {
            const parentPath = joinGlobs([walkInfo.path, ".."], globOptions);
            try {
                if (shouldInclude(parentPath)) {
                    return yield createWalkEntrySync(parentPath);
                }
            }
            catch (error) {
                throwUnlessNotFound(error);
            }
            return;
        }
        else if (globSegment === "**") {
            return yield* walkSync(walkInfo.path, {
                skip: excludePatterns,
                maxDepth: globstar ? Infinity : 1,
                followSymlinks,
                canonicalize,
            });
        }
        const globPattern = globToRegExp(globSegment, globOptions);
        for (const walkEntry of walkSync(walkInfo.path, {
            maxDepth: 1,
            skip: excludePatterns,
            followSymlinks,
        })) {
            if (walkEntry.path !== walkInfo.path && walkEntry.name.match(globPattern)) {
                yield walkEntry;
            }
        }
    }
    let currentMatches = [fixedRootInfo];
    for (const segment of segments) {
        // Advancing the list of current matches may introduce duplicates, so we
        // pass everything through this Map.
        const nextMatchMap = new Map();
        for (const currentMatch of currentMatches) {
            for (const nextMatch of advanceMatch(currentMatch, segment)) {
                nextMatchMap.set(nextMatch.path, nextMatch);
            }
        }
        currentMatches = [...nextMatchMap.values()].sort(comparePath);
    }
    if (hasTrailingSep) {
        currentMatches = currentMatches.filter((entry) => entry.isDirectory);
    }
    currentMatches = currentMatches.filter((entry) => shouldInclude(entry.path));
    if (!includeDirs) {
        currentMatches = currentMatches.filter((entry) => !entry.isDirectory);
    }
    yield* currentMatches;
}
