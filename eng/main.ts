import { build, emptyDir, type EntryPoint } from "@deno/dnt";
import { copy } from "@std/fs";
import { basename, join, relative, resolve } from "@std/path";

const root = resolve(import.meta.dirname!, "..");
const upstreamJsr = resolve(
  (Deno.env.get("FROSTYETI_JSR") ?? "~/foss/frostyeti/js/jsr").replace(
    /^~(?=\/)/,
    Deno.env.get("HOME") ?? "",
  ),
);
const jsrDir = join(root, "jsr");
const npmDir = join(root, "npm");
const repository = "https://github.com/neotales/js-std";
const initialVersion = "0.0.0-alpha.0";
const oxfmt = join(root, "node_modules", ".bin", "oxfmt");
const oxlint = join(root, "node_modules", ".bin", "oxlint");

type DenoConfig = {
  name: string;
  version: string;
  license?: string;
  exports: Record<string, string>;
};

type DntConfig = {
  description?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type NpmMapping = {
  name: string;
  version: string;
  subPath?: string;
};

type WorkspaceConfig = {
  workspace?: string[];
};

type PackageJson = {
  name: string;
  version: string;
};

type PackResult = {
  filename: string;
  files?: Array<{ path: string }>;
};

type ReleasePackage = {
  module: string;
  npmName: string;
  version: string;
  jsrName: string;
  tarball: string;
};

function usage(): never {
  console.error(
    `Usage: deno task <task> <module>\n\nTasks:\n  import <module>  Import one upstream JSR module\n  modules          List importable upstream modules\n  normalize [module]  Reapply import transformations\n  build <module>   Build one module for npm with dnt\n  test [module] [--deno] [--node] [--bun]  Run selected tests\n  lint             Check source with oxlint\n  fmt [--check]    Format or check formatting with oxfmt\n  audit            Fail on moderate-or-higher npm vulnerabilities\n  check            Run lint, formatting, audit, and all tests\n  pack <module>    Create an npm tarball\n  release-prepare <tag>  Build release artifacts for version-changed modules\n  publish-bootstrap <module> [--dry-run]  First npmjs.org publish\n  publish <module> [--dry-run]  Publish one module to JSR and npm`,
  );
  Deno.exit(1);
}

function moduleName(args: string[]): string {
  const name = args.find((arg) => !arg.startsWith("-"));
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) usage();
  return name;
}

function releaseTag(args: string[]): string {
  const tag = args.find((arg) => !arg.startsWith("-"));
  if (!tag) usage();
  validateReleaseTag(tag);
  return tag;
}

async function run(command: string, args: string[], cwd = root): Promise<void> {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  }).output();
  if (!output.success) Deno.exit(output.code);
}

async function capture(command: string, args: string[], cwd = root): Promise<Deno.CommandOutput> {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stderr: "piped",
    stdout: "piped",
  }).output();
  return output;
}

async function publishToNpm(args: string[], cwd: string): Promise<void> {
  const authDir = await Deno.makeTempDir({ prefix: "neotales-npm-auth-" });
  const userConfig = join(authDir, ".npmrc");
  let output: Deno.CommandOutput | undefined;

  try {
    await Deno.writeTextFile(userConfig, "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n");
    output = await new Deno.Command("pnpm", {
      args,
      cwd,
      env: { ...Deno.env.toObject(), NPM_CONFIG_USERCONFIG: userConfig },
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    }).output();
  } finally {
    await Deno.remove(authDir, { recursive: true });
  }

  if (!output?.success) Deno.exit(output?.code ?? 1);
}

function outputText(output: Deno.CommandOutput): string {
  return `${new TextDecoder().decode(output.stdout)}${new TextDecoder().decode(output.stderr)}`;
}

