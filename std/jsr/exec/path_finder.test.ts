import { deepStrictEqual as equal, ok } from "node:assert/strict";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "node:test";
import { PathFinder, pathFinder } from "./path_finder.ts";

test("exec::PathFinder - set and get options", () => {
  const finder = new PathFinder();
  finder.set("test-tool", {
    name: "test-tool",
    envVariable: "TEST_TOOL_PATH",
    windows: ["C:\\test\\tool.exe"],
    linux: ["/opt/test/tool"],
  });

  const options = finder.get("test-tool");
  ok(options);
  equal(options!.name, "test-tool");
  equal(options!.envVariable, "TEST_TOOL_PATH");
});

test("exec::PathFinder - has method", () => {
  const finder = new PathFinder();
  nope(finder.has("my-tool"));

  finder.set("my-tool", { name: "my-tool" });
  ok(finder.has("my-tool"));
});

test("exec::PathFinder - delete method", () => {
  const finder = new PathFinder();
  finder.set("temp-tool", { name: "temp-tool" });
  ok(finder.has("temp-tool"));

  const deleted = finder.delete("temp-tool");
  ok(deleted);
  nope(finder.has("temp-tool"));
});

test("exec::PathFinder - clear method", () => {
  const finder = new PathFinder();
  finder.set("tool1", { name: "tool1" });
  finder.set("tool2", { name: "tool2" });

  finder.clear();
  nope(finder.has("tool1"));
  nope(finder.has("tool2"));
});

test("exec::PathFinder - find method", () => {
  const finder = new PathFinder();
  finder.set("findable", { name: "findable" });

  const result = finder.find("findable");
  ok(result);
  equal(result!.name, "findable");

  const notFound = finder.find("not-registered");
  nope(notFound);
});

test("exec::PathFinder - findExe for common executable", async () => {
  // git is commonly available on most systems
  const gitPath = await pathFinder.findExe("git");
  if (gitPath) {
    ok(gitPath.includes("git"));
  }
});

test("exec::PathFinder - findExeSync for common executable", () => {
  const gitPath = pathFinder.findExeSync("git");
  if (gitPath) {
    ok(gitPath.includes("git"));
  }
});

test("exec::PathFinder - findExe returns undefined for non-existent", async () => {
  const result = await pathFinder.findExe("definitely-not-a-command-xyz123");
  equal(result, undefined);
});

test("exec::PathFinder - findExeSync returns undefined for non-existent", () => {
  const result = pathFinder.findExeSync("definitely-not-a-command-xyz123");
  equal(result, undefined);
});

test("exec::PathFinder - auto-creates options if not registered", async () => {
  const finder = new PathFinder();
  // Calling findExe should auto-register
  await finder.findExe("auto-registered");
  ok(finder.has("auto-registered"));
});

test("exec::PathFinder - uses cached path when available", async () => {
  const finder = new PathFinder();
  finder.set("cached-tool", {
    name: "cached-tool",
    cached: "/cached/path/to/tool",
  });

  const result = await finder.findExe("cached-tool");
  equal(result, "/cached/path/to/tool");
});

test("exec::PathFinder - findExeSync uses cached path", () => {
  const finder = new PathFinder();
  finder.set("cached-sync", {
    name: "cached-sync",
    cached: "/sync/cached/path",
  });

  const result = finder.findExeSync("cached-sync");
  equal(result, "/sync/cached/path");
});

test("exec::PathFinder - noCache option skips cache", async () => {
  const finder = new PathFinder();
  finder.set("no-cache-tool", {
    name: "no-cache-tool",
    cached: "/old/cached/path",
    noCache: true,
  });

  // With noCache, it should try to find the actual executable
  const result = await finder.findExe("no-cache-tool");
  // Since the tool doesn't exist, should return undefined
  equal(result, undefined);
});
