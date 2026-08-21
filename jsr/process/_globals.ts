type DenoReader = {
  read(data: Uint8Array): Promise<number | null>;
  readSync(data: Uint8Array): number | null;
  isTerminal(): boolean;
  close(): void;
};

type DenoWriter = {
  write(data: Uint8Array): Promise<number>;
  writeSync(data: Uint8Array): number;
  isTerminal(): boolean;
  close(): void;
};

type DenoRuntime = {
  args: string[];
  pid: number;
  ppid: number;
  cwd(): string;
  chdir(directory: string): void;
  exit(code?: number): never;
  execPath(): string;
  build: { os: string };
  stdin: DenoReader;
  stdout: DenoWriter;
  stderr: DenoWriter;
};

type BrowserWindow = {
  close?(): void;
  location: { pathname: string };
};

type RuntimeGlobals = typeof globalThis & {
  Bun?: unknown;
  Deno?: DenoRuntime;
  navigator?: unknown;
  process?: NodeJS.Process;
  window?: BrowserWindow;
};

export const globals: RuntimeGlobals = globalThis;
export const isBrowser = globals.window !== undefined &&
  globals.Deno === undefined &&
  globals.Bun === undefined &&
  !globals.process?.versions.node;
