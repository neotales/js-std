/**
 * The `errors` module provides error classes for handling command execution errors.
 *
 * @module
 */
/**
 * Represents an error that occurs when executing a command.
 */
import "./_dnt.polyfills.js";
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
export class CommandError extends Error {
    /**
     * Creates a new instance of the CommandError class.
     */
    constructor() {
        const arg = arguments.length === 1 ? arguments[0] : undefined;
        const options = arg && typeof arg === "object" ? arguments[0] : {};
        const message = typeof arg === "string" ? arguments[0] : options.message;
        super(message ?? `Command ${options.fileName} failed with exit code ${options.code}`);
        /**
         * The exit code of the command.
         */
        Object.defineProperty(this, "exitCode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The name of the command.
         */
        Object.defineProperty(this, "fileName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The arguments passed to the command.
         */
        Object.defineProperty(this, "args", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The descriptor of the target when the error occurred.
         */
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * A link to more information about the error.
         */
        Object.defineProperty(this, "link", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (options.cause !== undefined)
            Object.defineProperty(this, "cause", { value: options.cause });
        this.name = "CommandError";
        this.exitCode = options.code;
        this.fileName = options.fileName;
        this.args = options.args;
        this.target = options.target;
        this.link = options.link ?? "https://jsr.io/@neotales/exec/doc/errors/~/CommandError";
    }
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
export class NotFoundOnPathError extends Error {
    constructor() {
        const arg = arguments.length === 1 ? arguments[0] : undefined;
        const options = arg && typeof arg === "object" ? arguments[0] : {};
        const message = typeof arg === "string" ? arguments[0] : options.message;
        super(message ?? `Executable ${options.exe} not found on environment PATH.`);
        /**
         * The descriptor of the target when the error occurred.
         */
        Object.defineProperty(this, "target", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * A link to more information about the error.
         */
        Object.defineProperty(this, "link", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /**
         * The name or path of the command that was not found.
         */
        Object.defineProperty(this, "exe", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        if (options.cause !== undefined)
            Object.defineProperty(this, "cause", { value: options.cause });
        this.name = "NotFoundOnPathError";
        this.target = options.target;
        this.link = options.link ?? "https://jsr.io/@neotales/exec/doc/errors/~/NotFoundOnPathError";
        this.exe = options.exe;
    }
}
