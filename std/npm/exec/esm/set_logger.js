/**
 * The `logger` module provides a way to set a default logger function
 * for logging command execution details.
 *
 * @module
 */
import "./_dnt.polyfills.js";
let logger = undefined;
/**
 * Set the default logger function to write
 * commands when they are invoked.
 *
 * @param defaultLogger The logger function to use.
 * @example
 * ```ts
 * import { setLogger, cmd } from "@neotales/exec";
 *
 * // Log all commands to console
 * setLogger((file, args) => {
 *   console.log(`Executing: ${file} ${args?.join(" ") ?? ""}`);
 * });
 *
 * // Now commands will be logged when executed
 * await cmd(["git", "status"]).output();
 * // Output: "Executing: /usr/bin/git status"
 *
 * // Disable logging
 * setLogger(undefined);
 * ```
 */
export function setLogger(defaultLogger) {
    logger = defaultLogger;
}
/**
 * Gets the default logger function.
 * @returns The default logger function.
 * @example
 * ```ts
 * import { getLogger, setLogger } from "@neotales/exec";
 *
 * // Check if a logger is configured
 * const logger = getLogger();
 * if (logger) {
 *   console.log("Logging is enabled");
 * }
 * ```
 */
export function getLogger() {
    return logger;
}
