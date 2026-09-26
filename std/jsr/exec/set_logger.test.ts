import { deepStrictEqual as equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { setLogger } from "./set_logger.ts";
import { cmd } from "./command.ts";
import { pathFinder } from "./path_finder.ts";

const hasExe = pathFinder.findExeSync("echo") !== undefined;
const gb: Record<string, unknown> = globalThis as Record<string, unknown>;

test("exec::setLogger", async (t) => {
  if (!hasExe) {
    if (gb.Bun) {
      ok(
        true,
        "Skipping test: Bun does not support nested tests using node:test, including the skip",
      );
      return;
    }

    t.skip("Skipping test: 'echo' command not found in PATH");
    return;
  }

  let fileName = "";
  let args2: undefined | string[] = [];
  setLogger((file, args) => {
    fileName = file;
    args2 = args;
  });
  try {
    await cmd(["echo", "test"]);
    ok(fileName.endsWith("echo") || fileName.endsWith("echo.exe"));
    equal(args2, ["test"]);
  } finally {
    setLogger(undefined);
  }
});
