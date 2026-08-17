/**
 * The `lstat` module provides functions to get information about a file or directory.
 *
 * @module
 */
import type { FileInfo } from "./types.ts";
import { getNodeFs, globals } from "./globals.ts";
import { toFileInfo } from "./_to_file_info.ts";
import { mapError } from "./_map_error.ts";

/**
 * Resolves to a {@linkcode FileInfo} for the specified `path`. If `path` is a symlink, information for the symlink will be returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstat } from "@neotales/fs/lstat";
 * const fileInfo = await lstat("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A promise that resolves to a {@linkcode FileInfo} for the specified `path`.
 */
export async function lstat(path: string | URL): Promise<FileInfo> {
  if (globals.Deno) {
    // deno-lint-ignore no-explicit-any
    return (await globals.Deno.lstat(path)) as any as FileInfo;
  }

  try {
    return toFileInfo(await getNodeFs().promises.lstat(path));
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Synchronously returns a {@linkcode FileInfo} for the specified
 * `path`. If `path` is a symlink, information for the symlink will be
 * returned instead of what it points to.
 *
 * Requires `allow-read` permission in Deno.
 *
 * @example Usage
 *
 * ```ts
 * import { ok } from "@frostyeti/assert";
 * import { lstatSync } from "@neotales/fs/lstat";
 *
 * const fileInfo = lstatSync("README.md");
 * ok(fileInfo.isFile);
 * ```
 *
 * @tags allow-read
 *
 * @param path The path to the file or directory.
 * @returns A {@linkcode FileInfo} for the specified `path`.
 */
export function lstatSync(path: string | URL): FileInfo {
  if (globals.Deno) {
    // deno-lint-ignore no-explicit-any
    return globals.Deno.lstatSync(path) as any as FileInfo;
  }

  try {
    return toFileInfo(getNodeFs().lstatSync(path));
  } catch (error) {
    throw mapError(error);
  }
}
