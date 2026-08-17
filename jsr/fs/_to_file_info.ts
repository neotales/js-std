import type { FileInfo } from "./types.ts";
import { WIN as WINDOWS } from "./globals.ts";

export function toFileInfo(s: import("node:fs").Stats): FileInfo {
  return {
    atime: s.atime,
    // TODO(kt3k): uncomment this when we drop support for Deno 1.x
    // ctime: s.ctime,
    birthtime: s.birthtime,
    blksize: WINDOWS ? null : s.blksize,
    blocks: WINDOWS ? null : s.blocks,
    dev: s.dev,
    gid: WINDOWS ? null : s.gid,
    ino: WINDOWS ? null : s.ino,
    isDirectory: s.isDirectory(),
    isFile: s.isFile(),
    isSymlink: s.isSymbolicLink(),
    isBlockDevice: WINDOWS ? null : s.isBlockDevice(),
    isCharDevice: WINDOWS ? null : s.isCharacterDevice(),
    isFifo: WINDOWS ? null : s.isFIFO(),
    isSocket: WINDOWS ? null : s.isSocket(),
    mode: WINDOWS ? null : s.mode,
    mtime: s.mtime,
    nlink: WINDOWS ? null : s.nlink,
    rdev: WINDOWS ? null : s.rdev,
    size: s.size,
    uid: WINDOWS ? null : s.uid,
  };
}
