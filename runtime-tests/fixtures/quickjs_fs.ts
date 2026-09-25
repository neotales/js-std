type QuickJsFile = { close(): number; puts(value: string): void };

declare function print(value: string): void;

declare const std: {
  loadFile(path: string): string | null;
  open(path: string, mode: string): QuickJsFile | null;
};

declare const os: {
  mkdir(path: string, mode?: number): number;
  remove(path: string): number;
  stat(path: string): [Record<string, number>, number];
};

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
const directory = `/tmp/neotales-quickjs-${suffix}`;
const file = `${directory}/value.txt`;

if (os.mkdir(directory) !== 0) throw new Error("QuickJS os.mkdir failed");
try {
  const handle = std.open(file, "w");
  if (!handle) throw new Error("QuickJS std.open failed");
  handle.puts("quickjs-fs");
  if (handle.close() !== 0) throw new Error("QuickJS FILE.close failed");
  const [stat, statError] = os.stat(file);
  if (statError !== 0 || std.loadFile(file) !== "quickjs-fs") {
    throw new Error("QuickJS filesystem round trip failed");
  }
  print(
    `__NEOTALES_RUNTIME_RESULT__${JSON.stringify({ contents: "quickjs-fs", size: stat.size })}`,
  );
} finally {
  os.remove(file);
  os.remove(directory);
}
