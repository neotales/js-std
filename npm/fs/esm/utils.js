import { basename, fromFileUrl, normalize, resolve, SEPARATOR } from "@neotales/path";
import { stat, statSync } from "./stat.js";
export function toPathString(pathUrl) {
    return pathUrl instanceof URL ? fromFileUrl(pathUrl) : pathUrl;
}
/**
 * Get a human readable file type string.
 *
 * @param fileInfo A FileInfo describes a file and is returned by `stat`,
 *                 `lstat`
 */
export function getFileInfoType(fileInfo) {
    return fileInfo.isFile
        ? "file"
        : fileInfo.isDirectory
            ? "dir"
            : fileInfo.isSymlink
                ? "symlink"
                : undefined;
}
/**
 * Test whether or not `dest` is a sub-directory of `src`
 * @param src src file path
 * @param dest dest file path
 * @param sep path separator
 */
export function isSubdir(src, dest, sep = SEPARATOR) {
    if (src === dest) {
        return false;
    }
    src = toPathString(src);
    const srcArray = src.split(sep);
    dest = toPathString(dest);
    const destArray = dest.split(sep);
    return srcArray.every((current, i) => destArray[i] === current);
}
/**
 * Test whether `src` and `dest` resolve to the same location
 * @param src src file path
 * @param dest dest file path
 */
export function isSamePath(src, dest) {
    src = toPathString(src);
    dest = toPathString(dest);
    return resolve(src) === resolve(dest);
}
/** Create {@linkcode WalkEntry} for the `path` synchronously. */
export function createWalkEntrySync(path) {
    path = toPathString(path);
    path = normalize(path);
    const info = statSync(path);
    const name = basename(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink,
    };
}
/** Create {@linkcode WalkEntry} for the `path` asynchronously. */
export async function createWalkEntry(path) {
    path = toPathString(path);
    path = normalize(path);
    const name = basename(path);
    const info = await stat(path);
    return {
        path,
        name,
        isFile: info.isFile,
        isDirectory: info.isDirectory,
        isSymlink: info.isSymlink,
    };
}
