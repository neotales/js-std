/**
 * The `cwd` module provides a function to get the current working directory.
 *
 * @module
 */
import { globals } from "./globals.ts";

/**
 * Gets the current working directory.
 * @returns The current working directory.
 */
export function cwd(): string {
  if (globals.Deno) {
    return globals.Deno.cwd();
  }

  if (globals.process && globals.process.cwd) {
    return globals.process.cwd();
  }

  return "";
}
