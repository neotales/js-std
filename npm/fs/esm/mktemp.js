// Copyright 2018-2026 the Deno authors. MIT license.
import "./_dnt.polyfills.js";
import { getNodeCrypto, getNodeFs, getNodeOs, getNodePath, isDeno } from "./_utils.js";
import { mapError } from "./_map_error.js";
import { globals } from "./globals.js";
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
export async function mktemp(options) {
    if (isDeno) {
        return globals.Deno.makeTempFile({ ...options });
    }
    else {
        const { dir, prefix, suffix } = options ?? {};
        try {
            const { tmpdir } = getNodeOs();
            const { join } = getNodePath();
            const directory = typeof dir === "string" && dir !== "" ? dir : tmpdir();
            const namePrefix = typeof prefix === "string" ? prefix : "";
            const nameSuffix = typeof suffix === "string" ? suffix : "";
            for (let attempt = 0; attempt < 10; attempt++) {
                const tempFilePath = join(directory, `${namePrefix}${getNodeCrypto().randomBytes(16).toString("hex")}${nameSuffix}`);
                try {
                    const handle = await getNodeFs().promises.open(tempFilePath, "wx", 0o600);
                    await handle.close();
                    return tempFilePath;
                }
                catch (error) {
                    if (error.code !== "EEXIST")
                        throw error;
                }
            }
            throw new Error("Unable to allocate a unique temporary file after 10 attempts.");
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
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
export function mktempSync(options) {
    if (isDeno) {
        return globals.Deno.makeTempFileSync({ ...options });
    }
    else {
        const { dir, prefix, suffix } = options ?? {};
        try {
            const { tmpdir } = getNodeOs();
            const { join } = getNodePath();
            const directory = typeof dir === "string" && dir !== "" ? dir : tmpdir();
            const namePrefix = typeof prefix === "string" ? prefix : "";
            const nameSuffix = typeof suffix === "string" ? suffix : "";
            for (let attempt = 0; attempt < 10; attempt++) {
                const tempFilePath = join(directory, `${namePrefix}${getNodeCrypto().randomBytes(16).toString("hex")}${nameSuffix}`);
                try {
                    const fd = getNodeFs().openSync(tempFilePath, "wx", 0o600);
                    getNodeFs().closeSync(fd);
                    return tempFilePath;
                }
                catch (error) {
                    if (error.code !== "EEXIST")
                        throw error;
                }
            }
            throw new Error("Unable to allocate a unique temporary file after 10 attempts.");
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
