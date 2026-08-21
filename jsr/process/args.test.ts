import { deepStrictEqual as equal, fail } from "node:assert/strict";
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

const expected = ["arg1", "arg2", "--option", "value", "-o"];
const argsScript = 'import { args } from "./args.js"; console.log(JSON.stringify(args));';

test("process::args", () => {
  if (DENO) {
    const o = spawnSync(
      deno,
      ["run", "-A", `${dir}/internal/args.ts`, "arg1", "arg2", "--option", "value", "-o"],
      {
        encoding: "utf-8",
        stdio: "pipe",
      },
    );

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`deno run failed ${output} ${errorOutput}`);
    }

    const data = JSON.parse(output);
    equal(data, expected);

    return;
  }

  if (BUN) {
    const o = spawnSync(bun, ["--eval", argsScript, "arg1", "arg2", "--option", "value", "-o"], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`bun run failed ${output} ${errorOutput}`);
    }

    const data = JSON.parse(output);
    equal(data, expected);

    return;
  }

  if (NODE) {
    const o = spawnSync(
      node,
      ["--input-type=module", "--eval", argsScript, "arg1", "arg2", "--option", "value", "-o"],
      {
        cwd: dir,
        encoding: "utf-8",
        stdio: "pipe",
      },
    );

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`node run failed ${output} ${errorOutput}`);
    }

    const data = JSON.parse(output);
    equal(data, expected);

    return;
  }
});