async function git(args: string[]): Promise<string> {
  const output = await capture("git", args);
  if (!output.success) throw new Error(outputText(output).trim());
  return new TextDecoder().decode(output.stdout).trim();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function validateReleaseTag(tag: string): void {
  if (!/^v\d{4}\.\d{2}\.\d{2}-(?:r[1-9]\d*|nightly\.r[1-9]\d*|beta\.r[1-9]\d*)$/.test(tag)) {
    throw new Error(`Invalid release tag: ${tag}`);
  }
}

function requireNpmToken(): void {
  if (Deno.env.get("NODE_AUTH_TOKEN")) return;
  const token = prompt("NODE_AUTH_TOKEN (npm access token):")?.trim();
  if (!token) throw new Error("NODE_AUTH_TOKEN is required to publish to npmjs.org.");
  Deno.env.set("NODE_AUTH_TOKEN", token);
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

async function migrationModules(): Promise<string[]> {
  const configPath = join(upstreamJsr, "deno.json");
  const config = JSON.parse(await Deno.readTextFile(configPath)) as WorkspaceConfig;
  return (config.workspace ?? [])
    .map((workspace) => workspace.replace(/^\.\//, ""))
    .filter((name) => !["assert", "globals"].includes(name));
}

async function nextModule(): Promise<string | undefined> {
  for (const name of await migrationModules()) {
    if (!(await exists(join(jsrDir, name, "deno.json")))) return name;
  }
}

function rebrand(content: string): string {
  return content
    .replaceAll(
      "raw.githubusercontent.com/neotales/js-std/refs/heads/master/eng/assets/logo.png",
      "raw.githubusercontent.com/neotales/js-std/refs/heads/dev/eng/assets/logo.png",
    )
    .replaceAll("frostyeti%2Fjs", "neotales%2Fjs-std")
    .replaceAll("frostyeti%2F", "neotales%2F")
    .replaceAll("@frostyeti/", "@neotales/")
    .replaceAll("github.com/frostyeti/js", "github.com/neotales/js-std")
    .replaceAll(
      "raw.githubusercontent.com/frostyeti/js",
      "raw.githubusercontent.com/neotales/js-std",
    )
    .replaceAll("frostyeti", "neotales")
    .replaceAll("Frost Yeti", "Neotales")
    .replaceAll("frostyeti.com", "neotales.dev")
    .replace(
      /^Copyright (\d{4})(?:-\d{4})? (?:Frost Yeti|Neotales)(?: and Grim Frost Mage)?$/gm,
      "Copyright $1-2026 Neotales",
    );
}

function nodeAssertions(content: string): string {
  const imported = content.match(
    /^import \{([^}]+)\} from "@(?:frostyeti|neotales)\/assert";\r?\n/m,
  );
  if (!imported && !content.includes('from "node:assert/strict"')) return content;

  const direct: Record<string, string> = {
    equal: "deepStrictEqual",
    notEqual: "notDeepStrictEqual",
    strictEquals: "strictEqual",
    notStrictEquals: "notStrictEqual",
    ok: "ok",
    fail: "fail",
    throws: "throws",
    rejects: "rejects",
    match: "match",
    notMatch: "doesNotMatch",
  };
  const wrappers: Record<string, string> = {
    nope: "const nope = (value: unknown, message?: string) => ok(!value, message);",
    instanceOf:
      "const instanceOf = (value: unknown, constructor: abstract new (...args: never[]) => object, message?: string) => ok(value instanceof constructor, message);",
    notInstanceOf:
      "const notInstanceOf = (value: unknown, constructor: abstract new (...args: never[]) => object, message?: string) => ok(!(value instanceof constructor), message);",
    exists:
      "const exists = (value: unknown, message?: string) => ok(value !== null && value !== undefined, message);",
    stringIncludes:
      "const stringIncludes = (value: string, expected: string, message?: string) => ok(value.includes(expected), message);",
    arrayIncludes:
      "const arrayIncludes = <T>(value: readonly T[], expected: readonly T[], message?: string) => ok(expected.every((item) => value.includes(item)), message);",
    unreachable: "const unreachable = (message?: string) => fail(message);",
    unimplemented: "const unimplemented = (message?: string) => fail(message);",
    debug: "const debug = (..._values: unknown[]) => undefined;",
  };
  let result = content;
  const names = new Set<string>();
  if (imported) {
    for (const name of imported[1]
      .split(",")
      .map((assertionName) => assertionName.trim())
      .filter(Boolean)) {
      names.add(name);
    }
    result = result.replace(imported[0], "");
  }
  for (const [alias, native] of Object.entries(direct)) {
    const declaration = new RegExp(
      `^const ${alias}(?:: typeof assert\\.${native})? = assert\\.${native};\\r?\\n`,
      "m",
    );
    if (declaration.test(result)) {
      result = result.replace(declaration, "");
      names.add(alias);
    }
  }
  for (const name of Object.keys(wrappers)) {
    if (names.has(name)) continue;
    if (name === "debug" && result.includes("debug(")) names.add(name);
  }
  const assertionImports = [...names]
    .filter((name) => direct[name])
    .map((name) => (direct[name] === name ? name : `${direct[name]} as ${name}`));
  if (
    ["nope", "instanceOf", "notInstanceOf", "exists", "stringIncludes", "arrayIncludes"].some(
      (name) => names.has(name),
    )
  ) {
    assertionImports.push("ok");
  }
  if (["unreachable", "unimplemented"].some((name) => names.has(name))) {
    assertionImports.push("fail");
  }
  if (assertionImports.length) {
    result = result.replace(
      /^import assert from "node:assert\/strict";\r?\n/m,
      `import { ${[...new Set(assertionImports)].join(", ")} } from "node:assert/strict";\n`,
    );
    if (!result.includes('from "node:assert/strict"')) {
      result = `import { ${[...new Set(assertionImports)].join(
        ", ",
      )} } from "node:assert/strict";\n${result}`;
    }
  }
  const declarations = [...names].filter((name) => wrappers[name]).map((name) => wrappers[name]);
  if (declarations.length) {
    result = result.replace(/^(import[^\n]+\n)/m, `$1${declarations.join("\n")}\n`);
  }
  return result;
}

function nativeGlobals(content: string): string {
  return content.replace(
    /^(import|export) \{([^}]+)\} from "@(?:frostyeti|neotales)\/globals(?:\/globals|\/os)?";\r?\n/m,
    (_, kind: string, imports: string) => {
      const declarations: Record<string, string> = {
        globals: "const globals = globalThis;",
        WINDOWS:
          'const WINDOWS = (globalThis as { process?: { platform?: string } }).process?.platform === "win32" || (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows";',
        DARWIN:
          'const DARWIN = (globalThis as { process?: { platform?: string } }).process?.platform === "darwin" || (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "darwin";',
        DENO: "const DENO = !!(globalThis as { Deno?: unknown }).Deno;",
        NODE: 'const NODE = typeof process !== "undefined" && !!process.versions?.node;',
        BUN: 'const BUN = typeof Bun !== "undefined";',
        BROWSER: 'const BROWSER = typeof window !== "undefined";',
        NODELIKE:
          'const NODELIKE = (typeof process !== "undefined" && !!process.versions?.node) || typeof Bun !== "undefined";',
        RUNTIME:
          'const RUNTIME = (globalThis as { Deno?: unknown }).Deno ? "deno" : typeof Bun !== "undefined" ? "bun" : typeof process !== "undefined" && process.versions?.node ? "node" : typeof window !== "undefined" ? "browser" : "unknown";',
        EOL: 'const EOL = (globalThis as { process?: { platform?: string } }).process?.platform === "win32" || (globalThis as { Deno?: { build?: { os?: string } } }).Deno?.build?.os === "windows" ? "\\r\\n" : "\\n";',
        getGlobal:
          'const getGlobal = (path: string): unknown => path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, globalThis);',
      };
      const names = imports.split(",").map((name) => name.trim().replace(/^type /, ""));
      const unsupported = names.filter((name) => !declarations[name]);
      if (unsupported.length) {
        throw new Error(`Unsupported globals imports: ${unsupported.join(", ")}`);
      }
      return `${names
        .map((name) =>
          kind === "export"
            ? declarations[name].replace("const ", "export const ")
            : declarations[name],
        )
        .join("\n")}\n`;
    },
  );
}

function removeInternalDependency(
  dependencies?: Record<string, string>,
): Record<string, string> | undefined {
  if (!dependencies) return undefined;
  const result = Object.fromEntries(
    Object.entries(dependencies).filter(
      ([name]) =>
        ![
          "@frostyeti/assert",
          "@neotales/assert",
          "@frostyeti/globals",
          "@neotales/globals",
        ].includes(name),
    ),
  );
  return Object.keys(result).length ? result : undefined;
}

async function rewriteTree(path: string): Promise<void> {
  for await (const entry of Deno.readDir(path)) {
    const entryPath = join(path, entry.name);
    if (entry.isDirectory) {
      await rewriteTree(entryPath);
    } else if (/\.(?:ts|js|json|md)$/.test(entry.name)) {
      let content = rebrand(await Deno.readTextFile(entryPath));
      if (/\.(?:ts|js)$/.test(entry.name)) content = nativeGlobals(content);
      if (entry.name.endsWith(".test.ts")) content = nodeAssertions(content);
      await Deno.writeTextFile(entryPath, content);
    }
  }
}

async function importModule(name: string): Promise<void> {
  const planned = await migrationModules();
  if (!planned.includes(name)) {
    throw new Error(`${name} is not an importable module in the upstream workspace order.`);
  }
  const next = await nextModule();
  if (next && name !== next) {
    throw new Error(`Import ${next} before ${name}; modules must follow upstream workspace order.`);
  }
  const source = join(upstreamJsr, name);
  const destination = join(jsrDir, name);
  if (!(await exists(source))) throw new Error(`Upstream module not found: ${source}`);
  if (await exists(destination)) throw new Error(`Destination already exists: ${destination}`);

  await Deno.mkdir(jsrDir, { recursive: true });
  await copy(source, destination, { overwrite: false });
  await rewriteTree(destination);

  const dntPath = join(destination, "dnt.json");
  if (!(await exists(dntPath))) {
    await Deno.writeTextFile(dntPath, JSON.stringify({}, null, 2) + "\n");
  }

  const configPath = join(destination, "deno.json");
  const config = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
  config.name = config.name.replace("@frostyeti/", "@neotales/");
  // New imports start from this workspace's release baseline, not the upstream version.
  config.version = initialVersion;
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2) + "\n");

  const dntConfig = JSON.parse(await Deno.readTextFile(dntPath)) as DntConfig;
  dntConfig.dependencies = removeInternalDependency(dntConfig.dependencies);
  dntConfig.devDependencies = removeInternalDependency(dntConfig.devDependencies);
  dntConfig.peerDependencies = removeInternalDependency(dntConfig.peerDependencies);
  dntConfig.optionalDependencies = removeInternalDependency(dntConfig.optionalDependencies);
  await Deno.writeTextFile(dntPath, JSON.stringify(dntConfig, null, 2) + "\n");

  await run(oxfmt, ["--write", destination]);
  console.log(`Imported ${name}. Build it with: deno task build ${name}`);
}

