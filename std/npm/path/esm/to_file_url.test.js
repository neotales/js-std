import { deepStrictEqual as equal, throws } from "node:assert/strict";
// Copyright 2018-2025 the Deno authors. MIT license.
import { test } from "node:test";
import * as posix from "./posix/mod.js";
import * as windows from "./windows/mod.js";
test("path::posix.toFileUrl()", function () {
    equal(posix.toFileUrl("/home/foo").href, "file:///home/foo");
    equal(posix.toFileUrl("/home/ ").href, "file:///home/%20");
    equal(posix.toFileUrl("/home/%20").href, "file:///home/%2520");
    equal(posix.toFileUrl("/home\\foo").href, "file:///home%5Cfoo");
    throws(() => posix.toFileUrl("foo").href, TypeError, 'Path must be absolute: received "foo"');
    throws(() => posix.toFileUrl("C:/"), TypeError, 'Path must be absolute: received "C:/"');
    equal(posix.toFileUrl("//localhost/home/foo").href, "file:///localhost/home/foo");
    equal(posix.toFileUrl("//localhost/").href, "file:///localhost/");
    equal(posix.toFileUrl("//:/home/foo").href, "file:///:/home/foo");
    equal(posix.toFileUrl("///home/foo").href, "file:///home/foo");
    equal(posix.toFileUrl("////home/foo").href, "file:///home/foo");
});
test("path::windows.toFileUrl()", function () {
    equal(windows.toFileUrl("/home/foo").href, "file:///home/foo");
    equal(windows.toFileUrl("/home/ ").href, "file:///home/%20");
    equal(windows.toFileUrl("/home/%20").href, "file:///home/%2520");
    equal(windows.toFileUrl("/home\\foo").href, "file:///home/foo");
    throws(() => windows.toFileUrl("foo").href, TypeError, 'Path must be absolute: received "foo"');
    equal(windows.toFileUrl("C:/").href, "file:///C:/");
    equal(windows.toFileUrl("//localhost/home/foo").href, "file:///home/foo");
    equal(windows.toFileUrl("//127.0.0.1/home/foo").href, "file://127.0.0.1/home/foo");
    equal(windows.toFileUrl("//localhost/").href, "file:///");
    equal(windows.toFileUrl("//127.0.0.1/").href, "file://127.0.0.1/");
    throws(() => windows.toFileUrl("//:/home/foo").href, TypeError, 'Invalid hostname: ""');
});
