/**
 * The `logger` module provides a way to set a default logger function
 * for logging command execution details.
 *
 * @module
 */
import "./_dnt.polyfills.js";
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
export declare function setLogger(defaultLogger?: (file: string, args?: string[]) => void): void;
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
export declare function getLogger(): undefined | ((file: string, args?: string[]) => void);
