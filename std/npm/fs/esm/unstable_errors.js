/**
 * The `errors` module provides custom error classes and utility functions
 * for handling file system errors in a consistent manner.
 *
 * @module
 */
import { globals } from "./globals.js";
const isDeno = typeof globals.Deno !== "undefined";
// please keep sorted
export const AlreadyExists = isDeno
    ? globals.Deno.errors.AlreadyExists
    : class AlreadyExists extends Error {
    };
export const BadResource = isDeno
    ? globals.Deno.errors.BadResource
    : class BadResource extends Error {
    };
export const BrokenPipe = isDeno
    ? globals.Deno.errors.BrokenPipe
    : class BrokenPipe extends Error {
    };
export const Busy = isDeno ? globals.Deno.errors.Busy : class Busy extends Error {
};
export const Interrupted = isDeno
    ? globals.Deno.errors.Interrupted
    : class Interrupted extends Error {
    };
export const InvalidData = isDeno
    ? globals.Deno.errors.InvalidData
    : class InvalidData extends Error {
    };
export const NotFound = isDeno ? globals.Deno.errors.NotFound : class NotFound extends Error {
};
export const PermissionDenied = isDeno
    ? globals.Deno.errors.PermissionDenied
    : class PermissionDenied extends Error {
    };
export const TimedOut = isDeno ? globals.Deno.errors.TimedOut : class TimedOut extends Error {
};
export const UnexpectedEof = isDeno
    ? globals.Deno.errors.UnexpectedEof
    : class UnexpectedEof extends Error {
    };
export const WriteZero = isDeno ? globals.Deno.errors.WriteZero : class WriteZero extends Error {
};
