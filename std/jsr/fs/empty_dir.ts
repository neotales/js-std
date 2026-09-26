/**
 * The `empty-dir` module provides functions to ensure that a directory is empty.
 * It deletes the directory contents if it is not empty. If the directory does not exist, it creates it.
 *
 * @module
 */
import { toPathString } from "./utils.ts";
import { join } from "@neotales/path";
import { isNotFoundError } from "./errors.ts";
import { mkdir, mkdirSync } from "./mkdir.ts";
import { readdir, readdirSync } from "./readdir.ts";
import { rm, rmSync } from "./rm.ts";

/**
 * Asynchronously ensures that a directory is empty deletes the directory
 * contents it is not empty. If the directory does not exist, it is created.
 * The directory itself is not deleted.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to empty, as a string or URL.
 * @returns A void promise that resolves once the directory is empty.
 *
 * @example
 * ```ts
 * import { emptyDir } from "@neotales/fs";
 *
 * await emptyDir("./foo");
 * ```
 */
export async function emptyDir(dir: string | URL) {
  try {
    const items = await Array.fromAsync(readdir(dir));

    await Promise.all(
      items.map((item) => {
        if (item && item.name) {
          const filepath = join(toPathString(dir), item.name);
          return rm(filepath, { recursive: true });
        }
      }),
    );
  } catch (err) {
    if (err instanceof Error) {
      if (!isNotFoundError(err)) {
        throw err;
      }
    }

    // if not exist. then create it
    await mkdir(dir, { recursive: true });
  }
}

/**
 * Synchronously ensures that a directory is empty deletes the directory
 * contents it is not empty. If the directory does not exist, it is created.
 * The directory itself is not deleted.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param dir The path of the directory to empty, as a string or URL.
 * @returns A void value that returns once the directory is empty.
 *
 * @example
 * ```ts
 * import { emptyDirSync } from "@neotales/fs";
 *
 * emptyDirSync("./foo");
 * ```
 */
export function emptyDirSync(dir: string | URL) {
  try {
    const items = [...readdirSync(dir)];

    // If the directory exists, remove all entries inside it.
    while (items.length) {
      const item = items.shift();
      if (item && item.name) {
        const filepath = join(toPathString(dir), item.name);
        rmSync(filepath, { recursive: true });
      }
    }
  } catch (err) {
    if (!isNotFoundError(err)) {
      throw err;
    }
    // if not exist. then create it
    mkdirSync(dir, { recursive: true });
  }
}