async function normalizeModules(names: string[]): Promise<void> {
  const modules = names.length ? names : await importedModules();
  for (const name of modules) {
    const directory = join(jsrDir, name);
    if (!(await exists(join(directory, "deno.json")))) {
      throw new Error(`Unknown imported module: ${name}`);
    }
    await rewriteTree(directory);
    const dntPath = join(directory, "dnt.json");
    const dnt = JSON.parse(await Deno.readTextFile(dntPath)) as DntConfig;
    dnt.dependencies = removeInternalDependency(dnt.dependencies);
    dnt.devDependencies = removeInternalDependency(dnt.devDependencies);
    dnt.peerDependencies = removeInternalDependency(dnt.peerDependencies);
    dnt.optionalDependencies = removeInternalDependency(dnt.optionalDependencies);
    await Deno.writeTextFile(dntPath, JSON.stringify(dnt, null, 2) + "\n");
    await run(oxfmt, ["--write", directory]);
  }
}

async function buildModule(name: string): Promise<void> {
  const source = join(jsrDir, name);
  const configPath = join(source, "deno.json");
  if (!(await exists(configPath))) throw new Error(`Unknown imported module: ${name}`);

  const config = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
  const dntPath = join(source, "dnt.json");
  const dnt = JSON.parse(await Deno.readTextFile(dntPath)) as DntConfig;
  const missing = await missingWorkspaceDependencies(dnt);
  if (missing.length) {
    throw new Error(
      `Import required workspace modules before building ${name}: ${missing.join(", ")}`,
    );
  }
  const outDir = join(npmDir, name);
  const entries: EntryPoint[] = Object.entries(config.exports).map(([entryName, path]) => ({
    name: entryName,
    path,
  }));
  const packageName = config.name;
  const mappings = await workspaceMappings(source, dnt);

  await emptyDir(outDir);
  const originalCwd = Deno.cwd();
  try {
    Deno.chdir(source);
    await build({
      entryPoints: entries,
      outDir,
      declaration: "separate",
      esModule: true,
      scriptModule: false,
      skipSourceOutput: true,
      packageManager: "pnpm",
      mappings,

      test: true,
      shims: { deno: false },
      package: {
        name: packageName,
        version: config.version,
        description: dnt.description,
        keywords: dnt.keywords,
        license: config.license ?? "MIT",
        type: "module",
        repository: { type: "git", url: `git+${repository}.git`, directory: `npm/${name}` },
        bugs: { url: `${repository}/issues` },
        homepage: repository,
        engines: { node: ">=22" },
        scripts: { test: "node --test", "test:bun": "bun test" },
        dependencies: workspaceDependencies(dnt.dependencies),
        devDependencies: {
          "@types/node": "^22.0.0",
          ...workspaceDependencies(dnt.devDependencies),
        },
        peerDependencies: workspaceDependencies(dnt.peerDependencies),
        optionalDependencies: workspaceDependencies(dnt.optionalDependencies),
      },
      postBuild() {
        Deno.copyFileSync(join(source, "README.md"), join(outDir, "README.md"));
        Deno.copyFileSync(join(source, "LICENSE.md"), join(outDir, "LICENSE.md"));
        for (const runner of ["test_runner.cjs", "test_runner.js"]) {
          try {
            Deno.removeSync(join(outDir, runner));
          } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) throw error;
          }
        }
      },
    });
  } catch (error) {
    await emptyDir(outDir);
    throw error;
  } finally {
    Deno.chdir(originalCwd);
  }
  console.log(`Built ${packageName} in ${relative(root, outDir)}`);
}

