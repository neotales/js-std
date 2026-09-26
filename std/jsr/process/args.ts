import { globals } from "./_globals.ts";

let a: Array<string> = [];

if (globals.Deno) {
  a = globals.Deno.args;
} else if (globals.process) {
  const isEval = globals.process.execArgv.some(
    (argument) =>
      argument === "-e" ||
      argument === "-p" ||
      argument === "--eval" ||
      argument === "--print" ||
      argument.startsWith("--eval=") ||
      argument.startsWith("--print="),
  );
  a = globals.process.argv.slice(isEval ? 1 : 2);
}

/**
 * The current process arguments. The arguments do not include the
 * executable path or the script path.
 * @example
 * ```typescript
 * import { args } from '@neotales/process/args';
 *
 * console.log(args);
 * ```
 */
export const args: ReadonlyArray<string> = a;
