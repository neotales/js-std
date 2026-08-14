import { deepStrictEqual as equal, throws } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import { assertArg, formatPath } from "./format.js";
test("path::formatPath()", () => {
    equal(formatPath("", {}), "");
    equal(formatPath("", { root: "/" }), "/");
    equal(formatPath("", { dir: "/foo/bar" }), "/foo/bar");
    equal(formatPath("", { base: "baz" }), "baz");
    equal(formatPath("", { name: "baz" }), "baz");
    equal(formatPath("", { ext: ".js" }), ".js");
    equal(formatPath("", { name: "baz", ext: ".js" }), "baz.js");
    equal(formatPath("", { root: "/", base: "baz" }), "/baz");
    equal(formatPath("", { root: "/", name: "baz" }), "/baz");
    equal(formatPath("", { root: "/", ext: ".js" }), "/.js");
    equal(formatPath("", { root: "/", name: "baz", ext: ".js" }), "/baz.js");
    equal(formatPath("/", { dir: "/foo/bar", base: "baz" }), "/foo/bar/baz");
    equal(formatPath("/", { dir: "/foo/bar", base: "baz", ext: ".js" }), "/foo/bar/baz");
    equal(formatPath("/", { dir: "/foo/bar", name: "baz", ext: ".js" }), "/foo/bar/baz.js");
});
test("path::assertArg()", () => {
    equal(assertArg({}), undefined);
    equal(assertArg({ root: "/" }), undefined);
    equal(assertArg({ dir: "/foo/bar" }), undefined);
});
test("path::assertArg() throws", () => {
    throws(
    // @ts-expect-error - testing invalid input
    () => assertArg(null), TypeError, `The "pathObject" argument must be of type Object, received type "object"`);
    throws(
    // @ts-expect-error - testing invalid input
    () => assertArg(undefined), TypeError, `The "pathObject" argument must be of type Object, received type "undefined"`);
    throws(
    // @ts-expect-error - testing invalid input
    () => assertArg(""), TypeError, `The "pathObject" argument must be of type Object, received type "string"`);
});
