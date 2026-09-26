import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { isWindows, withTestRootSync } from "./_test_helpers.ts";
import { umask } from "./umask.ts";

test("umask returns and restores the process mask", { skip: isWindows }, () => {
  withTestRootSync(() => {
    const previous = umask(0o077);
    try {
      strictEqual(umask(), 0o077);
    } finally {
      umask(previous);
    }
  });
});

test("umask returns the preceding mask across transitions", { skip: isWindows }, () => {
  withTestRootSync(() => {
    const original = umask();
    try {
      strictEqual(umask(0o027), original);
      strictEqual(umask(0o077), 0o027);
      strictEqual(umask(), 0o077);
    } finally {
      umask(original);
    }
  });
});
