import { globals } from "./_globals.ts";

/**
 * The parent process ID of the current process. Browser environments report 0.
 */
export const ppid: number = globals.Deno?.ppid ?? globals.process?.ppid ?? 0;
