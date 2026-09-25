import { existsSync } from "node:fs";
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
  | "moduleFs"
  | "jsOs"
  | "hostGlobals"
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
  return await esbuildEntry(
    join(root, "runtime-tests", "fixtures", fixture),
    outputName,
    target,
    "--format=iife",
    "--platform=browser",
  );
}

async function esbuildEntry(
  entry: string,
  outputName: string,
  target: string,
  ...flags: string[]
): Promise<string> {
  const output = join(outputDir, outputName);
  const command = await runProcess("pnpm", [
    "exec",
    "esbuild",
    entry,
    "--bundle",
    ...flags,
    `--target=${target}`,
    `--outfile=${output}`,
  ]);
  if (command.code !== 0) {
    throw new Error(`Unable to bundle ${entry}:\n${formatOutput(command)}`);
  }
  return output;
}

/**
 * Wraps an esbuild ESM bundle so a classic-script host can evaluate it.
 *
 * Bundles that contain top-level await cannot be emitted as IIFEs, so the harness rewrites
 * the bundle into an async IIFE and publishes the resulting promise on
 * `globalThis.__neotalesPromise`, which the host awaits. Only fully self-contained bundles
 * are accepted: no import or export statement may remain, and the bundle is rejected if any
 * do, so a stray external dependency fails loudly instead of silently disappearing.
 */
async function esbuildModuleBundle(
  entry: string,
  outputName: string,
  target = "es2022",
): Promise<string> {
  const intermediate = join(outputDir, `${outputName}.module.mjs`);
  const output = join(outputDir, outputName);
  const build = await runProcess("pnpm", [
    "exec",
    "esbuild",
    entry,
    "--bundle",
    "--format=esm",
    "--platform=node",
    `--target=${target}`,
    // Classic scripts have no `import.meta`. Bundles that reference it, such as the js-os
    // modules, are given a stable file URL of the bundle itself.
    `--define:import.meta.url=${JSON.stringify(`file://${intermediate}`)}`,
    `--outfile=${intermediate}`,
  ]);
  if (build.code !== 0) {
    throw new Error(`Unable to bundle ${entry}:\n${formatOutput(build)}`);
  }

  let source = await Deno.readTextFile(intermediate);
  const imports = new Map<string, string[]>();
  const unexpected: string[] = [];
  source = source
    .split("\n")
    .filter((line) => {
      const statement = /^\s*(import|export)\b.*$/.exec(line);
      if (!statement) return true;
      const text = line.trim();
      if (text.startsWith("export")) return false;
      const parsed = /^import\s*\{([^}]*)\}\s*from\s*"([^"]+)";?$/.exec(text);
      if (parsed) {
        const names = parsed[1].split(",").map((name) =>
          name.trim().split(/\s+as\s+/).pop()!.trim()
        );
        const specifier = parsed[2];
        imports.set(specifier, [...(imports.get(specifier) ?? []), ...names]);
        return false;
      }
      unexpected.push(text);
      return false;
    })
    .join("\n");

  if (unexpected.length > 0) {
    throw new Error(
      `${outputName} contains module statements this harness cannot rewrite:\n${
        unexpected.join("\n")
      }`,
    );
  }

  // Static imports cannot be evaluated inside an async IIFE, so the host resolves each builtin
  // through the compatibility layer's registry and the bundle binds the names itself.
  const preamble: string[] = [];
  for (const [specifier, names] of imports) {
    preamble.push(
      `  const { ${[...new Set(names)].join(", ")} } = globalThis.process.getBuiltinModule(${
        JSON.stringify(specifier)
      });`,
    );
  }
  if (preamble.length === 0) {
    preamble.push("  void 0;");
  }

  const wrapper = [
    "globalThis.__neotalesPromise = (async () => {",
    ...preamble,
    source,
    "})();",
  ].join("\n");
  await Deno.writeTextFile(output, wrapper);
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
  const project = join(
    root,
    "clearscript",
    "src",
    "Neotales.ClearScript.Cli",
    "Neotales.ClearScript.Cli.csproj",
  );
  const build = await runProcess("dotnet", [
    "build",
    project,
    "--configuration=Release",
    "--nologo",
    "--verbosity=quiet",
  ]);
  if (build.code !== 0) {
    throw new Error(`Unable to build the Neotales.ClearScript host:\n${formatOutput(build)}`);
  }
  return join(
    root,
    "clearscript",
    "src",
    "Neotales.ClearScript.Cli",
    "bin",
    "Release",
    "net8.0",
    "neotales-clearscript.dll",
  );
}

