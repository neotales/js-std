import { deepStrictEqual as equal, throws } from "node:assert/strict";
import { test } from "node:test";
import { popd } from "./popd.ts";
import { pushd } from "./pushd.ts";
import { cwd } from "./cwd.ts";
import { history } from "./history.ts";

// =============================================================================
// Basic functionality tests
// =============================================================================

function resetHistory(): void {
  history.length = 0;
}

test("process::pushd stores the previous directory", () => {
  const original = cwd();
  resetHistory();
  pushd("..");
  equal(history, [original]);
  equal(popd(), original);
  equal(cwd(), original);
  equal(history, [original]);
});

test("process::popd returns undefined on empty history", () => {
  resetHistory();
  const result = popd();
  equal(result, undefined);
});

test("process::pushd preserves the stack when changing directory fails", () => {
  const original = cwd();
  resetHistory();
  throws(() => pushd("/nonexistent/path/that/should/not/exist/12345"));
  equal(history, []);
  equal(cwd(), original);
});

test("process::popd preserves the initial directory", () => {
  const original = cwd();
  resetHistory();
  pushd("..");
  equal(popd(), original);
  equal(popd(), original);
  equal(cwd(), original);
  equal(history, [original]);
});

// =============================================================================
// Stack behavior tests
// =============================================================================

test("process::pushd maintains LIFO order", () => {
  const original = cwd();
  resetHistory();
  pushd("..");
  const parent = cwd();
  pushd("..");

  const second = popd();
  const first = popd();

  equal(second, parent);
  equal(cwd(), original);
  equal(first, original);
  equal(cwd(), original);
  equal(history, [original]);
});

test("process::multiple pushd increases history length", () => {
  resetHistory();
  const initialLength = history.length;

  pushd(".");
  pushd(".");
  pushd(".");

  equal(history.length, initialLength + 3);

  popd();
  popd();
  popd();
  equal(history.length, 1);
  resetHistory();
});

// =============================================================================
// Edge case tests
// =============================================================================

test("process::popd on empty stack returns undefined", () => {
  resetHistory();
  equal(popd(), undefined);
  equal(popd(), undefined);
});

test("process::pushd with current directory retains the base directory", () => {
  const original = cwd();
  resetHistory();
  pushd(".");
  const dir = popd();
  equal(dir, original);
  equal(cwd(), original);
  equal(history, [original]);
});
