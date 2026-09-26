import { build, emptyDir, type EntryPoint } from "@deno/dnt";
import { join, relative, resolve } from "@std/path";
import { parseRuntimeTable, supports } from "./runtimes.ts";
import { verifyReadmes, writeReadmes } from "./readme.ts";

const root = resolve(import.meta.dirname!, "..");
const jsrDir = join(root, "jsr");
const npmDir = join(root, "npm");
const repository = "https://github.com/neotales/js-std";
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
};

function usage(): never {
  console.error(
    `Usage: deno task <task> <module>\n\nTasks:\n  build <module>   Build one module for npm with dnt\n  test [module] [--deno] [--node] [--bun]  Run selected tests\n  lint             Check source with oxlint\n  fmt [--check]    Format or check formatting with deno fmt\n  audit            Fail on moderate-or-higher npm vulnerabilities\n  check            Run lint, formatting, audit, and all tests\n  pack <module>    Create an npm tarball\n  release-prepare <tag>  Build release artifacts for version-changed modules\n  publish-bootstrap <module> [--dry-run]  First npmjs.org publish\n  publish <module> [--dry-run]  Publish one module to JSR and npm`,
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
      `Build required workspace modules before building ${name}: ${missing.join(", ")}`,
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

        function clean(directory: string): void {
          for (const entry of Deno.readDirSync(directory)) {
            const entryPath = join(directory, entry.name);
            if (entry.isDirectory) {
              clean(entryPath);
            } else if (entry.isFile && entry.name.endsWith(".js")) {
              const content = Deno.readTextFileSync(entryPath);
              const cleaned = content.replace(/[\t ]+$/gm, "");
              if (cleaned !== content) Deno.writeTextFileSync(entryPath, cleaned);
            }
          }
        }

        clean(outDir);
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
    name.startsWith("@neotales/")
  );
  const mappings: Record<string, NpmMapping> = {};

  async function collect(path: string): Promise<void> {
    for await (const entry of Deno.readDir(path)) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory) {
        await collect(entryPath);
      } else if (entry.isFile && entry.name.endsWith(".ts")) {
        const content = await Deno.readTextFile(entryPath);
        for (
          const match of content.matchAll(
            /(?:from\s*|import\s*(?:\(\s*)?)["'](@neotales\/[^"']+)["']/g,
          )
        ) {
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

/**
 * Runs the module suites for the selected runtimes.
 *
 * `runtimes.json` decides which modules can run where, so an unsupported combination is
 * skipped rather than failed. `--skip` narrows further by dropping matching test files, which
 * is how an individual capability such as `chown` or `symlink` is held back on a host that
 * cannot support it. File lists are expanded rather than filtered by name, because
 * `--filter` matches test names on Deno and differs again on Node and Bun.
 */
async function testModules(
  names: string[],
  runtimes: Set<string>,
  skip: Set<string> = new Set(),
): Promise<void> {
  const table = parseRuntimeTable(await Deno.readTextFile(join(root, "runtimes.json")));
  const modules = names.length ? names : await importedModules();
  if (!modules.length) throw new Error("No modules found under jsr/.");
  const selected = runtimes.size ? runtimes : new Set(["deno", "node", "bun"]);
  if (selected.has("node") || selected.has("bun")) await run("pnpm", ["install"]);

  const skipped: string[] = [];
  for (const name of modules) {
    const supported = [...selected].filter((runtime) => supports(table, name, runtime));
    const unsupported = [...selected].filter((runtime) => !supported.includes(runtime));
    if (unsupported.length) skipped.push(`${name}: ${unsupported.join(", ")} (not supported)`);
    if (!supported.length) continue;

    if (supported.includes("deno")) {
      const files = await testFiles(join(jsrDir, name), "*.test.ts", skip);
      if (files.length) await run("deno", ["test", "-A", ...files], join(jsrDir, name));
    }

    const npmDirForModule = join(npmDir, name);
    if (await exists(join(npmDirForModule, "package.json"))) {
      if (supported.includes("node")) {
        const files = await testFiles(npmDirForModule, "*.test.js", skip);
        if (files.length) await run("pnpm", ["test", ...files], npmDirForModule);
      }
      if (supported.includes("bun")) {
        const files = await testFiles(npmDirForModule, "*.test.js", skip);
        if (files.length) await run("pnpm", ["test:bun", ...files], npmDirForModule);
      }
    }
  }

  for (const note of skipped) console.log(`skipped ${note}`);
}

/**
 * Expands the test files in a directory, dropping any whose name matches a skip pattern.
 * Returns relative paths so the runtimes resolve them against the working directory.
 */
async function testFiles(
  directory: string,
  pattern: string,
  skip: Set<string>,
): Promise<string[]> {
  const found: string[] = [];
  for await (const entry of Deno.readDir(directory)) {
    if (!entry.isFile) continue;
    if (
      pattern === "*.test.ts" ? !entry.name.endsWith(".test.ts") : !entry.name.endsWith(".test.js")
    ) {
      continue;
    }
    if ([...skip].some((needle) => entry.name.includes(needle))) continue;
    found.push(entry.name);
  }
  return found.sort();
}

async function audit(): Promise<void> {
  const output = await capture("pnpm", ["audit", "--audit-level", "moderate", "--json"]);
  if (!output.success) {
    throw new Error(`Dependency audit failed:\n${outputText(output).trim()}`);
  }
}

async function check(): Promise<void> {
  await run(oxlint, ["jsr", "eng", "e2e", "runtime-tests"]);
  await run("deno", ["fmt", "--check"]);
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
      /^(?:feat|fix|bug|perf|refactor|docs|chore)(?:\([^)]+\))?!?:/.test(subject)
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
    `Prepared release metadata for ${packages.length} package(s) in ${relative(root, artifacts)}.`,
  );
}

async function publishModule(name: string, dryRun: boolean): Promise<void> {
  await run("deno", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(jsrDir, name));
  await run("pnpm", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(npmDir, name));
}

async function bootstrapPublishModule(name: string, dryRun: boolean): Promise<void> {
  requireNpmToken();
  await run(oxlint, ["jsr", "eng"]);
  await run("deno", ["fmt", "--check"]);
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
  const lookupOutput = `${new TextDecoder().decode(packageLookup.stdout)}${
    new TextDecoder().decode(
      packageLookup.stderr,
    )
  }`;
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
    `Tarball: ${relative(root, tarball)} (${formatBytes(size)} compressed, ${
      formatBytes(
        unpackedSize,
      )
    } unpacked)`,
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
  case "build":
    await buildModule(moduleName(args));
    break;
  case "test":
    {
      const known = ["deno", "node", "bun"];
      const runtimes = new Set(
        args.filter((arg) => arg.startsWith("--") && known.includes(arg.slice(2))).map((arg) =>
          arg.slice(2)
        ),
      );
      const unknown = args.filter((arg) =>
        /^--[a-z]/.test(arg) && !known.includes(arg.slice(2)) &&
        arg !== "--skip"
      );
      if (unknown.length) {
        throw new Error(
          `Unknown test flag: ${unknown.join(", ")}. Runtimes are --deno, --node, --bun; ` +
            `use --skip <pattern> to drop test files.`,
        );
      }
      const skipIndex = args.indexOf("--skip");
      const skip = new Set(
        skipIndex >= 0 && args[skipIndex + 1] ? args[skipIndex + 1].split(",") : [],
      );
      const names = args.filter((arg, index) => !arg.startsWith("-") && index !== skipIndex + 1);
      await testModules(names, runtimes, skip);
    }
    break;
  case "runtimes":
    await run(Deno.execPath(), ["run", "-A", join(root, "eng", "runtimes-report.ts")]);
    break;
  case "readme":
    {
      const reports = args.includes("--check") ? await verifyReadmes() : await writeReadmes();
      const bad = reports.filter((report) => report.status !== "current");
      for (const report of bad) console.log(`${report.status.padEnd(7)} ${report.module}`);
      if (args.includes("--check") && bad.length) {
        throw new Error(
          `${bad.length} module README(s) are out of date. Run \`deno task readme\`.`,
        );
      }
      if (!args.includes("--check")) {
        console.log(`updated ${reports.length} module README(s)`);
      }
    }
    break;
  case "setup":
    await run(Deno.execPath(), ["run", "-A", join(root, "eng", "setup.ts"), ...args]);
    break;
  case "doctor":
    await run(Deno.execPath(), ["run", "-A", join(root, "eng", "setup.ts"), "doctor"]);
    break;
  case "lint":
    await run(oxlint, ["jsr", "eng", "e2e", "runtime-tests"]);
    break;
  case "fmt":
    await run("deno", ["fmt", ...(args.includes("--check") ? ["--check"] : [])]);
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
