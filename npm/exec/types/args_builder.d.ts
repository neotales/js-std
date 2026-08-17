/**
 * The `args-builder` module provides a class for building command line arguments.
 *
 * @module
 */
import "./_dnt.polyfills.js";
/** Options that control how {@linkcode ArgsBuilder} formats arguments. */
export interface ArgsBuilderOptions {
    prefix?: string;
    shortPrefix?: string;
    assign?: string;
    flags?: string[];
    appendArgs?: boolean;
}
/**
 * Builds command arguments without invoking a shell.
 *
 * @example
 * ```ts
 * import { ArgsBuilder } from "@neotales/exec";
 *
 * const args = new ArgsBuilder().subcommand("git", "status").build();
 * ```
 */
export declare class ArgsBuilder {
    #private;
    /**
     * Creates an argument builder.
     *
     * @param options Formatting options for generated arguments.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder({ assign: "=" });
     * ```
     */
    constructor(options?: ArgsBuilderOptions);
    /**
     * The arguments to add.
     *
     * @param arg The arguments to add.
     * @returns The builder.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().args("README.md").build();
     * ```
     */
    args(...arg: string[]): this;
    /**
     * Adds subcommands to the command.
     * @param command The command to add.
     * @returns The builder.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().subcommand("git", "status").build();
     * ```
     */
    subcommand(...command: string[]): this;
    /**
     * Adds a flag to the command.
     * @param flags The flags to add.
     * @returns The builder.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().flag("verbose").build();
     * ```
     */
    flag(...flags: string[]): this;
    /**
     * Adds an option to the command.
     * @param name The name of the option.
     * @param value The value of the option.
     * @param singleQuote Whether to wrap the value in single quotes.
     * @returns The builder.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().option("message", "release notes").build();
     * ```
     */
    option(name: string, value: unknown, singleQuote?: boolean): this;
    /**
     * Appends arguments that should be placed after the command
     * using the `--` separator.
     * @param arg The arguments to append.
     * @returns The builder.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().postArgs("--amend").build();
     * ```
     */
    postArgs(...args: string[]): this;
    /**
     * Builds the arguments.
     * @returns The built arguments.
     * @example
     * ```ts
     * import { ArgsBuilder } from "@neotales/exec";
     *
     * const args = new ArgsBuilder().subcommand("git", "status").build();
     * ```
     */
    build(): string[];
}
