import { equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { join } from "./join.js";
test("path::string operations do not require a URL global", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "URL");
    try {
        ok(Reflect.deleteProperty(globalThis, "URL"));
        equal(join("a", "b"), "a/b");
        ok(join("a", "b").startsWith("a/"));
    }
    finally {
        if (descriptor)
            Object.defineProperty(globalThis, "URL", descriptor);
    }
});
