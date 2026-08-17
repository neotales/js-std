// Copyright 2018-2026 the Deno authors. MIT license.

import type { DirEntry } from "./types.ts";

export function toDirEntry(s: import("node:fs").Dirent): DirEntry {
  return {
    name: s.name,
    isFile: s.isFile(),
    isDirectory: s.isDirectory(),
    isSymlink: s.isSymbolicLink(),
  };
}