async function missingWorkspaceDependencies(dnt: DntConfig): Promise<string[]> {
  const dependencies = [
    ...Object.keys(dnt.dependencies ?? {}),
    ...Object.keys(dnt.devDependencies ?? {}),
    ...Object.keys(dnt.peerDependencies ?? {}),
    ...Object.keys(dnt.optionalDependencies ?? {}),
  ];
  const missing = new Set<string>();
  for (const dependency of dependencies) {
    if (!dependency.startsWith("@neotales/") || dependency === "@neotales/globals") continue;
    const module = dependency.slice("@neotales/".length);
    if (!(await exists(join(jsrDir, module, "deno.json")))) missing.add(module);
  }
  return [...missing].sort();
}

function workspaceDependencies(
  dependencies?: Record<string, string>,
): Record<string, string> | undefined {
  if (!dependencies) return undefined;
  return Object.fromEntries(
    Object.entries(dependencies).map(([name, version]) => [
      name.replace("@frostyeti/", "@neotales/"),
      name.startsWith("@neotales/") ? "workspace:*" : version,
    ]),
  );
}

async function workspaceMappings(
  source: string,
  dnt: DntConfig,
): Promise<Record<string, NpmMapping>> {
  const dependencies = Object.keys(dnt.dependencies ?? {}).filter((name) =>
    name.startsWith("@neotales/"),
  );
  const mappings: Record<string, NpmMapping> = {};

  async function collect(path: string): Promise<void> {
    for await (const entry of Deno.readDir(path)) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory) {
        await collect(entryPath);
      } else if (entry.isFile && entry.name.endsWith(".ts")) {
        const content = await Deno.readTextFile(entryPath);
        for (const match of content.matchAll(
          /(?:from\s*|import\s*(?:\(\s*)?)["'](@neotales\/[^"']+)["']/g,
        )) {
          const specifier = match[1];
          const dependency = dependencies.find(
            (name) => specifier === name || specifier.startsWith(`${name}/`),
          );
          if (!dependency) continue;
          const subPath = specifier.slice(dependency.length + 1);
          mappings[specifier] = {
            name: dependency,
            version: "workspace:*",
            ...(subPath ? { subPath } : {}),
          };
        }
      }
    }
  }

  await collect(source);
  return mappings;
}

