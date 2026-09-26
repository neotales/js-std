// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * The `ensure-link` module provides functions to ensure that a hard link
 * exists.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { dirname } from "@neotales/path/dirname";
import { ensureDir, ensureDirSync } from "./ensure_dir.js";
import { toPathString } from "./utils.js";
import { link, linkSync } from "./link.js";
/**
 * Asynchronously ensures that the hard link exists. If the directory structure
 * does not exist, it is created.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 * @returns A void promise that resolves once the hard link exists.
 *
 * @example
 * ```ts
 * import { ensureLink } from "@neotales/fs";
 *
 * await ensureLink("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export async function ensureLink(src, dest) {
    dest = toPathString(dest);
    await ensureDir(dirname(dest));
    await link(toPathString(src), dest);
}
/**
 * Synchronously ensures that the hard link exists. If the directory structure
 * does not exist, it is created.
 *
 * @param src The source file path as a string or URL. Directory hard links are
 * not allowed.
 * @param dest The destination link path as a string or URL.
 * @returns A void value that returns once the hard link exists.
 *
 * @example
 * ```ts
 * import { ensureLinkSync } from "@neotales/fs";
 *
 * ensureLinkSync("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export function ensureLinkSync(src, dest) {
    dest = toPathString(dest);
    ensureDirSync(dirname(dest));
    linkSync(toPathString(src), dest);
}
