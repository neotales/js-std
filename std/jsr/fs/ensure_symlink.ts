// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
/**
 * The `ensure-symlink` module provides functions to ensure that a symlink
 * exists.
 *
 * @module
 */
import { dirname } from "@neotales/path/dirname";
import { resolve } from "@neotales/path/resolve";
import { ensureDir, ensureDirSync } from "./ensure_dir.ts";
import { getFileInfoType, toPathString } from "./utils.ts";
import type { SymlinkOptions } from "./types.ts";
import { AlreadyExistsError, isAlreadyExistsError } from "./errors.ts";
import { lstat, lstatSync } from "./lstat.ts";
import { readlink, readlinkSync } from "./readlink.ts";
import { symlink, symlinkSync } from "./symlink.ts";
import { WIN } from "./globals.ts";

function resolveSymlinkTarget(target: string | URL, linkName: string | URL) {
  if (typeof target !== "string") {
    return target; // URL is always absolute path
  }
  if (typeof linkName === "string") {
    return resolve(dirname(linkName), target);
  } else {
    return new URL(target, linkName);
  }
}

/**
 * Asynchronously ensures that the link exists, and points to a valid file. If
 * the directory structure does not exist, it is created. If the link already
 * exists, it is not modified but error is thrown if it is not point to the
 * given target.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param target The source file path as a string or URL.
 * @param linkName The destination link path as a string or URL.
 * @returns A void promise that resolves once the link exists.
 *
 * @example
 * ```ts
 * import { ensureSymlink } from "@neotales/fs";
 *
 * await ensureSymlink("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export async function ensureSymlink(target: string | URL, linkName: string | URL) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  const srcStatInfo = await lstat(targetRealPath);
  const srcFilePathType = getFileInfoType(srcStatInfo);

  await ensureDir(dirname(toPathString(linkName)));

  const options: SymlinkOptions | undefined = WIN
    ? {
      type: srcFilePathType === "dir" ? "dir" : "file",
    }
    : undefined;

  try {
    await symlink(target, linkName, options);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
    const linkStatInfo = await lstat(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new AlreadyExistsError(`A '${type}' already exists at the path: ${linkName}`);
    }
    const linkPath = await readlink(linkName);
    const linkRealPath = resolveSymlinkTarget(linkPath, linkName);
    if (linkRealPath !== targetRealPath) {
      throw new AlreadyExistsError(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}

/**
 * Synchronously ensures that the link exists, and points to a valid file. If
 * the directory structure does not exist, it is created. If the link already
 * exists, it is not modified but error is thrown if it is not point to the
 * given target.
 *
 * Requires the `--allow-read` and `--allow-write` flag when using Deno.
 *
 * @param target The source file path as a string or URL.
 * @param linkName The destination link path as a string or URL.
 * @returns A void value that returns once the link exists.
 *
 * @example
 * ```ts
 * import { ensureSymlinkSync } from "@neotales/fs";
 *
 * ensureSymlinkSync("./folder/targetFile.dat", "./folder/targetFile.link.dat");
 * ```
 */
export function ensureSymlinkSync(target: string | URL, linkName: string | URL) {
  const targetRealPath = resolveSymlinkTarget(target, linkName);
  const srcStatInfo = lstatSync(targetRealPath);
  const srcFilePathType = getFileInfoType(srcStatInfo);

  ensureDirSync(dirname(toPathString(linkName)));

  const options: SymlinkOptions | undefined = WIN
    ? {
      type: srcFilePathType === "dir" ? "dir" : "file",
    }
    : undefined;

  try {
    symlinkSync(target, linkName, options);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
    const linkStatInfo = lstatSync(linkName);
    if (!linkStatInfo.isSymlink) {
      const type = getFileInfoType(linkStatInfo);
      throw new AlreadyExistsError(`A '${type}' already exists at the path: ${linkName}`);
    }
    const linkPath = readlinkSync(linkName);
    const linkRealPath = resolveSymlinkTarget(linkPath, linkName);
    if (linkRealPath !== targetRealPath) {
      throw new AlreadyExistsError(
        `A symlink targeting to an undesired path already exists: ${linkName} -> ${linkRealPath}`,
      );
    }
  }
}
