/**
 * The `read-dir` module provides functions to read the contents of a directory
 * and return information about its contents.
 *
 * @module
 */
import type { DirEntry } from "./types.ts";
import { getNodeFs, globals } from "./globals.ts";
import { mapError } from "./_map_error.ts";
import { toDirEntry } from "./_to_dir_entry.ts";

/**
 * Reads the directory given by `path` and returns an async iterable of
 * {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * Throws Error if `path` is not a directory.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readDir } from "@neotales/fs/readdir";
 *
 * for await (const dirEntry of readDir("/")) {
 *   console.log(dirEntry.name);
 * }
 * ```
 *
 * @tags allow-read
 * @category File System
 *
 * @param path The path to the directory to read.
 * @returns An async iterable of {@linkcode DirEntry}.
 */
export async function* readdir(path: string | URL): AsyncIterable<DirEntry> {
  if (globals.Deno) {
    yield* globals.Deno.readDir(path);
  } else {
    try {
      const dir = await getNodeFs().promises.opendir(path);
      for await (const entry of dir) {
        yield toDirEntry(entry);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}

/**
 * Synchronously reads the directory given by `path` and returns an iterable
 * of {@linkcode DirEntry}. The order of entries is not guaranteed.
 *
 * Throws Error if `path` is not a directory.
 *
 * Requires `allow-read` permission.
 *
 * @example Usage
 * ```ts no-assert
 * import { readDirSync } from "@neotales/fs/readdir";
 *
 * for (const dirEntry of readDirSync("/")) {
 *   console.log(dirEntry.name);
 * }
 * ```
 *
 * @tags allow-read
 * @category File System
 *
 * @param path The path to the directory to read.
 * @returns An iterable of {@linkcode DirEntry}.
 */
export function* readdirSync(path: string | URL): Iterable<DirEntry> {
  if (globals.Deno) {
    return yield* globals.Deno.readDirSync(path);
  } else {
    try {
      const dir = getNodeFs().readdirSync(path, { withFileTypes: true });
      for (const entry of dir) {
        yield toDirEntry(entry);
      }
    } catch (error) {
      throw mapError(error);
    }
  }
}
