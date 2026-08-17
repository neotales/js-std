/**
 * The `errors` module provides custom error classes and utility functions
 * for handling file system errors in a consistent manner.
 *
 * @module
 */
import { globals } from "./globals.ts";
import { AlreadyExists, NotFound } from "./unstable_errors.ts";

/**
 * Represents an error that occurs when a file or directory already exists.
 */
export class AlreadyExistsError extends Error {
  /** Constructs a new instance. */
  constructor(message: string, innerError?: Error) {
    super(message);
    this.name = "AlreadyExistsError";
    if (innerError) (this as Error & { cause?: Error }).cause = innerError;
  }
}

/**
 * Represents an error that occurs when a file or directory is not found.
 */
export class NotFoundError extends Error {
  /** Constructs a new instance. */
  constructor(message: string, innerError?: Error) {
    super(message);
    this.name = "NotFoundError";
    if (innerError) (this as Error & { cause?: Error }).cause = innerError;
  }
}

/**
 * Error thrown in {@linkcode move} or {@linkcode moveSync} when the
 * destination is a subdirectory of the source.
 */
export class SubdirectoryMoveError extends Error {
  /** Constructs a new instance. */
  constructor(src: string | URL, dest: string | URL) {
    super(`Cannot move '${src}' to a subdirectory of itself, '${dest}'.`);
    this.name = this.constructor.name;
  }
}

/**
 * Checks if an error indicates that a file or directory was not found.
 * @param err The error to check.
 * @returns A boolean indicating whether the error indicates that the file or directory was not found.
 */
export function isNotFoundError(err: unknown): boolean {
  if (err instanceof NotFoundError || err instanceof NotFound) {
    return true;
  }

  if (globals.Deno && err instanceof globals.Deno.errors.NotFound) {
    return true;
  }

  // deno-lint-ignore no-explicit-any
  if (err instanceof Error && (err as any).code === "ENOENT") {
    return true;
  }

  return false;
}

/**
 * Checks if an error indicates that a file or directory already exists.
 * @param err The error to check.
 * @returns A boolean indicating whether the error indicates that the file or directory already exists.
 */
export function isAlreadyExistsError(err: unknown): boolean {
  if (err instanceof AlreadyExistsError || err instanceof AlreadyExists) {
    return true;
  }

  if (globals.Deno && err instanceof globals.Deno.errors.AlreadyExists) {
    return true;
  }

  // deno-lint-ignore no-explicit-any
  if (err instanceof Error && (err as any).code === "EEXIST") {
    return true;
  }
  return false;
}