async function runQuickJs(): Promise<void> {
  const executable = runtimePath("quickjs");
  const core = await esbuildFixture("core.ts", "quickjs-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "quickjs-fmt.js");
  const env = await esbuildFixture("quickjs_env.ts", "quickjs-env.js");
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
  const ansi = await esbuildFixture("ansi.ts", "jerry-ansi.js");

  await runCommandScenario("jerry", "core", expectedReports.core, executable, [core]);
  await runCommandScenario(
    "jerry",
    "fmtInspect",
    expectedReports.fmtInspect,
    executable,
    [inspect],
  );
  await runCommandScenario("jerry", "ansi", expectedReports.ansi, executable, [ansi]);
}

/**
 * Resolves the sibling js-os repository.
 *
 * The js-os modules are not vendored here, so their location comes from `NEOTALES_JS_OS` when
 * set and otherwise from the expected sibling directory.
 */
function jsOsRoot(): string {
  const configured = Deno.env.get("NEOTALES_JS_OS");
  if (configured) return resolve(configured);
  const sibling = resolve(root, "..", "js-os", "jsr");
  if (!existsSync(join(sibling, "is-elevated", "mod.ts"))) {
    throw new Error(
      `Unable to find the js-os modules. Set NEOTALES_JS_OS to the directory that contains them; looked in ${sibling}.`,
    );
  }
  return sibling;
}

/**
 * Generates a js-os entry module.
 *
 * esbuild resolves static imports at build time, so the module paths are written into a
 * generated entry file instead of being computed at runtime.
 */
async function jsOsEntry(): Promise<string> {
  const entry = join(outputDir, "js-os-entry.ts");
  const modules = jsOsRoot();
  const source = [
    `import * as isElevated from "${modules}/is-elevated/mod.ts";`,
    `import * as libsecret from "${modules}/linux-libsecret/mod.ts";`,
    `import * as winCred from "${modules}/win-cred/mod.ts";`,
    `import * as winDpapi from "${modules}/win-dpapi/mod.ts";`,
    `import * as winRegistry from "${modules}/win-registry/mod.ts";`,
    `import { emitRuntimeReport } from "${
      join(root, "runtime-tests", "emit.ts").replaceAll("\\", "\\\\")
    }";`,
    `import { runJsOsScenario } from "${
      join(root, "runtime-tests", "scenarios", "js_os.ts").replaceAll("\\", "\\\\")
    }";`,
    "",
    "// The vault modules probe for a foreign function interface while loading. ClearScript has",
    "// none, so each is expected to load and report itself unavailable, which is the behavior",
    "// their `isAvailable()` predicates promise for unsupported hosts.",
    "globalThis.__neotalesPromise = Promise.resolve(0).then(() => {",
    "  emitRuntimeReport(runJsOsScenario({ isElevated, libsecret, winCred, winDpapi, winRegistry }));",
    "});",
  ].join("\n");
  await Deno.writeTextFile(entry, source);
  return entry;
}

async function runClearScript(): Promise<void> {
  if (!clearScriptDll) throw new Error("Neotales.ClearScript host was not built");
  const run = (scenario: ScenarioName, expected: unknown, bundle: string): Promise<void> =>
    runCommandScenario("clearscript", scenario, expected, "dotnet", [
      "--roll-forward",
      "Major",
      clearScriptDll,
      bundle,
    ]);

  const core = await esbuildFixture("core.ts", "clearscript-core.js");
  const inspect = await esbuildFixture("fmt_inspect.ts", "clearscript-fmt.js");
  const ansi = await esbuildFixture("ansi.ts", "clearscript-ansi.js");
  const env = await esbuildFixture("clearscript_env.ts", "clearscript-env.js");
  const fileSystem = await esbuildFixture("fs.ts", "clearscript-fs.js");
  // Web Crypto is not part of the V8 host, so `secrets` is bundled at es2022 like txiki.js and
  // exercised through the same asynchronous fixture shape the module already uses.
  const secrets = await esbuildFixture("secrets.ts", "clearscript-secrets.js", "es2022");
  const jsOs = await esbuildModuleBundle(await jsOsEntry(), "clearscript-js-os.js");
  const hostGlobals = await esbuildFixture("host_globals.ts", "clearscript-host-globals.js");

  await run("core", expectedReports.core, core);
  await run("fmtInspect", expectedReports.fmtInspect, inspect);
  await run("ansi", expectedReports.ansi, ansi);
  await run("env", expectedReports.clearScriptEnv, env);
  await run("moduleFs", expectedReports.moduleFs, fileSystem);
  await run("secrets", expectedReports.secrets, secrets);
  await run("jsOs", expectedReports.jsOs, jsOs);
  await run("hostGlobals", expectedReports.hostGlobals, hostGlobals);
}