async function importedModules(): Promise<string[]> {
  const modules: string[] = [];
  for await (const entry of Deno.readDir(jsrDir)) {
    if (entry.isDirectory && (await exists(join(jsrDir, entry.name, "deno.json")))) {
      modules.push(entry.name);
    }
  }
  return modules.sort();
}

async function testModules(names: string[], runtimes: Set<string>): Promise<void> {
  const modules = names.length ? names : await importedModules();
  if (!modules.length) throw new Error("No modules have been imported.");
  const selected = runtimes.size ? runtimes : new Set(["deno", "node", "bun"]);
  if (selected.has("node") || selected.has("bun")) await run("pnpm", ["install"]);
  for (const name of modules) {
    if (selected.has("deno")) await run("deno", ["test", "-A"], join(jsrDir, name));
    const npmPackage = join(npmDir, name, "package.json");
    if (await exists(npmPackage)) {
      if (selected.has("node")) await run("pnpm", ["test"], join(npmDir, name));
      if (selected.has("bun")) await run("pnpm", ["test:bun"], join(npmDir, name));
    }
  }
}

async function audit(): Promise<void> {
  const output = await capture("pnpm", ["audit", "--audit-level", "moderate", "--json"]);
  if (!output.success) {
    throw new Error(`Dependency audit failed:\n${outputText(output).trim()}`);
  }
}

