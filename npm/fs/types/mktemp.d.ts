import "./_dnt.polyfills.js";
import type { MakeTempOptions } from "./types.js";
/**
 * Creates a new temporary file in the default directory for temporary files,
 * unless `dir` is specified.
 *
 * Other options include prefixing and suffixing the directory name with
 * `prefix` and `suffix` respectively.
 *
 * This call resolves to the full path to the newly created file.
 *
 * Multiple programs calling this function simultaneously will create different
 * files. It is the caller's responsibility to remove the file when no longer
 * needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mktemp } from "@neotales/fs/mktemp";
 * const tmpFileName0 = await mktemp();  // e.g. /tmp/419e0bf2
 * const tmpFileName1 = await mktemp({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary file.
 * @returns A Promise that resolves to a file path to the temporary file.
 */
export declare function mktemp(options?: MakeTempOptions): Promise<string>;
/**
 * Synchronously creates a new temporary file in the default directory for
 * temporary files, unless `dir` is specified.
 *
 * Other options include prefixing and suffixing the directory name with
 * `prefix` and `suffix` respectively.
 *
 * The full path to the newly created file is returned.
 *
 * Multiple programs calling this function simultaneously will create different
 * files. It is the caller's responsibility to remove the file when no longer
 * needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mktempSync } from "@neotales/fs/mktemp";
 * const tempFileName0 = mktempSync(); // e.g. /tmp/419e0bf2
 * const tempFileName1 = mktempSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp754d3098
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary file.
 * @returns The file path to the temporary file.
 */
export declare function mktempSync(options?: MakeTempOptions): string;
