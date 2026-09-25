import { join, resolve } from "@std/path";
import { expectedReports } from "./expected.ts";

const root = resolve(import.meta.dirname!, "..");
const cacheRoot = Deno.env.get("NEOTALES_RUNTIME_CACHE") ?? join(root, ".runtime-lab");
const resultPrefix = "__NEOTALES_RUNTIME_RESULT__";

type RuntimeName = "quickjs" | "txiki" | "jerry" | "clearscript";
type ScenarioName =
  | "core"
  | "fmtInspect"
  | "env"
  | "ansi"
  | "secrets"
  | "quickJsFs"
  | "txikiFs";
type Result = {
  expected: unknown;
  runtime: RuntimeName | "host";
  scenario: ScenarioName;
  status: "passed" | "failed";
};

type ProcessOutput = {
  code: number;
  stderr: string;
  stdout: string;
};

const runtimeNames: RuntimeName[] = ["quickjs", "txiki", "jerry", "clearscript"];
const selectedRuntimes = parseRuntimes(Deno.args);
const outputDir = await Deno.makeTempDir({ prefix: "neotales-runtime-lab-" });
const results: Result[] = [];
let clearScriptDll: string | undefined;

try {
  if (selectedRuntimes.has("clearscript")) {
    clearScriptDll = Deno.env.get("NEOTALES_RUNTIME_CLEARSCRIPT") ?? await buildClearScriptHost();
  }

  for (const runtime of selectedRuntimes) {
    switch (runtime) {
      case "quickjs":
        await runQuickJs();
        break;
      case "txiki":
        await runTxiki();
        break;
      case "jerry":
        await runJerryScript();
        break;
      case "clearscript":
        await runClearScript();
        break;
    }
  }
} finally {
  await Deno.remove(outputDir, { recursive: true });
}

console.table(results);
const failed = results.filter((result) => result.status === "failed");
if (failed.length) {
  console.error(`${failed.length} runtime scenario(s) failed.`);
  Deno.exit(1);
}
console.log(`${results.length} runtime scenario(s) passed.`);

function parseRuntimes(args: string[]): Set<RuntimeName> {
  const names = args.length ? args : runtimeNames;
  const invalid = names.filter((name) => !runtimeNames.includes(name as RuntimeName));
  if (invalid.length) {
    throw new Error(`Unknown runtime(s): ${invalid.join(", ")}`);
  }
  return new Set(names as RuntimeName[]);
}

function defaultRuntimePath(runtime: RuntimeName): string {
  switch (runtime) {
    case "quickjs":
      return join(cacheRoot, "quickjs-ng-v0.17.0", "qjs");
    case "txiki":
      return join(cacheRoot, "txiki-v26.6.0", "build", "tjs");
    case "jerry":
      return join(cacheRoot, "jerryscript-v3.0.0", "build", "bin", "jerry");
    case "clearscript":
      throw new Error("ClearScript is hosted by dotnet");
  }
}

function runtimePath(runtime: RuntimeName): string {
  const override = Deno.env.get(`NEOTALES_RUNTIME_${runtime.toUpperCase()}`);
  return override ?? defaultRuntimePath(runtime);
}

