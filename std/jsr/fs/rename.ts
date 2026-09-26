/**
 * The `rename` module provides functions to rename files or directories.
 *
 * @module
 */

import { mapError } from "./_map_error.ts";
import { getNodeFs, globals } from "./globals.ts";

/**
 * Renames a file or directory.
 * @param oldPath The path to the existing file or directory.
 * @param newPath The path to the new file or directory.
 * @returns A promise that resolves when the operation is complete.
 */
export async function rename(oldPath: string | URL, newPath: string | URL): Promise<void> {
  if (globals.Deno) {
    return await globals.Deno.rename(oldPath, newPath);
  }
  try {
    await getNodeFs().promises.rename(oldPath, newPath);
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Synchronously renames a file or directory.
 * @param oldPath The path to the existing file or directory.
 * @param newPath The path to the new file or directory.
 */
export function renameSync(oldPath: string | URL, newPath: string | URL): void {
  if (globals.Deno) {
    return globals.Deno.renameSync(oldPath, newPath);
  }

  try {
    getNodeFs().renameSync(oldPath, newPath);
  } catch (error) {
    throw mapError(error);
  }
}
