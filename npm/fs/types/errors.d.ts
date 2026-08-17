/**
 * The `errors` module provides custom error classes and utility functions
 * for handling file system errors in a consistent manner.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/**
 * Represents an error that occurs when a file or directory already exists.
 */
export declare class AlreadyExistsError extends Error {
    /** Constructs a new instance. */
    constructor(message: string, innerError?: Error);
}
/**
 * Represents an error that occurs when a file or directory is not found.
 */
export declare class NotFoundError extends Error {
    /** Constructs a new instance. */
    constructor(message: string, innerError?: Error);
}
/**
 * Error thrown in {@linkcode move} or {@linkcode moveSync} when the
 * destination is a subdirectory of the source.
 */
export declare class SubdirectoryMoveError extends Error {
    /** Constructs a new instance. */
    constructor(src: string | URL, dest: string | URL);
}
/**
 * Checks if an error indicates that a file or directory was not found.
 * @param err The error to check.
 * @returns A boolean indicating whether the error indicates that the file or directory was not found.
 */
export declare function isNotFoundError(err: unknown): boolean;
/**
 * Checks if an error indicates that a file or directory already exists.
 * @param err The error to check.
 * @returns A boolean indicating whether the error indicates that the file or directory already exists.
 */
export declare function isAlreadyExistsError(err: unknown): boolean;
