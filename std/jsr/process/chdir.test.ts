import { deepStrictEqual as equal, ok, throws } from "node:assert/strict";
import { test } from "node:test";
import { dirname, join, resolve } from "@neotales/path";
import { ChangeDirectoryError, chdir } from "./chdir.ts";
import { cwd } from "./cwd.ts";

// =============================================================================
// Basic functionality tests
// =============================================================================

test("process::chdir changes to absolute path", () => {
  const original = cwd();
  const parent = dirname(original);

  chdir(parent);
  equal(cwd(), parent);

  // Restore
  chdir(original);
});

test("process::chdir changes to relative path", () => {
  const original = cwd();
  const parent = resolve(join(original, ".."));

  chdir("..");
  equal(cwd(), parent);

  // Restore
  chdir(original);
});

test("process::chdir handles current directory", () => {
  const original = cwd();

  chdir(".");
  equal(cwd(), original);
});

test("process::chdir returns undefined", () => {
  const result = chdir(".");
  equal(result, undefined);
});

// =============================================================================
// Error handling tests
// =============================================================================

test("process::chdir throws ChangeDirectoryError for non-existent path", () => {
  throws(() => chdir("/nonexistent/path/that/should/not/exist/12345"), ChangeDirectoryError);
});

test("process::ChangeDirectoryError has correct name", () => {
  const error = new ChangeDirectoryError("test error");
  equal(error.name, "ChangeDirectoryError");
});

test("process::ChangeDirectoryError includes message", () => {
  const error = new ChangeDirectoryError("directory not found");
  ok(error.message.includes("directory not found"));
});

test("process::ChangeDirectoryError preserves cause", () => {
  const cause = new Error("original error");
  const error = new ChangeDirectoryError("wrapper", { cause });
  equal(error.cause, cause);
});

// =============================================================================
// Edge case tests
// =============================================================================

test("process::chdir handles consecutive calls", () => {
  const original = cwd();
  const parent = dirname(original);

  chdir(parent);
  chdir(original);
  chdir(parent);
  chdir(original);

  equal(cwd(), original);
});

test("process::chdir preserves path after failed chdir", () => {
  const original = cwd();

  try {
    chdir("/nonexistent/path/12345");
  } catch {
    // Expected
  }

  equal(cwd(), original);
});
