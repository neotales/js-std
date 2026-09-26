import "./_dnt.polyfills.js";
import type { MakeTempOptions } from "./types.js";
/**
 * Creates a new temporary directory in the default directory for temporary
 * files, unless `dir` is specified. Other optional options include
 * prefixing and suffixing the directory name with `prefix` and `suffix`
 * respectively.
 *
 * This call resolves to the full path to the newly created directory.
 *
 * Multiple programs calling this function simultaneously will create different
 * directories. It is the caller's responsibility to remove the directory when
 * no longer needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdtemp } from "@neotales/fs/mkdtemp";
 * const tempDirName0 = await mkdtemp();  // e.g. /tmp/2894ea76
 * const tempDirName1 = await mkdtemp({ prefix: 'my_temp' }); // e.g. /tmp/my_temp339c944d
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary directory.
 * @returns A promise that resolves to a path to the temporary directory.
 */
export declare function mkdtemp(options?: MakeTempOptions): Promise<string>;
/**
 * Synchronously creates a new temporary directory in the default directory
 * for temporary files, unless `dir` is specified. Other optional options
 * include prefixing and suffixing the directory name with `prefix` and
 * `suffix` respectively.
 *
 * The full path to the newly created directory is returned.
 *
 * Multiple programs calling this function simultaneously will create different
 * directories. It is the caller's responsibility to remove the directory when
 * no longer needed.
 *
 * Requires `allow-write` permission.
 *
 * @example Usage
 * ```ts ignore
 * import { mkdtempSync } from "@neotales/fs/mkdtemp";
 * const tempDirName0 = mkdtempSync();  // e.g. /tmp/2894ea76
 * const tempDirName1 = mkdtempSync({ prefix: 'my_temp' });  // e.g. /tmp/my_temp339c944d
 * ```
 *
 * @tags allow-write
 *
 * @param options The options specified when creating a temporary directory.
 * @returns The path of the temporary directory.
 */
export declare function mkdtempSync(options?: MakeTempOptions): string;
