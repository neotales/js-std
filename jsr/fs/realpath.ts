/**
 * The `realpath` module provides functions to resolve the real path of a file or directory.
 *
 * @module
 */
import { mapError } from "./_map_error.ts";
import { getNodeFs, globals } from "./globals.ts";

/**
 * Resolves to the absolute normalized path, with symbolic links resolved.
 *
 * Requires `allow-read` permission for the target path.
 *
 * Also requires `allow-read` permission for the `CWD` if the target path is
 * relative.
 *
 * @example Usage
 * ```ts ignore
 * import { realpath } from "@neotales/fs/realpath";
 * import { symlink } from "@neotales/fs/symlink";
 *
 * // e.g. given /home/alice/file.txt and current directory /home/alice
 * await symlink("file.txt", "symlink_file.txt");
 * const fileRealPath = await realpath("./file.txt");
 * const realSymLinkPath = await realpath("./symlink_file.txt");
 * console.log(fileRealPath);  // outputs "/home/alice/file.txt"
 * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the file or directory.
 * @returns A promise fulfilling with the absolute `path` of the file.
 */
export async function realpath(path: string | URL): Promise<string> {
  if (globals.Deno) {
    return globals.Deno.realPath(path);
  }

  try {
    return await getNodeFs().promises.realpath(path);
  } catch (error) {
    throw mapError(error);
  }
}

/**
 * Synchronously returns absolute normalized path, with symbolic links
 * resolved.
 *
 * Requires `allow-read` permission for the target path.
 *
 * Also requires `allow-read` permission for the `CWD` if the target path is
 * relative.
 *
 * @example Usage
 * ```ts ignore
 * import { realpathSync } from "@neotales/fs/realpath";
 * import { symlinkSync } from "@neotales/fs/symlink";
 * // e.g. given /home/alice/file.txt and current directory /home/alice
 * symlinkSync("file.txt", "symlink_file.txt");
 * const realPath = realpathSync("./file.txt");
 * const realSymLinkPath = realpathSync("./symlink_file.txt");
 * console.log(realPath);  // outputs "/home/alice/file.txt"
 * console.log(realSymLinkPath);  // outputs "/home/alice/file.txt"
 * ```
 *
 * @tags allow-read
 *
 * @param path The path of the file or directory.
 * @returns The absolute `path` of the file.
 */
export function realpathSync(path: string | URL): string {
  if (globals.Deno) {
    return globals.Deno.realPathSync(path);
  }

  try {
    return getNodeFs().realpathSync(path);
  } catch (error) {
    throw mapError(error);
  }
}
