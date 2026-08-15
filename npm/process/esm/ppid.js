import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
/**
 * The parent process ID of the current process. Browser environments report 0.
 */
export const ppid = globals.Deno?.ppid ?? globals.process?.ppid ?? 0;
