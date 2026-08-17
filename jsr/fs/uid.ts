/**
 * The `uid` module provides a function to get the current user id on POSIX platforms.
 *
 * @module
 */

import { globals } from "./globals.ts";

/**
 * Gets the current user id on POSIX platforms.
 * Returns `null` on Windows.
 */
export function uid(): number | null {
  if (globals.Deno) {
    return globals.Deno.uid();
  }

  if (globals.process && globals.process.getuid) {
    const currentUid = globals.process.getuid();
    if (currentUid === -1 || currentUid === undefined) {
      return null;
    }

    return currentUid;
  }

  return null;
}
