type TxikiDirEntry = { isDirectory: boolean; isFile: boolean; name: string };
type TxikiRuntime = {
  makeTempDir(template: string): Promise<string>;
  readDir(path: string): Promise<AsyncIterable<TxikiDirEntry>>;
  readFile(path: string): Promise<Uint8Array>;
  remove(path: string): Promise<void>;
  stat(path: string): Promise<{ size: number }>;
  writeFile(path: string, value: string): Promise<void>;
};

const runtime = Reflect.get(globalThis, "tjs") as TxikiRuntime;

async function main(): Promise<void> {
  const directory = await runtime.makeTempDir("neotales-txiki-XXXXXX");
  try {
    const file = `${directory}/value.txt`;
    await runtime.writeFile(file, "txiki-fs");
    const [stat, entries] = await Promise.all([
      runtime.stat(file),
      runtime.readDir(directory),
    ]);
    const names: string[] = [];
    for await (const entry of entries) names.push(entry.name);
    const report = {
      entries: names.sort(),
      size: stat.size,
      value: new TextDecoder().decode(await runtime.readFile(file)),
    };
    console.log(`__NEOTALES_RUNTIME_RESULT__${JSON.stringify(report)}`);
  } finally {
    await runtime.remove(directory);
  }
}

main();