async function runProcess(command: string, args: string[]): Promise<ProcessOutput> {
  const output = await new Deno.Command(command, {
    args,
    cwd: root,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();
  return {
    code: output.code,
    stderr: new TextDecoder().decode(output.stderr),
    stdout: new TextDecoder().decode(output.stdout),
  };
}

function formatOutput(output: ProcessOutput): string {
  return `${output.stdout}\n${output.stderr}`.trim();
}

async function runCommandScenario(
  runtime: RuntimeName | "host",
  scenario: ScenarioName,
  expected: unknown,
  command: string,
  args: string[],
): Promise<void> {
  const output = await runProcess(command, args);
  const combined = `${output.stdout}\n${output.stderr}`;
  const marker = combined.indexOf(resultPrefix);
  let actual: unknown;
  let failure: string | undefined;

  if (output.code !== 0) {
    failure = `exited with ${output.code}`;
  } else if (marker < 0) {
    failure = "did not emit a runtime report";
  } else {
    const lineEnd = combined.indexOf("\n", marker);
    const serialized = combined.slice(
      marker + resultPrefix.length,
      lineEnd < 0 ? undefined : lineEnd,
    ).trim();
    try {
      actual = JSON.parse(serialized);
    } catch (error) {
      failure = `emitted invalid JSON: ${error instanceof Error ? error.message : error}`;
    }
  }

  if (!failure && JSON.stringify(actual) !== JSON.stringify(expected)) {
    failure = `report mismatch\n  expected: ${JSON.stringify(expected)}\n  actual:   ${
      JSON.stringify(actual)
    }`;
  }

  results.push({ expected, runtime, scenario, status: failure ? "failed" : "passed" });
  if (failure) console.error(`${runtime}/${scenario}: ${failure}\n${formatOutput(output)}`);
}

async function esbuildFixture(
  fixture: string,
  outputName: string,
  target = "es2020",
): Promise<string> {
  const output = join(outputDir, outputName);
  const fixturePath = join(root, "runtime-tests", "fixtures", fixture);
  const command = await runProcess("pnpm", [
    "exec",
    "esbuild",
    fixturePath,
    "--bundle",
    "--format=iife",
    "--platform=browser",
    `--target=${target}`,
    `--outfile=${output}`,
  ]);
  if (command.code !== 0) {
    throw new Error(`Unable to bundle ${fixture}:\n${formatOutput(command)}`);
  }
  return output;
}

async function denoBundleFixture(fixture: string, outputName: string): Promise<string> {
  const output = join(outputDir, outputName);
  const fixturePath = join(root, "runtime-tests", "fixtures", fixture);
  const command = await runProcess(Deno.execPath(), [
    "bundle",
    "--quiet",
    "--format=esm",
    "--platform=browser",
    `--output=${output}`,
    fixturePath,
  ]);
  if (command.code !== 0) {
    throw new Error(`Unable to bundle ${fixture}:\n${formatOutput(command)}`);
  }
  return output;
}

async function buildClearScriptHost(): Promise<string> {
  const project = join(root, "runtime-tests", "clearscript", "RuntimeLab.csproj");
  const build = await runProcess("dotnet", [
    "build",
    project,
    "--configuration=Release",
    "--nologo",
    "--verbosity=quiet",
  ]);
  if (build.code !== 0) {
    throw new Error(`Unable to build the ClearScript host:\n${formatOutput(build)}`);
  }
  return join(root, "runtime-tests", "clearscript", "bin", "Release", "net8.0", "RuntimeLab.dll");
}

async function runQuickJs(): Promise<void> {
  const executable = runtimePath("quickjs");
  const core = await esbuildFixture("core.ts", "quickjs-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "quickjs-fmt.js");
  const env = await esbuildFixture("env.ts", "quickjs-env.js");
  const ansi = await denoBundleFixture("ansi.ts", "quickjs-ansi.mjs");
  const fs = await esbuildFixture("quickjs_fs.ts", "quickjs-fs.js");

  await runCommandScenario("quickjs", "core", expectedReports.core, executable, ["--std", core]);
  await runCommandScenario(
    "quickjs",
    "fmtInspect",
    expectedReports.fmtInspect,
    executable,
    [inspect],
  );
  await runCommandScenario(
    "quickjs",
    "env",
    expectedReports.env,
    executable,
    ["--std", env],
  );
  await runCommandScenario("quickjs", "ansi", expectedReports.ansi, executable, ["-m", ansi]);
  await runCommandScenario("host", "quickJsFs", expectedReports.quickJsFs, executable, [
    "--std",
    fs,
  ]);
}

async function runTxiki(): Promise<void> {
  const executable = runtimePath("txiki");
  const core = await esbuildFixture("core.ts", "txiki-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "txiki-fmt.js");
  const ansi = await denoBundleFixture("ansi.ts", "txiki-ansi.mjs");
  const secrets = await esbuildFixture("secrets.ts", "txiki-secrets.js", "es2022");
  const fs = await esbuildFixture("txiki_fs.ts", "txiki-fs.js");

  await runCommandScenario("txiki", "core", expectedReports.core, executable, ["run", core]);
  await runCommandScenario(
    "txiki",
    "fmtInspect",
    expectedReports.fmtInspect,
    executable,
    ["run", inspect],
  );
  await runCommandScenario("txiki", "ansi", expectedReports.ansi, executable, ["run", ansi]);
  await runCommandScenario(
    "txiki",
    "secrets",
    expectedReports.secrets,
    executable,
    ["run", secrets],
  );
  await runCommandScenario("host", "txikiFs", expectedReports.txikiFs, executable, ["run", fs]);
}

async function runJerryScript(): Promise<void> {
  const executable = runtimePath("jerry");
  const core = await esbuildFixture("core.ts", "jerry-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "jerry-fmt.js");

  await runCommandScenario("jerry", "core", expectedReports.core, executable, [core]);
  await runCommandScenario(
    "jerry",
    "fmtInspect",
    expectedReports.fmtInspect,
    executable,
    [inspect],
  );
}

async function runClearScript(): Promise<void> {
  if (!clearScriptDll) throw new Error("ClearScript host was not built");
  const core = await esbuildFixture("core.ts", "clearscript-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "clearscript-fmt.js");

  await runCommandScenario(
    "clearscript",
    "core",
    expectedReports.core,
    "dotnet",
    ["--roll-forward", "Major", clearScriptDll, core],
  );
  await runCommandScenario(
    "clearscript",
    "fmtInspect",
    expectedReports.fmtInspect,
    "dotnet",
    ["--roll-forward", "Major", clearScriptDll, inspect],
  );
}
