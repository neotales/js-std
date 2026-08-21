import { fail, ok } from "node:assert/strict";
const stringIncludes = (value: string, expected: string, message?: string) =>
  ok(value.includes(expected), message);
// @deno-ig
import { test } from "node:test";
import { globals } from "./_globals.ts";

const BUN = globals.Bun !== undefined;
const DENO = globals.Deno !== undefined;
const NODE = typeof process !== "undefined" && !!process.versions?.node;
import { basename, dirname, fromFileUrl } from "@neotales/path";
import { spawn, spawnSync } from "node:child_process";

const sourceDir = dirname(fromFileUrl(import.meta.url));
const dir = basename(dirname(sourceDir)) === "esm" ? dirname(sourceDir) : sourceDir;

const WINDOWS = (globals.Deno && globals.Deno.build.os === "windows") ||
  (globals.process && globals.process.platform === "win32");
const deno = WINDOWS ? "deno.exe" : "deno";
const node = WINDOWS ? "node.exe" : "node";
const bun = WINDOWS ? "bun.exe" : "bun";
const writeStdoutScript =
  'import { stdout } from "./streams.js"; stdout.writeSync(new TextEncoder().encode("writeSync\\n")); await stdout.write(new TextEncoder().encode("write\\n"));';
const writeStderrScript =
  'import { stderr } from "./streams.js"; stderr.writeSync(new TextEncoder().encode("writeSync\\n")); await stderr.write(new TextEncoder().encode("write\\n"));';
const readStdinScript =
  'import { stdin, stdout } from "./streams.js"; const buffer = new Uint8Array(1024); while (true) { const count = stdin.readSync(buffer); if (count === null) break; if (count > 0) stdout.writeSync(buffer.subarray(0, count)); }';
const readStdinAsyncScript =
  'import { stdin, stdout } from "./streams.js"; const buffer = new Uint8Array(1024); while (true) { const count = await stdin.read(buffer); if (count === null) break; if (count > 0) await stdout.write(buffer.subarray(0, count)); }';

test("process::stdout", () => {
  if (DENO) {
    const o = spawnSync(deno, ["run", "-A", `${dir}/internal/write_stdout.ts`], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`deno run failed ${output} ${errorOutput}`);
    }

    stringIncludes(output, "writeSync");
    stringIncludes(output, "write");

    return;
  }

  if (BUN) {
    const o = spawnSync(bun, ["--eval", writeStdoutScript], {
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

    stringIncludes(output, "writeSync");
    stringIncludes(output, "write");

    return;
  }

  if (NODE) {
    const o = spawnSync(node, ["--input-type=module", "--eval", writeStdoutScript], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`node run failed ${output} ${errorOutput}`);
    }

    stringIncludes(output, "writeSync");
    stringIncludes(output, "write");

    return;
  }
});

test("process::stderr", () => {
  if (DENO) {
    const o = spawnSync(deno, ["run", "-A", `${dir}/internal/write_stderr.ts`], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`deno run failed ${output} ${errorOutput}`);
    }

    stringIncludes(errorOutput, "writeSync");
    stringIncludes(errorOutput, "write");

    return;
  }

  if (BUN) {
    const o = spawnSync(bun, ["--eval", writeStderrScript], {
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

    stringIncludes(errorOutput, "writeSync");
    stringIncludes(errorOutput, "write");

    return;
  }

  if (NODE) {
    const o = spawnSync(node, ["--input-type=module", "--eval", writeStderrScript], {
      cwd: dir,
      encoding: "utf-8",
      stdio: "pipe",
    });

    const { status, stdout, stderr } = o;
    const code = status;
    const output = stdout;
    const errorOutput = stderr;

    if (code !== 0) {
      fail(`node run failed ${output} ${errorOutput}`);
    }

    stringIncludes(errorOutput, "writeSync");
    stringIncludes(errorOutput, "write");

    return;
  }
});

test("process::stdin.readSync", async () => {
  if (DENO) {
    const cmd = spawn(deno, ["run", "-A", `${dir}/internal/read_stdin.ts`], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`deno run failed ${output}`);
    }

    stringIncludes(output, "hello world");
    return;
  }

  if (BUN) {
    const cmd = spawn(bun, ["--eval", readStdinScript], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`bun run failed ${output}`);
    }

    stringIncludes(output, "hello world");
    return;
  }

  if (NODE) {
    const cmd = spawn(node, ["--input-type=module", "--eval", readStdinScript], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`node run failed ${output}`);
    }

    stringIncludes(output, "hello world");
    return;
  }
});

test("process::stdin.read", async () => {
  if (DENO) {
    const cmd = spawn(deno, ["run", "-A", `${dir}/internal/read_stdin_async.ts`], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`deno run failed ${output} with code ${code}`);
    }

    stringIncludes(output, "hello world");
    return;
  }

  if (BUN) {
    const cmd = spawn(bun, ["--eval", readStdinAsyncScript], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`bun run failed ${output}`);
    }

    stringIncludes(output, "hello world");
    return;
  }

  if (NODE) {
    const cmd = spawn(node, ["--input-type=module", "--eval", readStdinAsyncScript], {
      cwd: dir,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const data: Array<string> = [];
    cmd.stdout.on("data", (chunk) => {
      // really a buffer, but can be joined as a string
      data.push(chunk);
    });

    cmd.stdin.write("hello world");
    cmd.stdin.end();

    const waitForExit = new Promise((resolve) => {
      cmd.on("close", (code) => {
        resolve(code);
      });
    });

    await waitForExit;

    const code = cmd.exitCode;
    const output = data.join("");

    if (code !== 0) {
      fail(`node run failed ${output}`);
    }

    stringIncludes(output, "hello world");
    return;
  }
});
