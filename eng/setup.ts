/**
 * Developer bootstrap and environment doctor.
 *
 * `deno task setup` prepares every runtime the conformance suite can use on this machine.
 * `deno task doctor` answers the same question without installing anything, so it is safe
 * to run first and cheap enough to run on every change.
 *
 * Everything is opt-out and resumable. The native engines are delegated to
 * `runtime-tests/setup.ts`, which already pins versions and verifies checksums, so there is
 * one place that knows how to fetch an engine.
 */

import { join, resolve } from "@std/path";
import { environmentsInTier, parseRuntimeTable } from "./runtimes.ts";

const root = resolve(import.meta.dirname!, "..");
const cacheRoot = Deno.env.get("NEOTALES_RUNTIME_CACHE") ?? join(root, ".runtime-lab");

const args = Deno.args;
const mode = args.includes("doctor") ? "doctor" : "setup";
const only = readOption("--only");
const skip = new Set(readOption("--skip")?.split(",").map((value) => value.trim()) ?? []);
const shouldRun = (name: string): boolean =>
  (only === undefined || only.split(",").map((v) => v.trim()).includes(name)) && !skip.has(name);

const table = parseRuntimeTable(await Deno.readTextFile(join(root, "runtimes.json")));

type Status = "ready" | "missing" | "absent" | "error";

interface Check {
  name: string;
  status: Status;
  detail: string;
  hint?: string;
}

const checks: Check[] = [];

function record(check: Check): Check {
  checks.push(check);
  return check;
}

