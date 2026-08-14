// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import { deepStrictEqual as equal } from "node:assert/strict";
import * as posix from "./posix/mod.js";
import * as windows from "./windows/mod.js";
import { join } from "./join.js";
import { join as posixUnstableJoin } from "./posix/join.js";
import { join as windowsUnstableJoin } from "./windows/join.js";
import { cwd } from "./_globals.js";
const backslashRE = /\\/g;
const joinTests = 
// arguments                     result
[
    [[".", "x/b", "..", "/b/c.js"], "x/b/c.js"],
    [[], "."],
    [["/.", "x/b", "..", "/b/c.js"], "/x/b/c.js"],
    [["/foo", "../../../bar"], "/bar"],
    [["foo", "../../../bar"], "../../bar"],
    [["foo/", "../../../bar"], "../../bar"],
    [["foo/x", "../../../bar"], "../bar"],
    [["foo/x", "./bar"], "foo/x/bar"],
    [["foo/x/", "./bar"], "foo/x/bar"],
    [["foo/x/", ".", "bar"], "foo/x/bar"],
    [["./"], "./"],
    [[".", "./"], "./"],
    [[".", ".", "."], "."],
    [[".", "./", "."], "."],
    [[".", "/./", "."], "."],
    [[".", "/////./", "."], "."],
    [["."], "."],
    [["", "."], "."],
    [["", "foo"], "foo"],
    [["foo", "/bar"], "foo/bar"],
    [["", "/foo"], "/foo"],
    [["", "", "/foo"], "/foo"],
    [["", "", "foo"], "foo"],
    [["foo", ""], "foo"],
    [["foo/", ""], "foo/"],
    [["foo", "", "/bar"], "foo/bar"],
    [["./", "..", "/foo"], "../foo"],
    [["./", "..", "..", "/foo"], "../../foo"],
    [[".", "..", "..", "/foo"], "../../foo"],
    [["", "..", "..", "/foo"], "../../foo"],
    [["/"], "/"],
    [["/", "."], "/"],
    [["/", ".."], "/"],
    [["/", "..", ".."], "/"],
    [[""], "."],
    [["", ""], "."],
    [[" /foo"], " /foo"],
    [[" ", "foo"], " /foo"],
    [[" ", "."], " "],
    [[" ", "/"], " /"],
    [[" ", ""], " "],
    [["/", "foo"], "/foo"],
    [["/", "/foo"], "/foo"],
    [["/", "//foo"], "/foo"],
    [["/", "", "/foo"], "/foo"],
    [["", "/", "foo"], "/foo"],
    [["", "/", "/foo"], "/foo"],
];
const joinUrlTests = [
    // URLs
    [[new URL("file:///"), "x/b", "..", "/b/c.js"], "/x/b/c.js"],
    [[new URL("file:///foo"), "../../../bar"], "/bar"],
    [[new URL("file:///foo"), "bar", "baz/asdf", "quux", ".."], "/foo/bar/baz/asdf"],
];
// Windows-specific join tests
const windowsJoinTests = [
    // arguments                     result
    // UNC path expected
    [["//foo/bar"], "\\\\foo\\bar\\"],
    [["\\/foo/bar"], "\\\\foo\\bar\\"],
    [["\\\\foo/bar"], "\\\\foo\\bar\\"],
    // UNC path expected - server and share separate
    [["//foo", "bar"], "\\\\foo\\bar\\"],
    [["//foo/", "bar"], "\\\\foo\\bar\\"],
    [["//foo", "/bar"], "\\\\foo\\bar\\"],
    // UNC path expected - questionable
    [["//foo", "", "bar"], "\\\\foo\\bar\\"],
    [["//foo/", "", "bar"], "\\\\foo\\bar\\"],
    [["//foo/", "", "/bar"], "\\\\foo\\bar\\"],
    // UNC path expected - even more questionable
    [["", "//foo", "bar"], "\\\\foo\\bar\\"],
    [["", "//foo/", "bar"], "\\\\foo\\bar\\"],
    [["", "//foo/", "/bar"], "\\\\foo\\bar\\"],
    // No UNC path expected (no double slash in first component)
    [["\\", "foo/bar"], "\\foo\\bar"],
    [["\\", "/foo/bar"], "\\foo\\bar"],
    [["", "/", "/foo/bar"], "\\foo\\bar"],
    // No UNC path expected (no non-slashes in first component -
    // questionable)
    [["//", "foo/bar"], "\\foo\\bar"],
    [["//", "/foo/bar"], "\\foo\\bar"],
    [["\\\\", "/", "/foo/bar"], "\\foo\\bar"],
    [["//"], "\\"],
    // No UNC path expected (share name missing - questionable).
    [["//foo"], "\\foo"],
    [["//foo/"], "\\foo\\"],
    [["//foo", "/"], "\\foo\\"],
    [["//foo", "", "/"], "\\foo\\"],
    // No UNC path expected (too many leading slashes - questionable)
    [["///foo/bar"], "\\foo\\bar"],
    [["////foo", "bar"], "\\foo\\bar"],
    [["\\\\\\/foo/bar"], "\\foo\\bar"],
    // Drive-relative vs drive-absolute paths. This merely describes the
    // status quo, rather than being obviously right
    [["c:"], "c:."],
    [["c:."], "c:."],
    [["c:", ""], "c:."],
    [["", "c:"], "c:."],
    [["c:.", "/"], "c:.\\"],
    [["c:.", "file"], "c:file"],
    [["c:", "/"], "c:\\"],
    [["c:", "file"], "c:\\file"],
];
const windowsJoinUrlTests = [
    // URLs
    [[new URL("file:///c:")], "c:\\"],
    [[new URL("file:///c:"), "file"], "c:\\file"],
    [[new URL("file:///c:/"), "file"], "c:\\file"],
];
test("path::posix.join()", function () {
    joinTests.forEach(function (p) {
        const args = p[0];
        const actual = posix.join.apply(null, args);
        equal(actual, p[1]);
    });
});
test("path::posix.join() accepts file URLs", function () {
    joinUrlTests.forEach(function (p) {
        const args = p[0];
        const actual = posixUnstableJoin.apply(null, args);
        equal(actual, p[1]);
    });
});
test("path::windows.join()", function () {
    joinTests.forEach(function (p) {
        const args = p[0];
        const actual = windows.join.apply(null, args).replace(backslashRE, "/");
        equal(actual, p[1]);
    });
    windowsJoinTests.forEach(function (p) {
        const args = p[0];
        const actual = windows.join.apply(null, args);
        equal(actual, p[1]);
    });
});
test("path::windows.join() accepts file URLs", function () {
    joinUrlTests.forEach(function (p) {
        const args = p[0];
        const actual = windowsUnstableJoin.apply(null, args).replace(backslashRE, "/");
        equal(actual, p[1]);
    });
    windowsJoinUrlTests.forEach(function (p) {
        const args = p[0];
        const actual = windowsUnstableJoin.apply(null, args);
        equal(actual, p[1]);
    });
});
test(`path::join() returns "." if input is empty`, function () {
    equal(join(""), ".");
    equal(join("", ""), ".");
    const pwd = cwd("Expected a current working directory");
    equal(join(pwd), pwd);
    equal(join(pwd, ""), pwd);
});
