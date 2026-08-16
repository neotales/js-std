import { inspectBrowser } from "./browser_inspect.ts";
import { globals } from "./globals.ts";

export interface InspectOptions {
  colors?: boolean;
  compact?: boolean;
  depth?: number;
  breakLength?: number;
  escapeSequences?: boolean;
  iterableLimit?: number;
  showProxy?: boolean;
  sorted?: boolean;
  trailingComma?: boolean;
  getters?: boolean;
  showHidden?: boolean;
  strAbbreviateSize?: number;
}

type NativeInspector = {
  inspect(value: unknown, options?: Record<string, unknown>): string;
};

function nodeOptions(options: InspectOptions): Record<string, unknown> {
  const result: Record<string, unknown> = {
    compact: options.compact ?? 3,
    depth: options.depth ?? 4,
    colors: options.colors ?? false,
  };

  for (const key in options) {
    switch (key) {
      case "compact":
      case "depth":
      case "colors":
      case "escapeSequences":
        break;
      case "iterableLimit":
        result.maxArrayLength = options.iterableLimit;
        break;
      case "strAbbreviateSize":
        result.maxStringLength = options.strAbbreviateSize;
        break;
      default:
        result[key] = options[key as keyof InspectOptions];
        break;
    }
  }

  return result;
}

function processInspector(): NativeInspector | undefined {
  const process = globals.process as { getBuiltinModule?: unknown } | undefined;
  if (typeof process?.getBuiltinModule !== "function") return;

  const util = process.getBuiltinModule("node:util") as { inspect?: unknown } | undefined;
  if (typeof util?.inspect !== "function") return;

  return util as NativeInspector;
}

/**
 * Returns a runtime-native representation when available, otherwise a browser-safe,
 * Node-like representation of the value.
 */
export function inspect(value: unknown, options: InspectOptions = {}): string {
  const deno = globals.Deno;
  if (typeof deno?.inspect === "function") {
    return deno.inspect(value, options);
  }

  const node = processInspector();
  if (node) {
    return node.inspect(value, nodeOptions(options));
  }

  const bun = globals.Bun as { inspect?: unknown } | undefined;
  if (typeof bun?.inspect === "function") {
    return (bun.inspect as NativeInspector["inspect"])(value, nodeOptions(options));
  }

  return inspectBrowser(value, options);
}
