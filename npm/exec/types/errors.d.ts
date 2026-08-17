/**
 * The `errors` module provides error classes for handling command execution errors.
 *
 * @module
 */
/**
 * Represents an error that occurs when executing a command.
 */
import "./_dnt.polyfills.js";
export interface CommandErrorOptions {
    /**
     * The exit code of the command.
     */
    code?: number;
    /**
     * The name of the command.
     */
    fileName?: string;
    /**
     * The arguments passed to the command.
     */
    args?: string[];
    /**
     * The descriptor of the target when the error occurred.
     */
    target?: string;
    /**
     * A link to more information about the error.
     */
    link?: string;
    /**
     * The error message.
     */
    message?: string;
    /**
     * The underlying cause of the error.
     */
    cause?: unknown;
}
/**
 * Represents an error that occurs when executing a command.
 *
 * @example
 * ```ts
 * import { CommandError, exec } from "@neotales/exec";
 *
 * try {
 *   const output = await exec(["git", "clone"]);
 *   output.validate(); // Throws if exit code is non-zero
 * } catch (e) {
 *   if (e instanceof CommandError) {
 *     console.log("Command failed:", e.fileName);
 *     console.log("Exit code:", e.exitCode);
 *   }
 * }
 *
 * // Create a CommandError manually
 * throw new CommandError({
 *   fileName: "my-command",
 *   code: 1,
 *   message: "Command failed with error",
 * });
 * ```
 */
export declare class CommandError extends Error {
    /**
     * The exit code of the command.
     */
    exitCode?: number;
    /**
     * The name of the command.
     */
    fileName?: string;
    /**
     * The arguments passed to the command.
     */
    args?: string[];
    /**
     * The descriptor of the target when the error occurred.
     */
    target?: string;
    /**
     * A link to more information about the error.
     */
    link?: string;
    /**
     * Creates a new instance of the CommandError class.
     * @param options The options for the error.
     * @example
     * ```ts
     * import { CommandError } from "@neotales/exec";
     *
     * const error = new CommandError({ fileName: "git", code: 1 });
     * ```
     */
    constructor(options: CommandErrorOptions);
    /**
     * Creates a new instance of the CommandError class.
     * @param message The error message.
     */
    constructor(message?: string);
}
/**
 * Represents an error that occurs when a command is not found on the PATH.
 */
export interface NotFoundOnPathErrorOptions {
    /**
     * The name or path of the command that was not found.
     */
    exe?: string;
    /**
     * The descriptor of the target when the error occurred.
     */
    target?: string;
    /**
     * A link to more information about the error.
     */
    link?: string;
    /**
     * The error message.
     */
    message?: string;
    /**
     * The underlying cause of the error.
     */
    cause?: unknown;
}
/** *
 * Represents an error that occurs when a command is not found on the PATH.
 *
 * @example
 * ```ts
 * import { NotFoundOnPathError, exec } from "@neotales/exec";
 *
 * try {
 *   await exec(["non-existent-command"]);
 * } catch (e) {
 *   if (e instanceof NotFoundOnPathError) {
 *     console.log("Executable not found:", e.exe);
 *   }
 * }
 * ```
 */
export declare class NotFoundOnPathError extends Error {
    /**
     * The descriptor of the target when the error occurred.
     */
    target?: string;
    /**
     * A link to more information about the error.
     */
    link?: string;
    /**
     * The name or path of the command that was not found.
     */
    exe?: string;
    /**
     * Creates a new instance of the NotFoundOnPathError class.
     * @param options The options for the error.
     * @example
     * ```ts
     * import { NotFoundOnPathError } from "@neotales/exec";
     *
     * const error = new NotFoundOnPathError({ exe: "missing-tool" });
     * ```
     */
    constructor(options: NotFoundOnPathErrorOptions);
    /**
     * Creates a new instance of the NotFoundOnPathError class.
     * @param message The error message.
     */
    constructor(message: string);
    /**
     * Creates a new instance of the NotFoundOnPathError class.
     */
    constructor();
}
