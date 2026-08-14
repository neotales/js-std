import { deepStrictEqual as equal } from "node:assert/strict";
import { test } from "node:test";
import * as posix from "./posix/mod.js";
import * as windows from "./windows/mod.js";
const winPaths = [
    // [path, root]
    ["C:\\path\\dir\\index.html", "C:\\"],
    ["C:\\another_path\\DIR\\1\\2\\33\\\\index", "C:\\"],
    ["another_path\\DIR with spaces\\1\\2\\33\\index", ""],
    ["\\", "\\"],
    ["\\foo\\C:", "\\"],
    ["file", ""],
    ["file:stream", ""],
    [".\\file", ""],
    ["C:", "C:"],
    ["C:.", "C:"],
    ["C:..", "C:"],
    ["C:abc", "C:"],
    ["C:\\", "C:\\"],
    ["C:\\abc", "C:\\"],
    ["", ""],
    // unc
    ["\\\\server\\share\\file_path", "\\\\server\\share\\"],
    ["\\\\server two\\shared folder\\file path.zip", "\\\\server two\\shared folder\\"],
    ["\\\\teela\\admin$\\system32", "\\\\teela\\admin$\\"],
    ["\\\\?\\UNC\\server\\share", "\\\\?\\UNC\\"],
];
const winSpecialCaseParseTests = [
    ["/foo/bar", { root: "/", dir: "/foo", base: "bar", ext: "", name: "bar" }],
];
const winSpecialCaseFormatTests = [
    [{ dir: "some\\dir" }, "some\\dir\\"],
    [{ base: "index.html" }, "index.html"],
    [{ root: "C:\\" }, "C:\\"],
    [{ name: "index", ext: ".html" }, "index.html"],
    [{ dir: "some\\dir", name: "index", ext: ".html" }, "some\\dir\\index.html"],
    [{ root: "C:\\", name: "index", ext: ".html" }, "C:\\index.html"],
    [{}, ""],
];
const unixPaths = [
    // [path, root, formatted]
    ["/home/user/dir/file.txt", "/"],
    ["/home/user/a dir/another File.zip", "/"],
    ["/home/user/a dir//another&File.", "/", "/home/user/a dir/another&File."],
    ["/home/user/a$$$dir//another File.zip", "/", "/home/user/a$$$dir/another File.zip"],
    ["user/dir/another File.zip", ""],
    ["file", ""],
    [".\\file", ""],
    ["./file", ""],
    ["C:\\foo", ""],
    ["/", "/"],
    ["", ""],
    [".", ""],
    ["..", ""],
    ["/foo", "/"],
    ["/foo.", "/"],
    ["/foo.bar", "/"],
    ["/.", "/"],
    ["/.foo", "/"],
    ["/.foo.bar", "/"],
    ["/foo/bar.baz", "/"],
];
const unixSpecialCaseFormatTests = [
    [{ dir: "some/dir" }, "some/dir/"],
    [{ base: "index.html" }, "index.html"],
    [{ root: "/" }, "/"],
    [{ name: "index", ext: ".html" }, "index.html"],
    [{ dir: "some/dir", name: "index", ext: ".html" }, "some/dir/index.html"],
    [{ root: "/", name: "index", ext: ".html" }, "/index.html"],
    [{}, ""],
];
function checkParseFormat(path, testCases) {
    testCases.forEach(([element, root, formatted]) => {
        const output = path.parse(element);
        equal(typeof output.root, "string");
        equal(typeof output.dir, "string");
        equal(typeof output.base, "string");
        equal(typeof output.ext, "string");
        equal(typeof output.name, "string");
        equal(output.root, root);
        equal(output.dir, output.dir ? path.dirname(element) : "");
        equal(output.base, path.basename(element));
        equal(output.ext, path.extname(element));
        // We normalize incorrect paths during parsing, so some "incorrect"
        // input cannot be asserted for equality onto itself.
        if (formatted) {
            equal(path.format(output), formatted);
        }
        else {
            equal(path.format(output), element);
        }
    });
}
function checkSpecialCaseParseFormat(path, testCases) {
    testCases.forEach(([element, expect]) => {
        equal(path.parse(element), expect);
    });
}
function checkFormat(path, testCases) {
    testCases.forEach((testCase) => {
        equal(path.format(testCase[0]), testCase[1]);
    });
}
test("path::windows.parse()", function () {
    checkParseFormat(windows, winPaths);
    checkSpecialCaseParseFormat(windows, winSpecialCaseParseTests);
});
test("path::posix.parse()", function () {
    checkParseFormat(posix, unixPaths);
});
test("path::windows.format()", function () {
    checkFormat(windows, winSpecialCaseFormatTests);
});
test("path::posix.format()", function () {
    checkFormat(posix, unixSpecialCaseFormatTests);
});
// Test removal of trailing path separators
const windowsTrailingTests = [
    [".\\", { root: "", dir: "", base: ".", ext: "", name: "." }],
    ["\\\\", { root: "\\", dir: "\\", base: "\\", ext: "", name: "" }],
    ["\\\\", { root: "\\", dir: "\\", base: "\\", ext: "", name: "" }],
    ["c:\\foo\\\\\\", { root: "c:\\", dir: "c:\\", base: "foo", ext: "", name: "foo" }],
    [
        "D:\\foo\\\\\\bar.baz",
        {
            root: "D:\\",
            dir: "D:\\foo\\\\",
            base: "bar.baz",
            ext: ".baz",
            name: "bar",
        },
    ],
];
const posixTrailingTests = [
    ["./", { root: "", dir: "", base: ".", ext: "", name: "." }],
    ["//", { root: "/", dir: "/", base: "/", ext: "", name: "" }],
    ["///", { root: "/", dir: "/", base: "/", ext: "", name: "" }],
    ["/foo///", { root: "/", dir: "/", base: "foo", ext: "", name: "foo" }],
    ["/foo///bar.baz", { root: "/", dir: "/foo", base: "bar.baz", ext: ".baz", name: "bar" }],
];
test("path::windows.parseTrailing()", function () {
    windowsTrailingTests.forEach(function (p) {
        const actual = windows.parse(p[0]);
        const expected = p[1];
        equal(actual, expected);
    });
});
test("path::parseTrailing()", function () {
    posixTrailingTests.forEach(function (p) {
        const actual = posix.parse(p[0]);
        const expected = p[1];
        equal(actual, expected);
    });
});
