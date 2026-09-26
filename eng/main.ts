import { build, emptyDir, type EntryPoint } from "@deno/dnt";
import { join, relative, resolve } from "@std/path";

const root = resolve(import.meta.dirname!, "..");
const engDir = import.meta.dirname!;
const repository = "https://github.com/neotales/js-std";
const oxlint = join(root, "node_modules", ".bin", "oxlint");

/**
 * A group is a top-level folder that holds a set of related packages. A directory
 * counts as a group when it has both a deno.json and a jsr/ folder, so adding a new
 * group needs no change here.
 */
type Group = {
  name: string;
  dir: string;
  jsrDir: string;
  npmDir: string;
  e2eDir: string;
};

const groupNamePattern = /^[a-z][a-z0-9-]*$/;

async function groups(): Promise<Group[]> {
  const found: Group[] = [];
  for await (const entry of Deno.readDir(root)) {
    if (!entry.isDirectory || !groupNamePattern.test(entry.name)) continue;
    const dir = join(root, entry.name);
    if (!(await exists(join(dir, "deno.json")))) continue;
    if (!(await exists(join(dir, "jsr")))) continue;
    found.push({
      name: entry.name,
      dir,
      jsrDir: join(dir, "jsr"),
      npmDir: join(dir, "npm"),
      e2eDir: join(dir, "e2e"),
    });
  }
  return found.sort((left, right) => left.name.localeCompare(right.name));
}

async function groupNames(): Promise<string[]> {
  return (await groups()).map((group) => group.name);
}

/** Resolves a group by name, listing the real names when the argument is not one. */
async function requireGroup(name: string): Promise<Group> {
  const found = (await groups()).find((group) => group.name === name);
  if (found) return found;
  const names = await groupNames();
  if (!names.length) throw new Error("No groups found. A group is a folder with deno.json and jsr/.");
  throw new Error(`Unknown group: ${name}. Groups: ${names.join(", ")}`);
}

/** Groups named on the command line, or every group when none was named. */
async function selectedGroups(args: string[]): Promise<Group[]> {
  const names = args.filter((arg) => !arg.startsWith("-"));
  if (!names.length) return await groups();
  return await Promise.all(names.map(requireGroup));
}

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
  group: string;
  module: string;
  npmName: string;
  version: string;
  jsrName: string;
};

function usage(): never {
  console.error(
    `Usage: deno run -A ./eng/main.ts <task> <group> [module] [flags]\n\nTasks:\n  groups                    List every group in this repo\n  build <group> [module]     Build a module, or a whole group, for npm with dnt\n  test <group> [module] [--deno] [--node] [--bun]  Run selected tests\n  test-all [--deno] [--node] [--bun]  Run the tests for every group\n  lint [group]               Check source with oxlint; all groups and eng by default\n  fmt [group] [--check]      Format or check formatting with deno fmt\n  audit                      Fail on moderate-or-higher npm vulnerabilities\n  check <group>              Run lint, formatting, audit, and the group's tests\n  check-all                 Run the full gate for every group\n  pack <group> <module>      Create an npm tarball\n  release-prepare <tag>      Build release artifacts for version-changed modules\n  publish-bootstrap <group> <module> [--dry-run]  First npmjs.org publish\n  publish <group> <module> [--dry-run]  Publish one module to JSR and npm`,
  );
  Deno.exit(1);
}

