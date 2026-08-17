// Copyright 2018-2026 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any no-explicit-any no-explicit-any

import { fromFileUrl } from "@neotales/path";
import { globals, IS_DENO } from "./globals.ts";

export function toPathString(pathUrl: string | URL): string {
  return pathUrl instanceof URL ? fromFileUrl(pathUrl) : pathUrl;
}

/**
 * True if the runtime is Deno, false otherwise.
 */
export const isDeno = IS_DENO;

/**
 * @returns The Node.js `fs` module.
 */
export function getNodeFs() {
  return globals.process.getBuiltinModule("node:fs");
}

/**
 * @returns The Node.js `os` module.
 */
export function getNodeOs() {
  return globals.process.getBuiltinModule("node:os");
}

/**
 * @returns The Node.js `path` module.
 */
export function getNodePath() {
  return globals.process.getBuiltinModule("node:path");
}

/**
 * @returns The Node.js `process` module.
 */
export function getNodeProcess() {
  return globals.process.getBuiltinModule("node:process");
}

/**
 * @returns The Node.js `stream` module.
 */
export function getNodeStream() {
  return globals.process.getBuiltinModule("node:stream");
}

/**
 * @returns The Node.js `tty` module.
 */
export function getNodeTty() {
  return globals.process.getBuiltinModule("node:tty");
}

/**
 * @returns The Node.js `util` module.
 */
export function getNodeUtil() {
  return globals.process.getBuiltinModule("node:util");
}

/** @returns The Node.js cryptography module. */
export function getNodeCrypto() {
  return globals.process.getBuiltinModule("node:crypto");
}

/**
 * Used for naming temporary files. See {@linkcode makeTempFile} and
 * {@linkcode makeTempFileSync}.
 * @returns A randomized 6-digit hexadecimal string.
 */
export function randomId(): string {
  const n = (Math.random() * 0xfffff * 1_000_000).toString(16);
  return "".concat(n.slice(0, 6));
}