async function check(): Promise<void> {
  await run(oxlint, ["jsr", "eng"]);
  await run(oxfmt, [
    "--check",
    "--ignore-path",
    ".prettierignore",
    "eng",
    "jsr",
    "README.md",
    "LICENSE.md",
    "deno.json",
    "package.json",
    "pnpm-workspace.yaml",
    ".oxlintrc.json",
    ".oxfmtrc.json",
  ]);
  await audit();
  await testModules([], new Set());
}

async function releasePackages(baseTag?: string): Promise<ReleasePackage[]> {
  const modules = await importedModules();
  const changed: ReleasePackage[] = [];
  for (const module of modules) {
    const configPath = join(jsrDir, module, "deno.json");
    const current = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
    if (!baseTag) {
      changed.push({
        module,
        npmName: current.name,
        version: current.version,
        jsrName: current.name,
        tarball: "",
      });
      continue;
    }
    const previous = await capture("git", ["show", `${baseTag}:${relative(root, configPath)}`]);
    if (!previous.success) {
      changed.push({
        module,
        npmName: current.name,
        version: current.version,
        jsrName: current.name,
        tarball: "",
      });
      continue;
    }
    const old = JSON.parse(new TextDecoder().decode(previous.stdout)) as DenoConfig;
    if (old.version !== current.version) {
      changed.push({
        module,
        npmName: current.name,
        version: current.version,
        jsrName: current.name,
        tarball: "",
      });
    }
  }
  return changed;
}