/** Takes the first non-flag argument as the group and the rest as module names. */
async function groupAndModules(args: string[]): Promise<{ group: Group; modules: string[] }> {
  const positional = args.filter((arg) => !arg.startsWith("-"));
  const [name, ...modules] = positional;
  if (!name) usage();
  return { group: await requireGroup(name), modules };
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

async function buildModule(group: Group, name: string): Promise<void> {
  const source = join(group.jsrDir, name);
  const configPath = join(source, "deno.json");
  if (!(await exists(configPath))) {
    throw new Error(`Unknown module in group ${group.name}: ${name}`);
  }

  const config = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
  const dntPath = join(source, "dnt.json");
  const dnt = JSON.parse(await Deno.readTextFile(dntPath)) as DntConfig;
  const missing = await missingWorkspaceDependencies(dnt);
  if (missing.length) {
    throw new Error(
      `Build required workspace modules before building ${group.name}/${name}: ${
        missing.join(", ")
      }`,
    );
  }
  const outDir = join(group.npmDir, name);
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
        repository: {
          type: "git",
          url: `git+${repository}.git`,
          directory: `${group.name}/npm/${name}`,
        },
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

/**
 * Every @neotales dependency has to exist as a jsr module in some group, because the
 * npm build resolves it through pnpm's workspace links rather than the registry.
 */
async function missingWorkspaceDependencies(dnt: DntConfig): Promise<string[]> {
  const dependencies = [
    ...Object.keys(dnt.dependencies ?? {}),
    ...Object.keys(dnt.devDependencies ?? {}),
    ...Object.keys(dnt.peerDependencies ?? {}),
    ...Object.keys(dnt.optionalDependencies ?? {}),
  ];
  const wanted = dependencies
    .filter((dependency) =>
      dependency.startsWith("@neotales/") && dependency !== "@neotales/globals"
    )
    .map((dependency) => dependency.slice("@neotales/".length));
  if (!wanted.length) return [];

  const available = new Set<string>();
  for (const group of await groups()) {
    for (const name of await importedModules(group)) available.add(name);
  }
  return [...new Set(wanted.filter((name) => !available.has(name)))].sort();
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

async function importedModules(group: Group): Promise<string[]> {
  const modules: string[] = [];
  for await (const entry of Deno.readDir(group.jsrDir)) {
    if (entry.isDirectory && (await exists(join(group.jsrDir, entry.name, "deno.json")))) {
      modules.push(entry.name);
    }
  }
  return modules.sort();
}

/** Build order within a set of modules: a module comes after the modules it needs. */
async function buildOrder(modules: string[]): Promise<string[]> {
  const dependencies = new Map<string, string[]>();
  for (const name of modules) {
    const dntPath = join(...(await moduleSource(name)), "dnt.json");
    const dnt = JSON.parse(await Deno.readTextFile(dntPath)) as DntConfig;
    const needs = [
      ...Object.keys(dnt.dependencies ?? {}),
      ...Object.keys(dnt.devDependencies ?? {}),
      ...Object.keys(dnt.peerDependencies ?? {}),
      ...Object.keys(dnt.optionalDependencies ?? {}),
    ];
    dependencies.set(
      name,
      needs
        .filter((need) => need.startsWith("@neotales/"))
        .map((need) => need.slice("@neotales/".length))
        .filter((need) => modules.includes(need)),
    );
  }

  const ordered: string[] = [];
  const state = new Map<string, "visiting" | "done">();
  async function visit(name: string, path: string[]): Promise<void> {
    if (state.get(name) === "done") return;
    if (state.get(name) === "visiting") {
      throw new Error(`Dependency cycle between modules: ${[...path, name].join(" -> ")}`);
    }
    state.set(name, "visiting");
    for (const need of dependencies.get(name) ?? []) await visit(need, [...path, name]);
    state.set(name, "done");
    ordered.push(name);
  }

  for (const name of modules) await visit(name, []);
  return ordered;
}

/** Finds the source folder of a module, whichever group it lives in. */
async function moduleSource(name: string): Promise<[string, string]> {
  for (const group of await groups()) {
    if (await exists(join(group.jsrDir, name, "deno.json"))) return [group.jsrDir, name];
  }
  throw new Error(`Unknown module: ${name}`);
}

async function testModules(
  group: Group,
  names: string[],
  runtimes: Set<string>,
): Promise<void> {
  const available = await importedModules(group);
  const modules = names.length ? names : available;
  if (!modules.length) {
    console.log(`Group ${group.name} has no modules under ${relative(root, group.jsrDir)}/.`);
    return;
  }
  const unknown = modules.filter((name) => !available.includes(name));
  if (unknown.length) {
    throw new Error(
      `Unknown module in group ${group.name}: ${unknown.join(", ")}. ` +
        `Modules: ${available.join(", ")}`,
    );
  }
  const selected = runtimes.size ? runtimes : new Set(["deno", "node", "bun"]);
  if (selected.has("node") || selected.has("bun")) await run("pnpm", ["install"]);
  for (const name of await buildOrder(modules)) {
    if (selected.has("deno")) await run("deno", ["test", "-A"], join(group.jsrDir, name));
    const npmPackage = join(group.npmDir, name, "package.json");
    if (await exists(npmPackage)) {
      if (selected.has("node")) await run("pnpm", ["test"], join(group.npmDir, name));
      if (selected.has("bun")) await run("pnpm", ["test:bun"], join(group.npmDir, name));
    }
  }
}

async function lint(selected: Group[]): Promise<void> {
  const targets: string[] = [];
  for (const group of selected) {
    targets.push(relative(root, group.jsrDir));
    if (await exists(group.e2eDir)) targets.push(relative(root, group.e2eDir));
  }
  if (!selected.length) targets.push("eng");
  if (!targets.length) return;
  await run(oxlint, targets);
}

async function format(selected: Group[], check: boolean): Promise<void> {
  // One path per call: deno fmt refuses several paths that resolve to different
  // workspace configs, and each group folder has its own. The root config is named
  // explicitly so a group folder cannot quietly apply different formatting rules.
  const args = [
    "fmt",
    "--config",
    join(root, "deno.json"),
    ...(check ? ["--check"] : []),
  ];
  for (const group of selected) {
    await run("deno", [...args, relative(root, group.dir)]);
  }
  if (!selected.length) await run("deno", args);
}

async function audit(): Promise<void> {
  const output = await capture("pnpm", ["audit", "--audit-level", "moderate", "--json"]);
  if (!output.success) {
    throw new Error(`Dependency audit failed:\n${outputText(output).trim()}`);
  }
}

async function check(selected: Group[]): Promise<void> {
  await lint(selected);
  await format(selected, true);
  await audit();
  for (const group of selected) await testModules(group, [], new Set());
}

async function releasePackages(baseTag?: string): Promise<ReleasePackage[]> {
  const changed: ReleasePackage[] = [];
  for (const group of await groups()) {
    for (const module of await importedModules(group)) {
      const configPath = join(group.jsrDir, module, "deno.json");
      const current = JSON.parse(await Deno.readTextFile(configPath)) as DenoConfig;
      const include = async (): Promise<void> => {
        changed.push({
          group: group.name,
          module,
          npmName: current.name,
          version: current.version,
          jsrName: current.name,
        });
      };
      if (!baseTag) {
        await include();
        continue;
      }
      const previous = await capture("git", [
        "show",
        `${baseTag}:${relative(root, configPath)}`,
      ]);
      if (!previous.success) {
        await include();
        continue;
      }
      const old = JSON.parse(new TextDecoder().decode(previous.stdout)) as DenoConfig;
      if (old.version !== current.version) await include();
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
  const all = await groups();
  await check(all);
  const packages = await releasePackages(baseTag);
  if (!packages.length) throw new Error(`No package versions changed since ${baseTag}.`);

  const artifacts = join(root, "artifacts", tag);
  await emptyDir(artifacts);
  const built = new Set<string>();
  for (const pkg of packages) {
    const key = `${pkg.group}/${pkg.module}`;
    if (built.has(key)) continue;
    await buildModule(await requireGroup(pkg.group), pkg.module);
    built.add(key);
  }

  const commits = await releaseCommitNotes(baseTag);
  const notes = [
    `# ${tag}`,
    "",
    "## Packages",
    ...packages.map((pkg) => `- ${pkg.npmName}@${pkg.version} (${pkg.group}/${pkg.module})`),
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

async function publishModule(group: Group, name: string, dryRun: boolean): Promise<void> {
  await run("deno", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(group.jsrDir, name));
  await run("pnpm", ["publish", ...(dryRun ? ["--dry-run"] : [])], join(group.npmDir, name));
}

async function bootstrapPublishModule(
  group: Group,
  name: string,
  dryRun: boolean,
): Promise<void> {
  requireNpmToken();
  await lint([group]);
  await format([group], true);
  const packageDir = join(group.npmDir, name);
  const packagePath = join(packageDir, "package.json");
  if (!(await exists(packagePath))) await buildModule(group, name);

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

  await testModules(group, [name], new Set());

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

function runtimeFlags(args: string[]): Set<string> {
  const runtimes = new Set(args.filter((arg) => arg.startsWith("--")).map((arg) => arg.slice(2)));
  const invalid = [...runtimes].filter((runtime) => !["deno", "node", "bun"].includes(runtime));
  if (invalid.length) throw new Error(`Unknown test runtime flag: --${invalid.join(", --")}`);
  return runtimes;
}

const [command, ...args] = Deno.args;
switch (command) {
  case "groups":
    {
      for (const group of await groups()) {
        const modules = await importedModules(group);
        console.log(`${group.name}  ${modules.length} module(s): ${modules.join(", ")}`);
      }
    }
    break;
  case "build":
    {
      const { group, modules } = await groupAndModules(args);
      const available = await importedModules(group);
      const targets = modules.length ? modules : available;
      if (!targets.length) {
        console.log(`Group ${group.name} has no modules to build.`);
        break;
      }
      const unknown = targets.filter((name) => !available.includes(name));
      if (unknown.length) {
        throw new Error(
          `Unknown module in group ${group.name}: ${unknown.join(", ")}. ` +
            `Modules: ${available.join(", ")}`,
        );
      }
      for (const name of await buildOrder(targets)) await buildModule(group, name);
    }
    break;
  case "test":
    {
      const { group, modules } = await groupAndModules(args);
      await testModules(group, modules, runtimeFlags(args));
    }
    break;
  case "test-all":
    {
      const runtimes = runtimeFlags(args);
      for (const group of await groups()) await testModules(group, [], runtimes);
    }
    break;
  case "lint":
    await lint(await selectedGroups(args));
    break;
  case "fmt":
    await format(await selectedGroups(args), args.includes("--check"));
    break;
  case "audit":
    await audit();
    break;
  case "check":
    {
      const { group } = await groupAndModules(args);
      await check([group]);
    }
    break;
  case "check-all":
    await check(await groups());
    break;
  case "pack":
    {
      const { group, modules } = await groupAndModules(args);
      if (!modules.length) usage();
      for (const name of modules) await run("pnpm", ["pack"], join(group.npmDir, name));
    }
    break;
  case "release-prepare":
    await releasePrepare(releaseTag(args));
    break;
  case "publish-bootstrap":
    {
      const { group, modules } = await groupAndModules(args);
      if (!modules.length) usage();
      for (const name of modules) {
        await bootstrapPublishModule(group, name, args.includes("--dry-run"));
      }
    }
    break;
  case "publish":
    {
      const { group, modules } = await groupAndModules(args);
      if (!modules.length) usage();
      for (const name of modules) {
        await publishModule(group, name, args.includes("--dry-run"));
      }
    }
    break;
  default:
    usage();
}
