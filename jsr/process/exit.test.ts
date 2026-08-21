import { fail } from "node:assert/strict";
import { test } from "node:test";
import { globals } from "./_globals.ts";

const BUN = globals.Bun !== undefined;
const DENO = globals.Deno !== undefined;
const NODE = typeof process !== "undefined" && !!process.versions?.node;
import { basename, dirname, fromFileUrl } from "@neotales/path";
import { spawnSync } from "node:child_process";

const sourceDir = dirname(fromFileUrl(import.meta.url));
const dir = basename(dirname(sourceDir)) === "esm" ? dirname(sourceDir) : sourceDir;

const WINDOWS = (globals.Deno && globals.Deno.build.os === "windows") ||
  (globals.process && globals.process.platform === "win32");
const deno = WINDOWS ? "deno.exe" : "deno";
const node = WINDOWS ? "node.exe" : "node";
const bun = WINDOWS ? "bun.exe" : "bun";
const exit0Script = 'import { exit } from "./exit.js"; exit(0);';
const exit1Script = 'import { exit } from "./exit.js"; exit(1);';

test("process::exit 0", () => {
  if (DENO) {
    const o = spawnSync(deno, ["run", "-A", `${dir}/internal/exit_0.ts`], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;

    if (code !== 0) {
      fail(`_exit_0.ts run failed exit code ${code}`);
    }

    return;
  }

  if (BUN) {
    const o = spawnSync(bun, ["--eval", exit0Script], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;

    if (code !== 0) {
      fail(`_exit_0.ts run failed exit code ${code}`);
    }

    return;
  }

  if (NODE) {
    const o = spawnSync(node, ["--input-type=module", "--eval", exit0Script], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;

    if (code !== 0) {
      fail(`_exit_0.js run failed exit code ${code}`);
    }

    return;
  }
});

test("process::exit 1", () => {
  if (DENO) {
    const o = spawnSync("deno", ["run", "-A", `${dir}/internal/exit_1.ts`], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;

    if (code !== 1) {
      fail(`_exit_1.ts run failed exit code ${code}`);
    }

    return;
  }

  if (BUN) {
    const o = spawnSync(bun, ["--eval", exit1Script], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;

    if (code !== 1) {
      fail(`_exit_1.ts run failed exit code ${code}`);
    }

    return;
  }

  if (NODE) {
    const o = spawnSync(node, ["--input-type=module", "--eval", exit1Script], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const code = o.status;
    if (code !== 1) {
      fail(`_exit_1.js run failed exit code ${code}`);
    }

    return;
  }
});