async function previousReleaseTag(currentTag: string): Promise<string | undefined> {
  const tags = (await git(["tag", "--merged", "HEAD", "--sort=-creatordate"]))
    .split("\n")
    .filter((tag) => tag && tag !== currentTag);
  return tags[0];
}

async function releaseCommitNotes(baseTag?: string): Promise<string[]> {
  const commits = await git(["log", "--format=%s", ...(baseTag ? [`${baseTag}..HEAD`] : [])]);
  return commits
    .split("\n")
    .filter((subject) =>
      /^(?:feat|fix|bug|perf|refactor|docs|chore)(?:\([^)]+\))?!?:/.test(subject),
    )
    .map((subject) => `- ${subject}`);
}

async function releasePrepare(tag: string): Promise<void> {
  validateReleaseTag(tag);
  const baseTag = await previousReleaseTag(tag);
  await check();
  const packages = await releasePackages(baseTag);
  if (!packages.length) throw new Error(`No package versions changed since ${baseTag}.`);

  const artifacts = join(root, "artifacts", tag);
  await emptyDir(artifacts);
  for (const pkg of packages) {
    await buildModule(pkg.module);
    const packageDir = join(npmDir, pkg.module);
    const pack = await capture(
      "pnpm",
      ["pack", "--pack-destination", artifacts, "--json"],
      packageDir,
    );
    if (!pack.success) throw new Error(outputText(pack).trim());
    const packed = JSON.parse(new TextDecoder().decode(pack.stdout)) as PackResult | PackResult[];
    const result = Array.isArray(packed) ? packed[0] : packed;
    pkg.tarball = basename(result.filename);
  }

  const commits = await releaseCommitNotes(baseTag);
  const notes = [
    `# ${tag}`,
    "",
    "## Packages",
    ...packages.map((pkg) => `- ${pkg.npmName}@${pkg.version}`),
    "",
    "## Changes",
    ...(commits.length ? commits : ["- No Conventional Commit messages found."]),
    "",
  ].join("\n");
  await Deno.writeTextFile(join(artifacts, "CHANGELOG.md"), notes);
  await Deno.writeTextFile(
    join(artifacts, "release.json"),
    JSON.stringify({ tag, baseTag: baseTag ?? null, packages }, null, 2) + "\n",
  );
  console.log(
    `Prepared ${packages.length} package release artifact(s) in ${relative(root, artifacts)}.`,
  );
}

async function publishModule(name: string, dryRun: boolean): Promise<void> {
  await run("deno", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(jsrDir, name));
  await run("pnpm", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(npmDir, name));
}

