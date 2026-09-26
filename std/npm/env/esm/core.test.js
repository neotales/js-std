import { deepStrictEqual as equal, ok, throws } from "node:assert/strict";
const nope = (value, message) => ok(!value, message);
import { test } from "node:test";
import * as env from "./core.js";
import { globals, WINDOWS } from "./globals.js";
let hasEcho = false;
if (!WINDOWS) {
    hasEcho = true;
}
else {
    if (globals.Deno) {
        try {
            const cmd = new globals.Deno.Command("where.exe", {
                args: ["echo"],
                stdout: "piped",
                stderr: "piped",
            });
            const o1 = cmd.outputSync();
            hasEcho = o1.code === 0 && o1.stdout.length > 0;
        }
        catch {
            // Ignore error, echo might not be available
        }
    }
}
test("env::get", () => {
    env.set("DENO_TEST_1", "value");
    equal(env.get("DENO_TEST_1"), "value");
});
test("env::expand", () => {
    env.set("NAME", "Alice");
    equal(env.expand("Hello, ${NAME}! You are ${AGE:-30} years old."), "Hello, Alice! You are 30 years old.");
    equal(env.expand("HELLO, %NAME%!", { windowsExpansion: true }), "HELLO, Alice!");
    env.expand("${AGE_NEXT:=30}");
    equal(env.get("AGE_NEXT"), "30");
    throws(() => {
        env.expand("${AGE_NEXT2:?Missing environment variable AGE_NEXT2}");
    }, /Missing environment variable AGE_NEXT2/);
});
test("env::has", () => {
    env.set("DENO_TEST_2", "value");
    ok(env.has("DENO_TEST_2"));
    nope(env.has("NOT_SET"));
});
test("env::remove", () => {
    env.set("DENO_TEST_2_1", "value");
    ok(env.has("DENO_TEST_2_1"));
    env.remove("DENO_TEST_2_1");
    nope(env.has("DENO_TEST_2_1"));
});
test("env::merge", () => {
    env.set("DENO_TEST_3", "value");
    env.merge({ DENO_TEST_4: "value", DENO_TEST_3: undefined });
    nope(env.has("DENO_TEST_3"));
    ok(env.has("DENO_TEST_4"));
});
test("env::union", () => {
    env.union({ DENO_TEST_32: "value", DENO_TEST_33: undefined });
    ok(env.proxy["DENO_TEST_32"] === "value");
    ok(env.proxy["DENO_TEST_33"] === undefined);
});
test("env::toObject", () => {
    env.set("DENO_TEST_6", "value");
    const obj = env.toObject();
    ok(obj.DENO_TEST_6 === "value");
});
test("env::set", () => {
    env.set("DENO_TEST_7", "value");
    ok(env.has("DENO_TEST_7"));
});
test("env::appendPath", () => {
    env.appendPath("/deno_test_append");
    ok(env.hasPath("/deno_test_append"));
    const paths = env.splitPath();
    equal(paths[paths.length - 1], "/deno_test_append");
    env.removePath("/deno_test_append");
    nope(env.hasPath("/deno_test_append"));
});
test("env::prependPath", () => {
    env.prependPath("/deno_test_prepend");
    ok(env.hasPath("/deno_test_prepend"));
    const paths = env.splitPath();
    equal(paths[0], "/deno_test_prepend");
    env.removePath("/deno_test_prepend");
    nope(env.hasPath("/deno_test_prepend"));
});
test("env::removePath", () => {
    env.appendPath("/deno_test_remove");
    ok(env.hasPath("/deno_test_remove"));
    env.removePath("/deno_test_remove");
    nope(env.hasPath("/deno_test_remove"));
});
test("env::replacePath", () => {
    env.appendPath("/test_replace");
    ok(env.hasPath("/test_replace"));
    env.replacePath("/test_replace", "/test2");
    nope(env.hasPath("/test_replace"));
    ok(env.hasPath("/test2"));
    env.removePath("/test2");
});
test("env::splitPath", () => {
    env.appendPath("/deno_test12");
    const paths = env.splitPath();
    ok(paths.length > 0);
    ok(paths.some((p) => p === "/deno_test12"));
});
test("env::hasPath", () => {
    env.appendPath("/deno_test14");
    ok(env.hasPath("/deno_test14"));
    nope(env.hasPath("/deno_test15"));
});
test("env::getPath", () => {
    env.appendPath("/deno_test16");
    ok(env.getPath().includes("/deno_test16"));
});
test("env::path aliases getPath", () => {
    const current = env.getPath();
    try {
        env.setPath("/neotales-env-path");
        equal(env.path(), env.getPath());
    }
    finally {
        env.setPath(current);
    }
});
test("env::proxy supports property reads, writes, and enumeration", () => {
    env.proxy.NEOTALES_ENV_PROXY = "value";
    equal(env.get("NEOTALES_ENV_PROXY"), "value");
    ok("NEOTALES_ENV_PROXY" in env.proxy);
    equal({ ...env.proxy }.NEOTALES_ENV_PROXY, "value");
    delete env.proxy.NEOTALES_ENV_PROXY;
});
test("env::setPath", () => {
    const p = env.getPath();
    try {
        env.appendPath("/deno_test17");
        env.setPath("/deno_test18");
        equal(env.getPath(), "/deno_test18");
    }
    finally {
        env.setPath(p);
    }
});
test("env::env.joinPath", () => {
    const paths = ["/deno_test20", "/deno_test21"];
    const joined = env.joinPath(paths);
    ok(joined.includes("/deno_test20"));
    ok(joined.includes("/deno_test21"));
});
test("env::expand with command substitution", { skip: !hasEcho }, () => {
    const tpl = `The value is: $(echo "test")`;
    const result = env.expand(tpl, { commands: true });
    equal(result, "The value is: test");
});
