import { join, resolve } from "@std/path";

const root = resolve(import.meta.dirname!, "..");
const cacheRoot = Deno.env.get("NEOTALES_RUNTIME_CACHE") ?? join(root, ".runtime-lab");
const engines = ["quickjs", "txiki", "jerry"] as const;
type Engine = typeof engines[number];

const selected = parseEngines(Deno.args);
await Deno.mkdir(cacheRoot, { recursive: true });

for (const engine of selected) {
  console.log(`\nPreparing ${engine} in ${cacheRoot}`);
  switch (engine) {
    case "quickjs":
      await setupQuickJs();
      break;
    case "txiki":
      await setupTxiki();
      break;
    case "jerry":
      await setupJerryScript();
      break;
  }
}

console.log("\nAlternate runtime engines are ready.");

function parseEngines(args: string[]): Engine[] {
  const names = args.length ? args : engines;
  const invalid = names.filter((name) => !engines.includes(name as Engine));
  if (invalid.length) throw new Error(`Unknown engine(s): ${invalid.join(", ")}`);
  return names as Engine[];
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

async function run(command: string, args: string[], inherit = false): Promise<string> {
  const output = await new Deno.Command(command, {
    args,
    cwd: root,
    stdin: inherit ? "inherit" : "null",
    stdout: inherit ? "inherit" : "piped",
    stderr: inherit ? "inherit" : "piped",
  }).output();
  const text = `${new TextDecoder().decode(output.stdout)}\n${
    new TextDecoder().decode(output.stderr)
  }`.trim();
  if (!output.success) throw new Error(`${command} failed (${output.code}):\n${text}`);
  return text;
}

async function requireTool(command: string): Promise<void> {
  try {
    await run(command, ["--version"]);
  } catch {
    throw new Error(`${command} is required to prepare alternate runtimes.`);
  }
}

async function ensureClone(repository: string, tag: string, destination: string): Promise<void> {
  await requireTool("git");
  if (await exists(join(destination, ".git"))) {
    await run("git", ["-C", destination, "fetch", "--depth", "1", "origin", tag], false);
    await run("git", ["-C", destination, "checkout", "--detach", "FETCH_HEAD"], false);
    return;
  }
  if (await exists(destination)) {
    throw new Error(`Refusing to replace non-git cache directory: ${destination}`);
  }
  await run("git", [
    "clone",
    "--depth",
    "1",
    "--branch",
    tag,
    "--recurse-submodules",
    "--shallow-submodules",
    repository,
    destination,
  ], true);
}

async function setupQuickJs(): Promise<void> {
  const version = "0.17.0";
  const directory = join(cacheRoot, `quickjs-ng-v${version}`);
  const executable = join(directory, Deno.build.os === "windows" ? "qjs.exe" : "qjs");
  if (await exists(executable)) {
    console.log(`QuickJS-ng ${version} is already installed.`);
    return;
  }

  const platform = quickJsPlatform();
  const url = `https://github.com/quickjs-ng/quickjs/releases/download/v${version}/qjs-${platform}`;
  console.log(`Downloading ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`QuickJS-ng download failed: ${response.status} ${response.statusText}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());

  if (platform === "linux-x86_64") {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0"))
      .join("");
    const expected = "0bfc02511a9f549c28b53880d988fc7cd5d361e90c5e8afdfcd7dc6774ceace5";
    if (hash !== expected) throw new Error(`QuickJS-ng checksum mismatch: ${hash}`);
  } else {
    console.log(
      `No pinned checksum is recorded for ${platform}; release API data should be reviewed.`,
    );
  }

  await Deno.mkdir(directory, { recursive: true });
  await Deno.writeFile(executable, bytes);
  if (Deno.build.os !== "windows") await Deno.chmod(executable, 0o755);
  console.log(`Installed QuickJS-ng ${version}.`);
}

function quickJsPlatform(): string {
  const os = Deno.build.os === "darwin" ? "darwin" : Deno.build.os;
  const arch = Deno.build.arch === "x86_64"
    ? "x86_64"
    : Deno.build.arch === "aarch64"
    ? "aarch64"
    : Deno.build.arch === "arm"
    ? "armv7"
    : Deno.build.arch === "riscv64"
    ? "riscv64"
    : undefined;
  if (!arch || !["linux", "darwin", "windows"].includes(os)) {
    throw new Error(`No QuickJS-ng release asset for ${Deno.build.os}/${Deno.build.arch}`);
  }
  return `${os}-${arch}`;
}

async function setupTxiki(): Promise<void> {
  const version = "26.6.0";
  const directory = join(cacheRoot, `txiki-v${version}`);
  const executable = join(directory, "build", "tjs");
  if (await exists(executable)) {
    console.log(`txiki.js v${version} is already installed.`);
    return;
  }

  await requireTool("cmake");
  await requireTool("make");
  await ensureClone("https://github.com/saghul/txiki.js.git", `v${version}`, directory);
  await run("git", [
    "-C",
    directory,
    "submodule",
    "update",
    "--init",
    "--recursive",
    "--depth",
    "1",
  ], false);
  const jobs = Number.parseInt(await run("nproc", []), 10) || 4;
  await run("make", [
    "-C",
    directory,
    `-j${jobs}`,
    "BUILD_WITH_SQLITE=OFF",
  ], true);
  console.log(`Installed txiki.js v${version}.`);
}

async function setupJerryScript(): Promise<void> {
  const version = "3.0.0";
  const directory = join(cacheRoot, `jerryscript-v${version}`);
  const executable = join(directory, "build", "bin", "jerry");
  if (await exists(executable)) {
    console.log(`JerryScript ${version} is already installed.`);
    return;
  }

  const python = Deno.build.os === "windows" ? "python" : "python3";
  await requireTool(python);
  await requireTool("cmake");
  await ensureClone(
    "https://github.com/jerryscript-project/jerryscript.git",
    `v${version}`,
    directory,
  );

  const args = [
    join(directory, "tools", "build.py"),
    `--builddir=${join(directory, "build")}`,
    "--profile=es.next",
    "--lto=off",
    "--error-messages=on",
    "--line-info=on",
  ];
  const compiler = await run("cc", ["--version"]);
  const gccMajor = Number.parseInt(compiler.match(/(?:gcc|GCC).*?(\d+)/)?.[1] ?? "0", 10);
  if (gccMajor >= 16) {
    args.push("--compile-flag=-Wno-error=unterminated-string-initialization");
  }
  await run(python, args, true);
  console.log(`Installed JerryScript ${version}.`);
}