async function bootstrapPublishModule(name: string, dryRun: boolean): Promise<void> {
  requireNpmToken();
  await run(oxlint, ["jsr", "eng"]);
  await run(oxfmt, [
    "--check",
    "--ignore-path",
    ".prettierignore",
    "eng",
    "jsr",
    "README.md",
    "LICENSE.md",
    "deno.json",
    "package.json",
    "pnpm-workspace.yaml",
    ".oxlintrc.json",
    ".oxfmtrc.json",
  ]);
  const packageDir = join(npmDir, name);
  const packagePath = join(packageDir, "package.json");
  if (!(await exists(packagePath))) await buildModule(name);

  const pkg = JSON.parse(await Deno.readTextFile(packagePath)) as PackageJson;
  const packageLookup = await capture("pnpm", [
    "view",
    pkg.name,
    "version",
    "--json",
    "--registry",
    "https://registry.npmjs.org",
  ]);
  if (packageLookup.success) {
    throw new Error(
      `${pkg.name} already exists on npmjs.org; publish later versions through GitHub Actions.`,
    );
  }
  const lookupOutput = `${new TextDecoder().decode(packageLookup.stdout)}${new TextDecoder().decode(
    packageLookup.stderr,
  )}`;
  if (!lookupOutput.includes("E404") && !lookupOutput.includes("404")) {
    throw new Error(
      `Unable to verify whether ${pkg.name} exists on npmjs.org: ${lookupOutput.trim()}`,
    );
  }

  await testModules([name], new Set());

  for await (const entry of Deno.readDir(packageDir)) {
    if (entry.isFile && entry.name.endsWith(".tgz")) {
      await Deno.remove(join(packageDir, entry.name));
    }
  }

  const pack = await capture("pnpm", ["pack", "--json"], packageDir);
  if (!pack.success) throw new Error(new TextDecoder().decode(pack.stderr));
  const packed = JSON.parse(new TextDecoder().decode(pack.stdout)) as PackResult | PackResult[];
  const result = Array.isArray(packed) ? packed[0] : packed;
  const tarball = join(packageDir, result.filename);
  const size = (await Deno.stat(tarball)).size;
  let unpackedSize = 0;
  for (const file of result.files ?? []) {
    if (file.path !== result.filename) {
      unpackedSize += (await Deno.stat(join(packageDir, file.path))).size;
    }
  }
  console.log(`Prepared ${pkg.name}@${pkg.version}`);
  console.log(
    `Tarball: ${relative(root, tarball)} (${formatBytes(size)} compressed, ${formatBytes(
      unpackedSize,
    )} unpacked)`,
  );

  await publishToNpm(
    [
      "publish",
      result.filename,
      "--access",
      "public",
      "--registry",
      "https://registry.npmjs.org",
      ...(dryRun ? ["--dry-run"] : []),
      ...(dryRun ? ["--no-git-checks"] : []),
    ],
    packageDir,
  );
}

const [command, ...args] = Deno.args;
switch (command) {
  case "import":
    await importModule(moduleName(args));
    break;
  case "modules":
    for (const name of await migrationModules()) {
      const state = (await exists(join(jsrDir, name, "deno.json"))) ? "imported" : "pending";
      console.log(`${state.padEnd(8)} ${name}`);
    }
    break;
  case "normalize":
    await normalizeModules(args.filter((arg) => !arg.startsWith("-")));
    break;
  case "build":
    await buildModule(moduleName(args));
    break;
  case "test":
    {
      const flags = args.filter((arg) => arg.startsWith("--"));
      const runtimes = new Set(flags.map((flag) => flag.slice(2)));
      const invalid = [...runtimes].filter((runtime) => !["deno", "node", "bun"].includes(runtime));
      if (invalid.length) throw new Error(`Unknown test runtime flag: --${invalid.join(", --")}`);
      await testModules(
        args.filter((arg) => !arg.startsWith("-")),
        runtimes,
      );
    }
    break;
  case "lint":
    await run(oxlint, ["jsr", "eng"]);
    break;
  case "fmt":
    await run(oxfmt, [
      ...(args.includes("--check") ? ["--check"] : ["--write"]),
      "--ignore-path",
      ".prettierignore",
      "eng",
      "jsr",
      "README.md",
      "LICENSE.md",
      "deno.json",
      "package.json",
      "pnpm-workspace.yaml",
      ".oxlintrc.json",
      ".oxfmtrc.json",
    ]);
    break;
  case "audit":
    await audit();
    break;
  case "check":
    await check();
    break;
  case "pack":
    await run("pnpm", ["pack"], join(npmDir, moduleName(args)));
    break;
  case "release-prepare":
    await releasePrepare(releaseTag(args));
    break;
  case "publish-bootstrap":
    await bootstrapPublishModule(moduleName(args), args.includes("--dry-run"));
    break;
  case "publish":
    await publishModule(moduleName(args), args.includes("--dry-run"));
    break;
  default:
    usage();
}
