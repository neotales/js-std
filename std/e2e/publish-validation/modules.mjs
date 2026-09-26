const jsrDirectory = new URL("../../jsr/", import.meta.url);

export async function publishedModules() {
  const modules = [];

  for await (const entry of Deno.readDir(jsrDirectory)) {
    if (!entry.isDirectory) {
      continue;
    }

    const manifest = new URL(`${entry.name}/deno.json`, jsrDirectory);
    const { name, version } = JSON.parse(await Deno.readTextFile(manifest));
    modules.push({ name, version });
  }

  return modules.sort((left, right) => left.name.localeCompare(right.name));
}
