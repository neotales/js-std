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

/**
 * Resolves a Node builtin module synchronously.
 *
 * Node exposes builtins through `process.getBuiltinModule`, which lets this module avoid
 * top-level `await import()` and stay loadable in engines that only support classic
 * scripts. Hosts that do not implement the accessor return `undefined`; callers handle that
 * as an unsupported capability.
 *
 * @template T The builtin module type.
 * @param name The builtin module specifier, for example `node:fs`.
 * @returns The builtin module, or `undefined` when the host cannot provide it.
 */
export function getBuiltinModule<T>(name: string): T | undefined {
  const accessor = (globals.process as { getBuiltinModule?: (id: string) => unknown } | undefined)
    ?.getBuiltinModule;
  if (typeof accessor !== "function") return undefined;
  return accessor.call(globals.process, name) as T | undefined;
}