async function which(command: string, args_: string[] = ["--version"]): Promise<string | null> {
  try {
    const output = await new Deno.Command(command, {
      args: args_,
      stdout: "piped",
      stderr: "piped",
    }).output();
    if (!output.success) return null;
    const text = new TextDecoder().decode(output.stdout).trim() ||
      new TextDecoder().decode(output.stderr).trim();
    return text.split("\n")[0] ?? "";
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

// --- Host tooling -----------------------------------------------------------

async function checkHostTools(): Promise<void> {
  const mise = await which("mise");
  record({
    name: "mise",
    status: mise ? "ready" : "missing",
    detail: mise ?? "not found on PATH",
    ...(mise ? {} : { hint: "see https://mise.jdx.dev, or install the tools by hand" }),
  });

  // mise owns the version pins, so report what is actually resolvable rather than
  // trusting whatever happens to be first on PATH.
  const tools: [string, string][] = [
    ["deno", "mise install deno"],
    ["node", "mise install node"],
    ["bun", "mise install bun"],
    ["pnpm", "mise install pnpm"],
    ["git", "install git"],
  ];
  for (const [command, hint] of tools) {
    const version = await which(command);
    record({
      name: command,
      status: version ? "ready" : "missing",
      detail: version ?? "not found on PATH",
      ...(version ? {} : { hint: mise ? hint : "install it, or run mise install" }),
    });
  }

  // Only txiki.js and JerryScript need a compiler, because they are built from source.
  if (shouldRun("txiki") || shouldRun("jerry")) {
    for (const command of ["cc", "cmake"]) {
      const version = await which(command, ["--version"]);
      record({
        name: command,
        status: version ? "ready" : "missing",
        detail: version ?? "not found on PATH",
        ...(version ? {} : { hint: "apt-get install build-essential cmake" }),
      });
    }
  }
}

/**
 * Engines mise cannot supply. Both projects publish no Linux release binary, so they are
 * built from a pinned tag instead. Recorded so the gap reads as a decision rather than a
 * missing entry in mise.toml.
 */
const sourceBuildOnly: Record<string, string> = {
  txiki: "no Linux release binary is published, so it is built from a pinned tag",
  jerry: "no release binaries are published at all, so it is built from a pinned tag",
};

// --- Runtimes ---------------------------------------------------------------

async function checkDotnet(): Promise<void> {
  const version = await which("dotnet", ["--version"]);
  const present = version !== null;
  record({
    name: "dotnet",
    status: present ? "ready" : "missing",
    detail: version ?? "not found on PATH",
    ...(present ? {} : { hint: "install the .NET 8 SDK or newer" }),
  });
}

async function checkChromium(): Promise<void> {
  // Playwright owns the browser binaries, so the check has to ask Playwright.
  const version = await which("pnpm", ["exec", "playwright", "--version"]);
  if (!version) {
    record({
      name: "chromium",
      status: "missing",
      detail: "playwright is not available",
      hint: "run pnpm install first",
    });
    return;
  }
  const installed = await playwrightRoot();
  record({
    name: "chromium",
    status: installed ? "ready" : "missing",
    detail: installed ?? "browser not downloaded",
    ...(installed ? {} : { hint: "deno task setup --only=browser" }),
  });
}

async function playwrightRoot(): Promise<string | null> {
  try {
    const output = await new Deno.Command("pnpm", {
      args: ["exec", "playwright", "install", "--dry-run", "chromium"],
      stdout: "piped",
      stderr: "piped",
    }).output();
    const text = new TextDecoder().decode(output.stdout) +
      new TextDecoder().decode(output.stderr);
    const match = /Install location:\s*(\S+)/.exec(text) ?? /browser:\s*(\S+)/.exec(text);
    if (!match) return null;
    return await exists(match[1]) ? match[1] : null;
  } catch {
    return null;
  }
}

function enginePath(id: string): string {
  const paths: Record<string, string> = {
    quickjs: join(cacheRoot, `quickjs-ng-v0.17.0`, Deno.build.os === "windows" ? "qjs.exe" : "qjs"),
    txiki: join(cacheRoot, "txiki-v26.6.0", "build", "tjs"),
    jerry: join(cacheRoot, "jerryscript-v3.0.0", "build", "bin", "jerry"),
  };
  return paths[id];
}

async function checkEngines(): Promise<void> {
  for (const id of ["quickjs", "txiki", "jerry"]) {
    if (!environmentsInTier(table, "embedded").includes(id)) continue;
    if (Deno.env.get(`NEOTALES_RUNTIME_${id.toUpperCase()}`)) {
      record({ name: id, status: "ready", detail: "using a NEOTALES_RUNTIME override" });
      continue;
    }
    const path = enginePath(id);
    const present = await exists(path);
    const reason = sourceBuildOnly[id];
    record({
      name: id,
      status: present ? "ready" : "missing",
      detail: present ? path : "not built",
      ...(present ? {} : { hint: `deno task setup --only=${id}${reason ? ` (${reason})` : ""}` }),
    });
  }

  // ClearScript is built from source on demand, so a successful dotnet check is the gate.
  const dotnet = checks.find((check) => check.name === "dotnet");
  const built = await exists(
    join(
      root,
      "clearscript",
      "src",
      "Neotales.ClearScript.Cli",
      "bin",
      "Release",
      "net8.0",
      "neotales-clearscript.dll",
    ),
  );
  record({
    name: "clearscript",
    status: dotnet?.status === "ready" ? "ready" : "missing",
    detail: built
      ? "built"
      : dotnet?.status === "ready"
      ? "dotnet present, host not built yet"
      : "no dotnet",
    ...(dotnet?.status === "ready" ? {} : { hint: "deno task setup --only=clearscript" }),
  });
}

async function checkWorkerd(): Promise<void> {
  const version = await which("pnpm", ["exec", "wrangler", "--version"]);
  record({
    name: "workerd",
    status: version ? "ready" : "missing",
    detail: version ?? "wrangler is not installed",
    ...(version ? {} : { hint: "run pnpm install" }),
  });
}

// --- Reporting --------------------------------------------------------------

function symbol(status: Status): string {
  switch (status) {
    case "ready":
      return "ok  ";
    case "missing":
      return "todo";
    case "absent":
      return "n/a ";
    case "error":
      return "FAIL";
  }
}

function print(): void {
  const width = Math.max(...checks.map((check) => check.name.length), 4);
  for (const check of checks) {
    console.log(`  ${symbol(check.status)}  ${check.name.padEnd(width)}  ${check.detail}`);
    if (check.hint && check.status !== "ready") {
      console.log(`  ${" ".repeat(width + 8)}${check.hint}`);
    }
  }
  const blocked = checks.filter((check) => check.status === "missing" || check.status === "error");
  console.log(
    blocked.length === 0
      ? "\nAll environments are ready."
      : `\n${blocked.length} of ${checks.length} checks are not ready. ` +
        `The core runtimes still work; the rest need \`deno task setup\`.`,
  );
}

function readOption(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

// --- Install steps ----------------------------------------------------------

async function install(): Promise<void> {
  const engines = (["quickjs", "txiki", "jerry"] as const)
    .filter((engine) => shouldRun(engine));

  if (engines.length > 0) {
    console.log("\nPreparing native engines...");
    const setup = join(root, "runtime-tests", "setup.ts");
    const command = new Deno.Command(Deno.execPath(), {
      args: ["run", "-A", setup, ...engines],
      cwd: root,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    if (!(await command.output()).success) {
      throw new Error("Native engine setup failed.");
    }
  }

  if (shouldRun("browser")) {
    console.log("\nInstalling Chromium for the browser tier...");
    const command = new Deno.Command("pnpm", {
      args: ["exec", "playwright", "install", "chromium"],
      cwd: root,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });
    if (!(await command.output()).success) {
      console.log("  Chromium install failed. The browser tier will stay unavailable.");
    }
  }

  if (shouldRun("clearscript")) {
    const dotnet = await which("dotnet", ["--version"]);
    if (!dotnet) {
      console.log("\nSkipping the ClearScript host: dotnet was not found on PATH.");
    } else {
      console.log("\nBuilding the Neotales.ClearScript host...");
      const project = join(
        root,
        "clearscript",
        "src",
        "Neotales.ClearScript.Cli",
        "Neotales.ClearScript.Cli.csproj",
      );
      const command = new Deno.Command("dotnet", {
        args: ["build", project, "--configuration=Release", "--nologo", "--verbosity=quiet"],
        cwd: root,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      });
      if (!(await command.output()).success) {
        console.log("  The ClearScript build failed. That tier will stay unavailable.");
      }
    }
  }
}

await checkHostTools();
await checkWorkerd();
await checkDotnet();
await checkEngines();
await checkChromium();

if (mode === "setup") await install();

console.log(`\nRuntime environment (${mode})`);
print();

if (
  mode === "doctor" && checks.some((check) => check.name === "deno" && check.status !== "ready")
) {
  Deno.exit(1);
}
