var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ArgsBuilder_command, _ArgsBuilder_arguments, _ArgsBuilder_options, _ArgsBuilder_flags, _ArgsBuilder_argOptions, _ArgsBuilder_postArguments;
/**
 * The `args-builder` module provides a class for building command line arguments.
 *
 * @module
 */
import "./_dnt.polyfills.js";
import { isSpace } from "@neotales/chars/is-space";
function includesSpace(str) {
    for (let i = 0; i < str.length; i++) {
        if (isSpace(str.codePointAt(i) ?? 0)) {
            return true;
        }
    }
    return false;
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
export class ArgsBuilder {
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
    constructor(options = {}) {
        _ArgsBuilder_command.set(this, void 0);
        _ArgsBuilder_arguments.set(this, void 0);
        _ArgsBuilder_options.set(this, void 0);
        _ArgsBuilder_flags.set(this, void 0);
        _ArgsBuilder_argOptions.set(this, void 0);
        _ArgsBuilder_postArguments.set(this, void 0);
        __classPrivateFieldSet(this, _ArgsBuilder_command, [], "f");
        __classPrivateFieldSet(this, _ArgsBuilder_arguments, [], "f");
        __classPrivateFieldSet(this, _ArgsBuilder_options, {}, "f");
        __classPrivateFieldSet(this, _ArgsBuilder_flags, [], "f");
        __classPrivateFieldSet(this, _ArgsBuilder_postArguments, [], "f");
        __classPrivateFieldSet(this, _ArgsBuilder_argOptions, {
            prefix: "--",
            shortPrefix: "-",
            ...options,
        }, "f");
    }
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
    args(...arg) {
        __classPrivateFieldGet(this, _ArgsBuilder_arguments, "f").push(...arg);
        return this;
    }
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
    subcommand(...command) {
        __classPrivateFieldGet(this, _ArgsBuilder_command, "f").push(...command);
        return this;
    }
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
    flag(...flags) {
        __classPrivateFieldGet(this, _ArgsBuilder_flags, "f").push(...flags);
        return this;
    }
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
    option(name, value, singleQuote = false) {
        if (singleQuote) {
            __classPrivateFieldGet(this, _ArgsBuilder_options, "f")[name] = `'${value}'`;
        }
        else {
            __classPrivateFieldGet(this, _ArgsBuilder_options, "f")[name] = value;
        }
        return this;
    }
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
    postArgs(...args) {
        __classPrivateFieldGet(this, _ArgsBuilder_postArguments, "f").push(...args);
        return this;
    }
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
    build() {
        const args = [];
        if (__classPrivateFieldGet(this, _ArgsBuilder_command, "f").length > 0) {
            args.push(...__classPrivateFieldGet(this, _ArgsBuilder_command, "f"));
        }
        if (!__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").appendArgs) {
            args.push(...__classPrivateFieldGet(this, _ArgsBuilder_arguments, "f"));
        }
        for (const flag of __classPrivateFieldGet(this, _ArgsBuilder_flags, "f")) {
            if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix && flag.length === 1) {
                args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix + flag);
            }
            else {
                args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").prefix + flag);
            }
        }
        for (const [key, value] of Object.entries(__classPrivateFieldGet(this, _ArgsBuilder_options, "f"))) {
            if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").flags?.includes(key)) {
                if (!value) {
                    continue;
                }
                if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix && key.length === 1) {
                    args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix + key);
                }
                else {
                    args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").prefix + key);
                }
                continue;
            }
            let v = value;
            if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").assign) {
                if (typeof v === "string") {
                    if (!v.startsWith("'") && !v.startsWith('"') && includesSpace(v)) {
                        v = `"${v}"`;
                    }
                }
                if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix && key.length === 1) {
                    args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix + key + __classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").assign + v);
                }
                else {
                    args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").prefix + key + __classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").assign + v);
                }
                continue;
            }
            if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix && key.length === 1) {
                args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").shortPrefix + key);
            }
            else {
                args.push(__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").prefix + key);
            }
            args.push(String(v));
        }
        if (__classPrivateFieldGet(this, _ArgsBuilder_argOptions, "f").appendArgs) {
            args.push(...__classPrivateFieldGet(this, _ArgsBuilder_arguments, "f"));
        }
        if (__classPrivateFieldGet(this, _ArgsBuilder_postArguments, "f").length > 0) {
            args.push("--");
            args.push(...__classPrivateFieldGet(this, _ArgsBuilder_postArguments, "f"));
        }
        return args;
    }
}
_ArgsBuilder_command = new WeakMap(), _ArgsBuilder_arguments = new WeakMap(), _ArgsBuilder_options = new WeakMap(), _ArgsBuilder_flags = new WeakMap(), _ArgsBuilder_argOptions = new WeakMap(), _ArgsBuilder_postArguments = new WeakMap();
