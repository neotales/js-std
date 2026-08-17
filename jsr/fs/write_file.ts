// Copyright 2018-2026 the Deno authors. MIT license.
/**
 * The `write-file` module provides functions to write binary data to a file.
 *
 * @module
 */

import type { WriteFileOptions } from "./types.ts";
import { getNodeFs, globals } from "./globals.ts";
import { getWriteFsFlag } from "./_get_fs_flag.ts";
import { mapError } from "./_map_error.ts";
import { NotFound } from "./unstable_errors.ts";

/**
 * Write `data` to the given `path`, by default creating a new file if needed,
 * else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeFile } from "@neotales/fs/write-file";
 * const encoder = new TextEncoder();
 * const data = encoder.encode("Hello world\n");
 * await writeFile("hello1.txt", data);  // overwrite "hello1.txt" or create it
 * await writeFile("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
 * await writeFile("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
 * await writeFile("hello4.txt", data, { append: true });  // add data to the end of the file
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data The content in bytes or a stream of bytes to be written.
 * @param options Options to write files. See {@linkcode WriteFileOptions}.
 */
export async function writeFile(
  path: string | URL,
  data: Uint8Array | ReadableStream<Uint8Array>,
  options?: WriteFileOptions | undefined,
): Promise<void> {
  if (globals.Deno) {
    return await globals.Deno.writeFile(path, data, options);
  } else {
    options = options ?? {};
    options.append ??= false;
    options.create ??= true;
    options.createNew ??= false;

    if (!options.create && !options.createNew) {
      try {
        // Check if the file exists before trying to write to it, since Node's writeFile will create the file if it does not exist, even with O_TRUNC.
        getNodeFs().accessSync(path);
      } catch (error) {
        if (
          error instanceof Error &&
          (error as unknown as Record<string, unknown>).code === "ENOENT"
        ) {
          throw new NotFound(`File not found: ${path} and create is false`, {
            cause: error,
          });
        }
        throw mapError(error);
      }
    }

    const flag = getWriteFsFlag({
      append: options.append,
      create: options.create,
      createNew: options.createNew,
    });
    try {
      await getNodeFs().promises.writeFile(path, data, { flag, signal: options.signal });
      if (options.mode != null) {
        await getNodeFs().promises.chmod(path, options.mode);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error as unknown as Record<string, unknown>).code === "EINVAL" &&
        options.create === false
      ) {
        throw new NotFound(`File not found: ${path} and create is false`, { cause: error });
      }

      throw mapError(error);
    }
  }
}

/**
 * Synchronously write `data` to the given `path`, by default creating a new
 * file if needed, else overwriting.
 *
 * Requires `allow-write` permission, and `allow-read` if `options.create` is
 * `false`.
 *
 * @example Usage
 * ```ts ignore
 * import { writeFileSync } from "@neotales/fs/write-file";
 * const encoder = new TextEncoder();
 * const data = encoder.encode("Hello world\n");
 * writeFileSync("hello1.txt", data);  // overwrite "hello1.txt" or create it
 * writeFileSync("hello2.txt", data, { create: false });  // only works if "hello2.txt" exists
 * writeFileSync("hello3.txt", data, { mode: 0o777 });  // set permissions on new file
 * writeFileSync("hello4.txt", data, { append: true });  // add data to the end of the file
 * ```
 *
 * @tags allow-read, allow-write
 *
 * @param path The path of the file that `data` is written to.
 * @param data The content in bytes to be written.
 * @param options Options to write files. See {@linkcode WriteFileOptions}.
 */
export function writeFileSync(
  path: string | URL,
  data: Uint8Array,
  options?: WriteFileOptions | undefined,
): void {
  if (globals.Deno) {
    return globals.Deno.writeFileSync(path, data, options);
  } else {
    options = options ?? {};
    options.append ??= false;
    options.create ??= true;
    options.createNew ??= false;
    const { append, create, createNew, mode, signal } = options;

    if (!create && !createNew) {
      try {
        // Check if the file exists before trying to write to it, since Node's writeFileSync will create the file if it does not exist, even with O_TRUNC.
        getNodeFs().accessSync(path);
      } catch (error) {
        if (
          error instanceof Error &&
          (error as unknown as Record<string, unknown>).code === "ENOENT"
        ) {
          throw new NotFound(`File not found: ${path} and create is false`, {
            cause: error,
          });
        }
        throw mapError(error);
      }
    }

    const flag = getWriteFsFlag({ append, create, createNew });
    try {
      getNodeFs().writeFileSync(path, data, { flag: flag as never, signal });
      if (mode != null) {
        getNodeFs().chmodSync(path, mode);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        (error as unknown as Record<string, unknown>).code === "EINVAL" &&
        options.create === false
      ) {
        throw new NotFound(`File not found: ${path} and create is false`, { cause: error });
      }
      throw mapError(error);
    }
  }
}
