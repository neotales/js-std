import { publishedModules } from "./modules.mjs";

const decoder = new TextDecoder();
const packages = await publishedModules();
const directory = await Deno.makeTempDir({ prefix: "neotales-npm-publish-validation-" });

async function run(command, args, cwd) {
  const output = await new Deno.Command(command, {
    args,
    cwd,
    stdout: "inherit",
    stderr: "piped",
  }).output();

  if (!output.success) {
    throw new Error(`${command} ${args.join(" ")} failed:\n${decoder.decode(output.stderr)}`);
  }
}

try {
  const dependencies = Object.fromEntries(packages.map(({ name, version }) => [name, version]));
  const packageJson = {
    private: true,
    type: "module",
    dependencies,
  };
  const runner = new URL("./npm_runner.mjs", `file://${directory}/`);
  const catalog = new URL("./catalog.mjs", import.meta.url).href;

  await Deno.writeTextFile(
    `${directory}/package.json`,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
  await Deno.writeTextFile(
    runner,
    `import { runSmokeTests } from ${JSON.stringify(catalog)};
const packages = ${JSON.stringify(packages)};
await runSmokeTests(packages, (name) => import(name));
`,
  );

  await run(
    "npm",
    [
      "install",
      "--omit=dev",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      "--prefer-online",
      "--registry=https://registry.npmjs.org",
    ],
    directory,
  );
  await run("node", [runner.pathname], directory);
} finally {
  await Deno.remove(directory, { recursive: true });
}
