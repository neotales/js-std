/**
 * The `remove` module provides functions to remove files or directories.
 *
 * @module
 */
import type { RemoveOptions } from "./types.ts";
import { getNodeFs, globals } from "./globals.ts";
import { mapError } from "./_map_error.ts";

/**
 * Removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { notOk } from "@frostyeti/assert";
 * import { exists } from "@neotales/fs/exists";
 * import { remove } from "@neotales/fs/rm";
 * import { mkdtemp } from "@neotales/fs/mkdtemp";
 *
 * const tempDir = await mkdtemp();
 * await remove(tempDir);
 * notOk(await exists(tempDir));
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export async function rm(path: string | URL, options?: RemoveOptions) {
  if (globals.Deno) {
    await globals.Deno.remove(path, options);
  } else {
    const { recursive = false } = options ?? {};
    try {
      await getNodeFs().promises.rm(path, { recursive: recursive });
    } catch (error) {
      if (
        (error as Error & { code: string }).code === "ERR_FS_EISDIR" ||
        (globals.Bun && (error as Error & { code: string }).code === "EFAULT")
      ) {
        try {
          await getNodeFs().promises.rmdir(path);
        } catch (removeError) {
          throw mapError(removeError);
        }
        return;
      }
      throw mapError(error);
    }
  }
}

/**
 * Synchronously removes the named file or directory.
 *
 * Throws error if permission denied, path not found, or path is a non-empty directory and
 * the recursive option isn't set to true.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts
 * import { notOk } from "@frostyeti/assert";
 * import { existsSync } from "@neotales/fs/exists";
 * import { rmSync } from "@neotales/fs/rm";
 * import { mkdtempSync } from "@neotales/fs/mkdtemp";
 *
 * const tempDir = mkdtempSync();
 * rmSync(tempDir);
 * notOk(existsSync(tempDir));
 * ```
 *
 * @tags allow-write
 *
 * @param path The path of file or directory.
 * @param options Options when reading a file. See {@linkcode RemoveOptions}.
 */
export function rmSync(path: string | URL, options?: RemoveOptions) {
  if (globals.Deno) {
    globals.Deno.removeSync(path, options);
  } else {
    const { recursive = false } = options ?? {};
    try {
      getNodeFs().rmSync(path, { recursive: recursive });
    } catch (error) {
      if (
        (error as Error & { code: string }).code === "ERR_FS_EISDIR" ||
        (globals.Bun && (error as Error & { code: string }).code === "EFAULT")
      ) {
        try {
          getNodeFs().rmdirSync(path);
        } catch (removeError) {
          throw mapError(removeError);
        }
        return;
      }
      throw mapError(error);
    }
  }
}
