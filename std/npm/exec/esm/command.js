var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _a, _Command_pipeFactory, _Pipe_promise, _DenoChildProcess_childProcess, _DenoChildProcess_options, _DenoChildProcess_file, _DenoOutput_text, _DenoOutput_lines, _DenoOutput_json, _DenoOutput_errorText, _DenoOutput_errorLines, _DenoOutput_errorJson, _DenoOutput_file, _NodeOutput_text, _NodeOutput_lines, _NodeOutput_json, _NodeOutput_errorText, _NodeOutput_errorLines, _NodeOutput_errorJson, _NodeOutput_file, _NodeChildProcess_child, _NodeChildProcess_stdout, _NodeChildProcess_stderr, _NodeChildProcess_stdin, _NodeChildProcess_status, _NodeChildProcess_file;
/**
 * The `commands` module provides a set of classes and functions for executing
 * commands in a shell environment. It includes the `Command` class for
 * executing commands, the `ShellCommand` class for executing shell scripts,
 * and the `Pipe` class for chaining commands together. The module also
 * provides utility functions for creating commands, executing
 * commands, and handling output.
 *
 * @module
 */
import "./_dnt.polyfills.js";
// @ts-nocheck TS2455
import { CommandError, NotFoundOnPathError } from "./errors.js";
import { globals, loadChildProcess } from "./globals.js";
import { pathFinder } from "./path_finder.js";
import { getLogger } from "./set_logger.js";
import { splat } from "@neotales/args/splat";
import { split } from "@neotales/args/split";
import { rm, rmSync } from "@neotales/fs/rm";
/**
 * Converts the command arguments to an array of strings.
 * @param args Converts the command arguments to an array of strings.
 * @returns The array of strings.
 * @example
 * ```ts
 * import { convertCommandArgs } from "@neotales/exec";
 *
 * // Convert a string with spaces
 * const args1 = convertCommandArgs("git commit -m 'hello world'");
 * console.log(args1); // ["git", "commit", "-m", "hello world"]
 *
 * // Convert an object with options
 * const args2 = convertCommandArgs({ verbose: true, count: 5 });
 * console.log(args2); // ["--verbose", "--count", "5"]
 *
 * // Convert an array (pass-through)
 * const args3 = convertCommandArgs(["git", "status"]);
 * console.log(args3); // ["git", "status"]
 * ```
 */
export function convertCommandArgs(args) {
    if (args === undefined || args === null) {
        return [];
    }
    if (typeof args === "string") {
        return split(args);
    }
    if (Array.isArray(args)) {
        return args;
    }
    return splat(args);
}
/**
 * Represents a command that can be executed.
 *
 * @example
 * ```ts
 * import { Command } from "@neotales/exec";
 *
 * // Create and execute a simple command
 * const cmd = new Command(["echo", "hello world"]);
 * const output = await cmd.output();
 * console.log(output.text()); // "hello world\n"
 *
 * // Use with options
 * const cmd2 = new Command(["ls", "-la"], {
 *   cwd: "/tmp",
 *   env: { MY_VAR: "value" }
 * });
 * const result = await cmd2.output();
 * console.log(result.code); // 0
 *
 * // Commands can be awaited directly
 * const output2 = await new Command(["cat", "file.txt"]);
 * console.log(output2.text());
 * ```
 */
export class Command {
    /**
     * Creates a new instance of the Command class.
     * @param file The executable command.
     * @param args The arguments for the command.
     * @param options The options for the command.
     * @example
     * ```ts
     * import { Command } from "@neotales/exec";
     *
     * const command = new Command(["git", "status"]);
     * ```
     */
    constructor(args, options) {
        Object.defineProperty(this, "file", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "args", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        options ??= {};
        if (args === undefined || args === null) {
            this.file = "";
            this.args = [];
        }
        else if (typeof args === "string" && !args.includes(" ")) {
            this.file = args;
            this.args = [];
        }
        else if (Array.isArray(args)) {
            this.file = args[0];
            this.args = args.length > 0 ? args.slice(1) : [];
        }
        else {
            const a = convertCommandArgs(args);
            this.file = a.shift() ?? "";
            this.args = a;
        }
        options.stdin ??= "inherit";
        options.stderr ??= "piped";
        options.stdout ??= "piped";
        this.options = options;
        this.options.log ??= getLogger();
    }
    /**
     * Returns the executable followed by its resolved arguments.
     *
     * @example
     * ```ts
     * import { Command } from "@neotales/exec";
     *
     * const args = new Command(["git", "status"]).toArgs();
     * ```
     */
    toArgs() {
        const args = convertCommandArgs(this.args ?? []);
        return [this.file, ...args];
    }
    /**
     * Returns this command's execution options.
     *
     * @example
     * ```ts
     * import { Command } from "@neotales/exec";
     *
     * const options = new Command(["git", "status"], { cwd: "/tmp" }).toOptions();
     * ```
     */
    toOptions() {
        return this.options ?? {};
    }
    /**
     * Replaces the executable used by this command.
     *
     * @param value The executable path or name.
     * @returns This command.
     * @example
     * ```ts
     * import { Command } from "@neotales/exec";
     *
     * const command = new Command(["placeholder"]).withFile("git");
     * ```
     */
    withFile(value) {
        this.file = value;
        return this;
    }
    /**
     * Sets the current working directory for the command.
     * @param value The current working directory.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const output = await cmd(["ls", "-la"])
     *   .withCwd("/tmp")
     *   .output();
     * console.log(output.text());
     * ```
     */
    withCwd(value) {
        this.options ??= {};
        this.options.cwd = value;
        return this;
    }
    /**
     * Sets the environment variables for the command.
     * @param value The environment variables.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const output = await cmd(["printenv", "MY_VAR"])
     *   .withEnv({ MY_VAR: "hello" })
     *   .output();
     * console.log(output.text()); // "hello\n"
     * ```
     */
    withEnv(value) {
        this.options ??= {};
        this.options.env = value;
        return this;
    }
    /**
     * Sets the user ID for the command.
     * @param value The user ID.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * cmd(["id"]).withUid(1000);
     * ```
     */
    withUid(value) {
        this.options ??= {};
        this.options.uid = value;
        return this;
    }
    /**
     * Sets the group ID for the command.
     * @param value The group ID.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * cmd(["id"]).withGid(1000);
     * ```
     */
    withGid(value) {
        this.options ??= {};
        this.options.gid = value;
        return this;
    }
    /**
     * Sets the abort signal for the command.
     * @param value The abort signal.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const controller = new AbortController();
     * cmd(["git", "fetch"]).withSignal(controller.signal);
     * ```
     */
    withSignal(value) {
        this.options ??= {};
        this.options.signal = value;
        return this;
    }
    /**
     * Sets the arguments for the command.
     * @param value The arguments.
     * @param includesFile Whether `value` includes a replacement executable.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * cmd(["git"]).withArgs(["status", "--short"]);
     * ```
     */
    withArgs(value, includesFile = false) {
        const args = convertCommandArgs(value);
        if (includesFile) {
            this.file = args.shift() ?? "";
        }
        this.args = args;
        return this;
    }
    /**
     * Sets the stdin behavior for the command.
     * @param value The stdin behavior.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const output = await cmd(["cat"])
     *   .withStdin("piped")
     *   .withStdout("piped")
     *   .output();
     * ```
     */
    withStdin(value) {
        this.options ??= {};
        this.options.stdin = value;
        return this;
    }
    /**
     * Sets the stdout behavior for the command.
     * @param value The stdout behavior.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * cmd(["git", "status"]).withStdout("piped");
     * ```
     */
    withStdout(value) {
        this.options ??= {};
        this.options.stdout = value;
        return this;
    }
    /**
     * Sets the stderr behavior for the command.
     * @param value The stderr behavior.
     * @returns The Command instance.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * cmd(["git", "status"]).withStderr("inherit");
     * ```
     */
    withStderr(value) {
        this.options ??= {};
        this.options.stderr = value;
        return this;
    }
    /**
     * Thenable method that allows the Command object to be used as a promise which calls the `output` method.
     * It is not recommended to use this method directly. Instead, use the `output` method.
     * @param onfulfilled A function called when the promise is fulfilled.
     * @param onrejected A function called when the promise is rejected.
     * @returns A promise that resolves to the output of the command.
     * @example
     * ```ts
     * import { Command } from "@neotales/exec";
     *
     * var cmd = new Command("echo", ["hello world"], { stdout: 'piped' });
     * const result = await cmd;
     * console.log(result.code);
     * console.log(result.stdout);
     * console.log(result.text());
     * ```
     */
    then(onfulfilled,
    // deno-lint-ignore no-explicit-any
    onrejected) {
        return this.output().then(onfulfilled, onrejected);
    }
    /**
     * Runs the command asynchronously and returns a promise that resolves to the output of the command.
     * The stdout and stderr are set to `inherit`.
     * @returns A promise that resolves to the output of the command.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * // Run command with inherited stdout/stderr (output shown in terminal)
     * const output = await cmd(["npm", "install"]).run();
     * console.log(output.code); // 0
     * ```
     */
    async run() {
        this.options ??= {};
        const { stdout, stderr } = this.options;
        try {
            this.options.stdout = "inherit";
            this.options.stderr = "inherit";
            return await this.output();
        }
        finally {
            this.options.stdout = stdout;
            this.options.stderr = stderr;
        }
    }
    /**
     * Runs the command synchronously and returns the output of the command.
     * The stdout and stderr are set to `inherit`.
     * @returns The output of the command.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * // Run command synchronously with inherited stdout/stderr
     * const output = cmd(["echo", "hello"]).runSync();
     * console.log(output.code); // 0
     * ```
     */
    runSync() {
        this.options ??= {};
        const { stdout, stderr } = this.options;
        try {
            this.options.stdout = "inherit";
            this.options.stderr = "inherit";
            return this.outputSync();
        }
        finally {
            this.options.stdout = stdout;
            this.options.stderr = stderr;
        }
    }
    pipe() {
        var _b;
        this.options ??= {};
        this.options.stdout = "piped";
        this.options.stderr = "inherit";
        if (arguments.length === 0) {
            throw new Error("Invalid arguments");
        }
        let next;
        if (typeof arguments[0] === "object" && "spawn" in arguments[0]) {
            next = arguments[0];
        }
        else {
            const args = arguments[0];
            const options = arguments[1];
            const ctor = Object.getPrototypeOf(this).constructor;
            next = new ctor(args, options);
            next.withStdout("piped");
            next.withStdin("piped");
            next.withStderr("null");
        }
        __classPrivateFieldSet(_b = _a, _a, __classPrivateFieldGet(_b, _a, "f", _Command_pipeFactory) ?? new PipeFactory((args, options) => {
            const ctor = Object.getPrototypeOf(this).constructor;
            next = new ctor(args, options);
            next.withStdin("piped");
            next.withStdout("piped");
            next.withStderr("null");
            return next;
        }), "f", _Command_pipeFactory);
        return __classPrivateFieldGet(_a, _a, "f", _Command_pipeFactory).create(this.spawn()).pipe(next);
    }
    /**
     * Gets the output of the command as text.
     * @returns A promise that resolves to the output of the command as text.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const text = await cmd(["echo", "hello"]).text();
     * console.log(text); // "hello\n"
     * ```
     */
    async text() {
        this.options ??= {};
        const { stdout } = this.options;
        try {
            this.options.stdout = "piped";
            const output = await this.output();
            return output.text();
        }
        finally {
            this.options.stdout = stdout;
        }
    }
    /**
     * Gets the output of the command as an array of lines.
     * @returns A promise that resolves to the output of the command as an array of lines.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const lines = await cmd(["ls", "-la"]).lines();
     * for (const line of lines) {
     *   console.log(line);
     * }
     * ```
     */
    async lines() {
        this.options ??= {};
        const { stdout } = this.options;
        try {
            this.options.stdout = "piped";
            const output = await this.output();
            return output.lines();
        }
        finally {
            this.options.stdout = stdout;
        }
    }
    /**
     * Gets the output of the command as JSON.
     * @returns A promise that resolves to the output of the command as JSON.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const data = await cmd(["echo", '{"name": "test"}']).json();
     * console.log(data); // { name: "test" }
     * ```
     */
    async json() {
        this.options ??= {};
        const { stdout } = this.options;
        try {
            this.options.stdout = "piped";
            const output = await this.output();
            return output.json();
        }
        finally {
            this.options.stdout = stdout;
        }
    }
    /**
     * Gets the output of the command.
     * @returns A promise that resolves to the output of the command.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const output = await cmd(["git", "status"]).output();
     * console.log(output.code);    // Exit code (0 = success)
     * console.log(output.success); // true if code === 0
     * console.log(output.text());  // stdout as string
     * ```
     */
    output() {
        throw new Error("Not implemented");
    }
    /**
     * Gets the output of the command synchronously.
     * @returns The output of the command.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * const output = cmd(["echo", "hello"]).outputSync();
     * console.log(output.text()); // "hello\n"
     * ```
     */
    outputSync() {
        throw new Error("Not implemented");
    }
    /**
     * Spawns a child process for the command.
     * @returns The spawned child process.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * await using process = cmd(["node", "server.js"]).spawn();
     * console.log(process.pid); // Process ID
     * // ... later
     * process.kill("SIGTERM");
     * ```
     */
    spawn() {
        throw new Error("Not implemented");
    }
}
_a = Command;
_Command_pipeFactory = { value: void 0 };
/**
 * Represents a shell command.
 *
 * @example
 * ```ts
 * import { ShellCommand, type ShellCommandOptions } from "@neotales/exec";
 *
 * // Extend ShellCommand for a specific shell
 * class BashCommand extends ShellCommand {
 *   constructor(script: string, options?: ShellCommandOptions) {
 *     super("bash", script, options);
 *   }
 *
 *   override get ext(): string {
 *     return ".sh";
 *   }
 *
 *   override getShellArgs(script: string, isFile: boolean): string[] {
 *     return isFile ? [script] : ["-c", script];
 *   }
 * }
 *
 * const cmd = new BashCommand("echo 'Hello from bash'");
 * const output = await cmd.output();
 * console.log(output.text()); // "Hello from bash\n"
 * ```
 */
export class ShellCommand extends Command {
    /**
     * Creates a new instance of the ShellCommand class.
     * @param exe The executable command.
     * @param script The shell script or command to execute.
     * @param options The options for the shell command.
     * @example
     * ```ts
     * import { ShellCommand } from "@neotales/exec";
     *
     * const command = new ShellCommand("sh", "echo hello");
     * ```
     */
    constructor(exe, script, options) {
        super(undefined, options);
        Object.defineProperty(this, "shellArgs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "script", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "isFile", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.file = exe;
        this.options ??= {};
        if (options?.args) {
            this.args = convertCommandArgs(options.args);
        }
        this.shellArgs = options?.shellArgs;
        this.script = script;
        this.isFile = options?.isFile;
    }
    /**
     * Gets the file extension for the shell script.
     * @returns The file extension.
     * @example
     * ```ts
     * import { ShellCommand } from "@neotales/exec";
     *
     * const extension = new ShellCommand("sh", "echo hello").ext;
     * ```
     */
    get ext() {
        return "";
    }
    /**
     * Returns the shell executable and arguments for this script.
     *
     * @example
     * ```ts
     * import { ShellCommand } from "@neotales/exec";
     *
     * const args = new ShellCommand("sh", "echo hello").toArgs();
     * ```
     */
    toArgs() {
        const { file, generated } = this.getScriptFile();
        const args = this.getShellArgs(file ?? this.script, generated || (this.isFile ?? false));
        return [this.file, ...args];
    }
    /**
     * Gets the shell arguments for the given script and file type.
     * @param script The shell script or command.
     * @param isFile Indicates whether the script is a file.
     * @returns An array of shell arguments.
     * @example
     * ```ts
     * import { ShellCommand } from "@neotales/exec";
     *
     * const args = new ShellCommand("sh", "echo hello").getShellArgs("echo hello", false);
     * ```
     */
    // deno-lint-ignore no-unused-vars
    getShellArgs(script, _isFile) {
        const args = [...(this.shellArgs ?? [])];
        args.push(script);
        return args;
    }
    /**
     * Gets the script file information. The `file` property is undefined if the script is not a file.
     * @returns An object containing the script file path and whether it was generated.
     * @example
     * ```ts
     * import { ShellCommand } from "@neotales/exec";
     *
     * const script = new ShellCommand("sh", "echo hello").getScriptFile();
     * ```
     */
    getScriptFile() {
        if (this.isFile ||
            (!this.script.match(/\n/) && this.ext.length && this.script.trimEnd().endsWith(this.ext))) {
            return { file: this.script, generated: false };
        }
        return { file: undefined, generated: false };
    }
}
/**
 * Creates a new command instance. This is a shorthand for creating a new
 * {@linkcode Command} instance and defaults the stdin to `inherit`, stderr
 *  to `piped`, and stdout to `piped` if the options are not set.
 *
 * @param exe - The executable to run.
 * @param args - The arguments to pass to the executable.
 * @param options - The options for the command.
 * @returns A new `CommandType` instance.
 * @example
 * ```ts
 * import { cmd } from "@neotales/exec";
 *
 * // Create a command with an array
 * const output1 = await cmd(["git", "status"]).output();
 *
 * // Create a command with a string (auto-split)
 * const output2 = await cmd("git status").output();
 *
 * // Create with options
 * const output3 = await cmd(["ls", "-la"], { cwd: "/tmp" }).output();
 * ```
 */
export function cmd(args, options) {
    return new Command(args, options);
}
/**
 * Executes a command with the given arguments and options.  By default, the
 * command's stdout and stderr are set to `piped`, which returns the stdout and
 * stderr output of the command.
 * @param args - The command arguments to execute.
 * @param options - The options for the command.
 * @returns A promise that resolves to the output of the command.
 * @example
 * ```ts
 * import { exec } from "@neotales/exec";
 *
 * // Execute and get output directly
 * const output = await exec(["echo", "hello"]);
 * console.log(output.text()); // "hello\n"
 *
 * // Execute with a string command
 * const output2 = await exec("git config --list");
 * console.log(output2.lines());
 * ```
 */
export function exec(args, options) {
    return new Command(args, options).output();
}
/**
 * Executes a command synchronously with the given arguments and options.
 * @param args - The command arguments to execute.
 * @param options - The options for the command.
 * @returns The output of the command.
 * @example
 * ```ts
 * import { execSync } from "@neotales/exec";
 *
 * const output = execSync(["echo", "hello"]);
 * console.log(output.text()); // "hello\n"
 * console.log(output.code);   // 0
 * ```
 */
export function execSync(args, options) {
    return new Command(args, options).outputSync();
}
/**
 * Represents a pipe for executing commands and chaining them together.
 */
class Pipe {
    /**
     * Creates a new instance of the Pipe class.
     * @param process The initial ChildProcess to start the pipe with.
     * @param cmdFactory The factory function for creating Command instances.
     */
    constructor(process, cmdFactory) {
        Object.defineProperty(this, "process", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: process
        });
        Object.defineProperty(this, "cmdFactory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cmdFactory
        });
        _Pipe_promise.set(this, void 0);
        __classPrivateFieldSet(this, _Pipe_promise, Promise.resolve(process), "f");
    }
    pipe() {
        if (arguments.length === 0) {
            throw new Error("Invalid arguments");
        }
        if (typeof arguments[0] === "object" && "spawn" in arguments[0]) {
            const next = arguments[0];
            __classPrivateFieldSet(this, _Pipe_promise, __classPrivateFieldGet(this, _Pipe_promise, "f").then(async (process) => {
                let child = next;
                if (typeof next === "object" && "spawn" in next) {
                    if ("stdin" in next) {
                        next.stdin("piped");
                    }
                    if ("stdout" in next) {
                        next.stdout("piped");
                    }
                    if ("stderr" in next) {
                        next.stderr("null");
                    }
                    child = next.spawn();
                }
                try {
                    // force stdin to close
                    await process.stdout.pipeTo(child.stdin, { preventClose: false });
                    if (!process.stdout.locked) {
                        await process.stdout.cancel();
                    }
                    // if (process.stderr.)
                    //await process.stderr.cancel();
                }
                catch (error) {
                    const detail = error instanceof Error ? `${error.message} ${error.stack}` : String(error);
                    throw new CommandError({
                        message: `Pipe failed for ${process}: ${detail}`,
                        cause: error,
                    });
                }
                return child;
            }), "f");
            return this;
        }
        const args = arguments[0];
        const options = arguments[1];
        const next = this.cmdFactory(args, options);
        return this.pipe(next);
    }
    /**
     * Retrieves the output of the pipe as an Output instance.
     * @returns A Promise that resolves to the Output instance.
     */
    async output() {
        const process = await __classPrivateFieldGet(this, _Pipe_promise, "f");
        return process.output();
    }
}
_Pipe_promise = new WeakMap();
/**
 * Represents a factory for creating Pipe instances.
 */
class PipeFactory {
    constructor(cmdFactory) {
        Object.defineProperty(this, "cmdFactory", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: cmdFactory
        });
    }
    /**
     * Creates a new Pipe instance.
     * @param process The ChildProcess object to associate with the Pipe.
     * @returns A new Pipe instance.
     */
    create(process) {
        return new Pipe(process, this.cmdFactory);
    }
}
if (globals.Deno) {
    const EMPTY = "";
    class DenoChildProcess {
        constructor(childProcess, options, file) {
            _DenoChildProcess_childProcess.set(this, void 0);
            _DenoChildProcess_options.set(this, void 0);
            _DenoChildProcess_file.set(this, void 0);
            Object.defineProperty(this, "onDispose", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            __classPrivateFieldSet(this, _DenoChildProcess_childProcess, childProcess, "f");
            __classPrivateFieldSet(this, _DenoChildProcess_options, options, "f");
            __classPrivateFieldSet(this, _DenoChildProcess_file, file, "f");
        }
        get stdin() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").stdin;
        }
        get stdout() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").stdout;
        }
        get stderr() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").stderr;
        }
        get pid() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").pid;
        }
        get status() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").status;
        }
        ref() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").ref();
        }
        unref() {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").unref();
        }
        async output() {
            const out = await __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").output();
            return new DenoOutput({
                stdout: __classPrivateFieldGet(this, _DenoChildProcess_options, "f").stdout === "piped" ? out.stdout : new Uint8Array(0),
                stderr: __classPrivateFieldGet(this, _DenoChildProcess_options, "f").stderr === "piped" ? out.stderr : new Uint8Array(0),
                code: out.code,
                signal: out.signal,
                success: out.success,
            }, __classPrivateFieldGet(this, _DenoChildProcess_file, "f"));
        }
        kill(signo) {
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f").kill(signo);
        }
        [(_DenoChildProcess_childProcess = new WeakMap(), _DenoChildProcess_options = new WeakMap(), _DenoChildProcess_file = new WeakMap(), Symbol.asyncDispose)]() {
            if (this.onDispose) {
                this.onDispose();
            }
            return __classPrivateFieldGet(this, _DenoChildProcess_childProcess, "f")[Symbol.asyncDispose]();
        }
    }
    class DenoOutput {
        constructor(output, file) {
            _DenoOutput_text.set(this, void 0);
            _DenoOutput_lines.set(this, void 0);
            _DenoOutput_json.set(this, void 0);
            _DenoOutput_errorText.set(this, void 0);
            _DenoOutput_errorLines.set(this, void 0);
            _DenoOutput_errorJson.set(this, void 0);
            _DenoOutput_file.set(this, void 0);
            Object.defineProperty(this, "stdout", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "stderr", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "code", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "signal", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "success", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.stdout = output.stdout;
            this.stderr = output.stderr;
            this.code = output.code;
            this.signal = output.signal;
            this.success = output.success;
            __classPrivateFieldSet(this, _DenoOutput_file, file, "f");
        }
        validate(fn, failOnStderr) {
            fn ??= (code) => code === 0;
            if (!fn(this.code)) {
                throw new CommandError({ fileName: __classPrivateFieldGet(this, _DenoOutput_file, "f"), code: this.code });
            }
            if (failOnStderr && this.stderr.length > 0) {
                throw new CommandError({
                    fileName: __classPrivateFieldGet(this, _DenoOutput_file, "f"),
                    code: this.code,
                    message: `${__classPrivateFieldGet(this, _DenoOutput_file, "f")} failed with stderr: ${this.errorText()}`,
                });
            }
            return this;
        }
        text() {
            if (__classPrivateFieldGet(this, _DenoOutput_text, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_text, "f");
            }
            if (this.stdout.length === 0) {
                __classPrivateFieldSet(this, _DenoOutput_text, EMPTY, "f");
                return __classPrivateFieldGet(this, _DenoOutput_text, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_text, new TextDecoder().decode(this.stdout), "f");
            return __classPrivateFieldGet(this, _DenoOutput_text, "f");
        }
        lines() {
            if (__classPrivateFieldGet(this, _DenoOutput_lines, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_lines, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_lines, this.text().split(/\r?\n/), "f");
            return __classPrivateFieldGet(this, _DenoOutput_lines, "f");
        }
        json() {
            if (__classPrivateFieldGet(this, _DenoOutput_json, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_json, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_json, JSON.parse(this.text()), "f");
            return __classPrivateFieldGet(this, _DenoOutput_json, "f");
        }
        errorText() {
            if (__classPrivateFieldGet(this, _DenoOutput_errorText, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_errorText, "f");
            }
            if (this.stderr.length === 0) {
                __classPrivateFieldSet(this, _DenoOutput_errorText, EMPTY, "f");
                return __classPrivateFieldGet(this, _DenoOutput_errorText, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_errorText, new TextDecoder().decode(this.stderr), "f");
            return __classPrivateFieldGet(this, _DenoOutput_errorText, "f");
        }
        errorLines() {
            if (__classPrivateFieldGet(this, _DenoOutput_errorLines, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_errorLines, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_errorLines, this.errorText().split(/\r?\n/), "f");
            return __classPrivateFieldGet(this, _DenoOutput_errorLines, "f");
        }
        errorJson() {
            if (__classPrivateFieldGet(this, _DenoOutput_errorJson, "f")) {
                return __classPrivateFieldGet(this, _DenoOutput_errorJson, "f");
            }
            __classPrivateFieldSet(this, _DenoOutput_errorJson, JSON.parse(this.errorText()), "f");
            return __classPrivateFieldGet(this, _DenoOutput_errorJson, "f");
        }
        toString() {
            return this.text();
        }
    }
    _DenoOutput_text = new WeakMap(), _DenoOutput_lines = new WeakMap(), _DenoOutput_json = new WeakMap(), _DenoOutput_errorText = new WeakMap(), _DenoOutput_errorLines = new WeakMap(), _DenoOutput_errorJson = new WeakMap(), _DenoOutput_file = new WeakMap();
    Command.prototype.spawn = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : undefined;
        const options = {
            ...this.options,
            args: args,
        };
        if (this.options?.log) {
            this.options?.log(exe, args);
        }
        const process = new globals.Deno.Command(exe, options);
        return new DenoChildProcess(process.spawn(), options, this.file);
    };
    Command.prototype.outputSync = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : undefined;
        const options = {
            ...this.options,
            args: args,
        };
        options.stdout ??= "piped";
        options.stderr ??= "piped";
        options.stdin ??= "inherit";
        if (this.options?.log) {
            this.options?.log(exe, args);
        }
        const process = new globals.Deno.Command(exe, options);
        const out = process.outputSync();
        return new DenoOutput({
            stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
            stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
            code: out.code,
            signal: out.signal,
            success: out.success,
        }, this.file);
    };
    Command.prototype.output = async function () {
        const exe = await pathFinder.findExe(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : undefined;
        const options = {
            ...this.options,
            args: args,
            // deno-lint-ignore no-explicit-any
        };
        options.stdout ??= "piped";
        options.stderr ??= "piped";
        options.stdin ??= "inherit";
        if (this.options?.log) {
            this.options?.log(exe, args);
        }
        const process = new globals.Deno.Command(exe, options);
        const out = await process.output();
        return new DenoOutput({
            stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
            stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
            code: out.code,
            signal: out.signal,
            success: out.success,
        }, this.file);
    };
    ShellCommand.prototype.output = async function () {
        const exe = await pathFinder.findExe(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        try {
            const args = this.getShellArgs(isFile ? file : this.script, isFile);
            if (isFile && this.args) {
                const commandArgs = convertCommandArgs(this.args);
                args.push(...commandArgs);
            }
            const options = {
                ...this.options,
                args: args,
            };
            options.stdout ??= "piped";
            options.stderr ??= "piped";
            options.stdin ??= "inherit";
            if (this.options?.log) {
                this.options?.log(exe, args);
            }
            const process = new globals.Deno.Command(exe, options);
            const out = await process.output();
            return new DenoOutput({
                stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
                stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
                code: out.code,
                signal: out.signal,
                success: out.success,
            }, this.file);
        }
        finally {
            if (isFile && generated) {
                await rm(file);
            }
        }
    };
    ShellCommand.prototype.outputSync = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        try {
            const args = this.getShellArgs(isFile ? file : this.script, isFile);
            if (isFile && this.args) {
                const commandArgs = convertCommandArgs(this.args);
                args.push(...commandArgs);
            }
            const options = {
                ...this.options,
                args: args,
            };
            options.stdout ??= "piped";
            options.stderr ??= "piped";
            options.stdin ??= "inherit";
            if (this.options?.log) {
                this.options?.log(exe, args);
            }
            const process = new globals.Deno.Command(exe, options);
            const out = process.outputSync();
            return new DenoOutput({
                stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
                stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
                code: out.code,
                signal: out.signal,
                success: out.success,
            }, this.file);
        }
        finally {
            if (isFile && generated) {
                rmSync(file);
            }
        }
    };
    ShellCommand.prototype.spawn = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        const args = this.getShellArgs(isFile ? file : this.script, isFile);
        if (isFile && this.args) {
            const commandArgs = convertCommandArgs(this.args);
            args.push(...commandArgs);
        }
        const options = {
            ...this.options,
            args: args,
        };
        if (this.options?.log) {
            this.options?.log(exe, args);
        }
        const process = new globals.Deno.Command(exe, options);
        const proc = new DenoChildProcess(process.spawn(), options, this.file);
        proc.onDispose = () => {
            if (isFile && generated) {
                rmSync(file);
            }
        };
        return proc;
    };
}
else if (globals.process) {
    // TODO: Use Bun.spawn and Bun.spawnSync for the native Bun implementation.
    const child_process = loadChildProcess();
    const { spawn: nodeSpawn, spawnSync: nodeSpawnSync } = child_process;
    class NodeOutput {
        constructor(output) {
            _NodeOutput_text.set(this, void 0);
            _NodeOutput_lines.set(this, void 0);
            _NodeOutput_json.set(this, void 0);
            _NodeOutput_errorText.set(this, void 0);
            _NodeOutput_errorLines.set(this, void 0);
            _NodeOutput_errorJson.set(this, void 0);
            _NodeOutput_file.set(this, void 0);
            Object.defineProperty(this, "stdout", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "stderr", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "code", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "signal", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            Object.defineProperty(this, "success", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            this.stdout = output.stdout;
            this.stderr = output.stderr;
            this.code = output.code;
            this.signal = output.signal;
            this.success = output.success;
            __classPrivateFieldSet(this, _NodeOutput_file, output.file, "f");
        }
        validate(fn, failOnStderr) {
            fn ??= (code) => code === 0;
            if (!fn(this.code)) {
                throw new CommandError({
                    fileName: __classPrivateFieldGet(this, _NodeOutput_file, "f"),
                    code: this.code,
                });
            }
            if (failOnStderr && this.stderr.length > 0) {
                throw new CommandError({
                    fileName: __classPrivateFieldGet(this, _NodeOutput_file, "f"),
                    code: this.code,
                    message: `Command failed with stderr: ${this.errorText()}`,
                });
            }
            return this;
        }
        text() {
            if (__classPrivateFieldGet(this, _NodeOutput_text, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_text, "f");
            }
            if (this.stdout.length === 0) {
                __classPrivateFieldSet(this, _NodeOutput_text, "", "f");
                return __classPrivateFieldGet(this, _NodeOutput_text, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_text, new TextDecoder().decode(this.stdout), "f");
            return __classPrivateFieldGet(this, _NodeOutput_text, "f");
        }
        lines() {
            if (__classPrivateFieldGet(this, _NodeOutput_lines, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_lines, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_lines, this.text().split(/\r?\n/), "f");
            return __classPrivateFieldGet(this, _NodeOutput_lines, "f");
        }
        json() {
            if (__classPrivateFieldGet(this, _NodeOutput_json, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_json, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_json, JSON.parse(this.text()), "f");
            return __classPrivateFieldGet(this, _NodeOutput_json, "f");
        }
        errorText() {
            if (__classPrivateFieldGet(this, _NodeOutput_errorText, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_errorText, "f");
            }
            if (this.stderr.length === 0) {
                __classPrivateFieldSet(this, _NodeOutput_errorText, "", "f");
                return __classPrivateFieldGet(this, _NodeOutput_errorText, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_errorText, new TextDecoder().decode(this.stderr), "f");
            return __classPrivateFieldGet(this, _NodeOutput_errorText, "f");
        }
        errorLines() {
            if (__classPrivateFieldGet(this, _NodeOutput_errorLines, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_errorLines, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_errorLines, this.errorText().split(/\r?\n/), "f");
            return __classPrivateFieldGet(this, _NodeOutput_errorLines, "f");
        }
        errorJson() {
            if (__classPrivateFieldGet(this, _NodeOutput_errorJson, "f")) {
                return __classPrivateFieldGet(this, _NodeOutput_errorJson, "f");
            }
            __classPrivateFieldSet(this, _NodeOutput_errorJson, JSON.parse(this.errorText()), "f");
            return __classPrivateFieldGet(this, _NodeOutput_errorJson, "f");
        }
        toString() {
            return this.text();
        }
    }
    _NodeOutput_text = new WeakMap(), _NodeOutput_lines = new WeakMap(), _NodeOutput_json = new WeakMap(), _NodeOutput_errorText = new WeakMap(), _NodeOutput_errorLines = new WeakMap(), _NodeOutput_errorJson = new WeakMap(), _NodeOutput_file = new WeakMap();
    class NodeChildProcess {
        constructor(child, file, signal) {
            _NodeChildProcess_child.set(this, void 0);
            _NodeChildProcess_stdout.set(this, void 0);
            _NodeChildProcess_stderr.set(this, void 0);
            _NodeChildProcess_stdin.set(this, void 0);
            _NodeChildProcess_status.set(this, void 0);
            _NodeChildProcess_file.set(this, void 0);
            Object.defineProperty(this, "onDispose", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            });
            __classPrivateFieldSet(this, _NodeChildProcess_child, child, "f");
            __classPrivateFieldSet(this, _NodeChildProcess_file, file, "f");
            if (signal !== undefined) {
                signal.addEventListener("abort", () => {
                    child.kill("SIGTERM");
                });
            }
            __classPrivateFieldSet(this, _NodeChildProcess_status, new Promise((resolve, reject) => {
                child.on("error", (_err) => {
                    reject(_err);
                });
                child.on("exit", (code, exitSignal) => {
                    resolve({
                        success: code === 0,
                        code: code || 1,
                        signal: exitSignal,
                    });
                });
            }), "f");
        }
        get pid() {
            return __classPrivateFieldGet(this, _NodeChildProcess_child, "f").pid ? __classPrivateFieldGet(this, _NodeChildProcess_child, "f").pid : -1;
        }
        get status() {
            return __classPrivateFieldGet(this, _NodeChildProcess_status, "f");
        }
        get stdout() {
            if (__classPrivateFieldGet(this, _NodeChildProcess_stdout, "f")) {
                return __classPrivateFieldGet(this, _NodeChildProcess_stdout, "f");
            }
            const child = __classPrivateFieldGet(this, _NodeChildProcess_child, "f");
            if (child.stdout === null) {
                throw new Error("stdout is not available");
            }
            const stream = new ReadableStream({
                start(controller) {
                    if (child.stdout === null) {
                        controller.close();
                        return;
                    }
                    child.stdout.on("data", (data) => {
                        if (data instanceof Uint8Array) {
                            controller.enqueue(data);
                        }
                    });
                    child.stdout.on("end", () => {
                        controller.close();
                    });
                },
            });
            __classPrivateFieldSet(this, _NodeChildProcess_stdout, stream, "f");
            return stream;
        }
        get stderr() {
            if (__classPrivateFieldGet(this, _NodeChildProcess_stderr, "f")) {
                return __classPrivateFieldGet(this, _NodeChildProcess_stderr, "f");
            }
            const child = __classPrivateFieldGet(this, _NodeChildProcess_child, "f");
            if (child.stderr === null) {
                throw new Error("stderr is not available");
            }
            const stream = new ReadableStream({
                start(controller) {
                    if (child.stderr === null) {
                        controller.close();
                        return;
                    }
                    child.stderr.on("data", (data) => {
                        controller.enqueue(data);
                    });
                    child.stderr.on("end", () => {
                        controller.close();
                    });
                },
            });
            __classPrivateFieldSet(this, _NodeChildProcess_stderr, stream, "f");
            return stream;
        }
        get stdin() {
            if (__classPrivateFieldGet(this, _NodeChildProcess_stdin, "f")) {
                return __classPrivateFieldGet(this, _NodeChildProcess_stdin, "f");
            }
            const child = __classPrivateFieldGet(this, _NodeChildProcess_child, "f");
            if (child.stdin === null) {
                throw new Error("stdin is not available");
            }
            const stream = new WritableStream({
                write(chunk) {
                    child.stdin?.write(chunk);
                },
                close() {
                    child.stdin?.end();
                },
                abort() {
                    child.stdin?.end();
                },
            });
            __classPrivateFieldSet(this, _NodeChildProcess_stdin, stream, "f");
            return stream;
        }
        kill(signo) {
            if (signo === "SIGEMT") {
                signo = "SIGTERM";
            }
            __classPrivateFieldGet(this, _NodeChildProcess_child, "f").kill(signo);
        }
        ref() {
            __classPrivateFieldGet(this, _NodeChildProcess_child, "f").ref();
        }
        unref() {
            __classPrivateFieldGet(this, _NodeChildProcess_child, "f").unref();
        }
        output() {
            let stdout = new Uint8Array(0);
            let stderr = new Uint8Array(0);
            __classPrivateFieldGet(this, _NodeChildProcess_child, "f").stdout?.on("data", (data) => {
                stdout = new Uint8Array([...stdout, ...data]);
            });
            __classPrivateFieldGet(this, _NodeChildProcess_child, "f").stderr?.on("data", (data) => {
                stderr = new Uint8Array([...stderr, ...data]);
            });
            return new Promise((resolve, reject) => {
                __classPrivateFieldGet(this, _NodeChildProcess_child, "f").on("error", (err) => {
                    reject(err);
                });
                __classPrivateFieldGet(this, _NodeChildProcess_child, "f").on("exit", (code, signal) => {
                    const o = {
                        file: __classPrivateFieldGet(this, _NodeChildProcess_file, "f"),
                        stdout: stdout,
                        stderr: stderr,
                        code: code,
                        signal: signal,
                        success: code === 0,
                    };
                    resolve(new NodeOutput(o));
                });
            });
        }
        async [(_NodeChildProcess_child = new WeakMap(), _NodeChildProcess_stdout = new WeakMap(), _NodeChildProcess_stderr = new WeakMap(), _NodeChildProcess_stdin = new WeakMap(), _NodeChildProcess_status = new WeakMap(), _NodeChildProcess_file = new WeakMap(), Symbol.asyncDispose)]() {
            if (this.onDispose) {
                this.onDispose();
            }
            await this.status;
        }
    }
    // deno-lint-ignore no-inner-declarations
    function mapPipe(pipe) {
        if (pipe === undefined) {
            return undefined;
        }
        if (pipe === "inherit") {
            return "inherit";
        }
        if (pipe === "null") {
            return "ignore";
        }
        if (pipe === "piped") {
            return "pipe";
        }
        return undefined;
    }
    Command.prototype.output = async function () {
        const exe = await pathFinder.findExe(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : [];
        let signal;
        if (this.options?.signal) {
            signal = this.options.signal;
        }
        const o = this.options ?? {};
        o.stdin ??= "inherit";
        o.stdout ??= "piped";
        o.stderr ??= "piped";
        const child = nodeSpawn(exe, args, {
            cwd: o.cwd,
            env: o.env,
            gid: o.gid,
            uid: o.uid,
            stdio: [mapPipe(o.stdin), mapPipe(o.stdout), mapPipe(o.stderr)],
            windowsVerbatimArguments: o.windowsRawArguments,
            // deno-lint-ignore no-explicit-any
            signal: signal,
        });
        if (this.options?.log) {
            this.options.log(exe, args);
        }
        let stdout = new Uint8Array(0);
        let stderr = new Uint8Array(0);
        let code = 1;
        let sig;
        const promises = [];
        if (child.stdout !== null) {
            child.stdout.on("data", (data) => {
                stdout = new Uint8Array([...stdout, ...data]);
            });
        }
        if (child.stderr !== null) {
            child.stderr.on("data", (data) => {
                stderr = new Uint8Array([...stderr, ...data]);
            });
        }
        promises.push(new Promise((resolve) => {
            if (child.stdout === null) {
                resolve();
                return;
            }
            child.stdout.on("end", () => {
                resolve();
            });
        }));
        promises.push(new Promise((resolve) => {
            if (child.stderr === null) {
                resolve();
                return;
            }
            child.stderr.on("end", () => {
                resolve();
            });
        }));
        promises.push(new Promise((resolve) => {
            child.on("exit", (c, s) => {
                code = c !== null ? c : 0;
                sig = s === null ? undefined : s;
                resolve();
            });
        }));
        await Promise.all(promises);
        return new NodeOutput({
            file: this.file,
            stdout: stdout,
            stderr: stderr,
            code: code,
            signal: sig,
            success: code === 0,
        });
    };
    Command.prototype.outputSync = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : [];
        const o = {
            ...this.options,
        };
        o.stdin ??= "inherit";
        o.stdout ??= "piped";
        o.stderr ??= "piped";
        if (this.options?.log) {
            this.options.log(exe, args);
        }
        const child = nodeSpawnSync(exe, args, {
            cwd: o.cwd,
            env: o.env,
            gid: o.gid,
            uid: o.uid,
            stdio: [mapPipe(o.stdin), mapPipe(o.stdout), mapPipe(o.stderr)],
            windowsVerbatimArguments: o.windowsRawArguments,
        });
        const code = child.status ? child.status : 0;
        return new NodeOutput({
            file: this.file,
            stdout: new Uint8Array(child.stdout ?? []),
            stderr: new Uint8Array(child.stderr ?? []),
            code: code,
            signal: child.signal,
            success: code === 0,
        });
    };
    Command.prototype.spawn = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const args = this.args ? convertCommandArgs(this.args) : [];
        const o = {
            ...this.options,
        };
        o.stdout ??= "inherit";
        o.stderr ??= "inherit";
        o.stdin ??= "inherit";
        const stdin = mapPipe(o.stdin);
        const stdout = mapPipe(o.stdout);
        const stderr = mapPipe(o.stderr);
        if (this.options?.log) {
            this.options.log(exe, args);
        }
        const child = nodeSpawn(exe, args, {
            cwd: o.cwd,
            env: o.env,
            gid: o.gid,
            uid: o.uid,
            stdio: [stdin, stdout, stderr],
            windowsVerbatimArguments: o.windowsRawArguments,
        });
        return new NodeChildProcess(child, this.file, o.signal);
    };
    ShellCommand.prototype.output = async function () {
        const exe = await pathFinder.findExe(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        try {
            const args = this.getShellArgs(isFile ? file : this.script, isFile);
            if (isFile && this.args) {
                const commandArgs = convertCommandArgs(this.args);
                args.push(...commandArgs);
            }
            let signal;
            if (this.options?.signal) {
                signal = this.options.signal;
            }
            const o = this.options ?? {};
            o.stdin ??= "inherit";
            o.stdout ??= "piped";
            o.stderr ??= "piped";
            if (this.options?.log) {
                this.options.log(exe, args);
            }
            const child = nodeSpawn(exe, args, {
                cwd: o.cwd,
                env: o.env,
                gid: o.gid,
                uid: o.uid,
                stdio: [mapPipe(o.stdin), mapPipe(o.stdout), mapPipe(o.stderr)],
                windowsVerbatimArguments: o.windowsRawArguments,
                // deno-lint-ignore no-explicit-any
                signal: signal,
            });
            let stdout = new Uint8Array(0);
            let stderr = new Uint8Array(0);
            let code = 1;
            let sig;
            const promises = [];
            if (child.stdout !== null) {
                child.stdout.on("data", (data) => {
                    stdout = new Uint8Array([...stdout, ...data]);
                });
            }
            if (child.stderr !== null) {
                child.stderr.on("data", (data) => {
                    stderr = new Uint8Array([...stderr, ...data]);
                });
            }
            promises.push(new Promise((resolve) => {
                if (child.stdout === null) {
                    resolve();
                    return;
                }
                child.stdout.on("end", () => {
                    resolve();
                });
            }));
            promises.push(new Promise((resolve) => {
                if (child.stderr === null) {
                    resolve();
                    return;
                }
                child.stderr.on("end", () => {
                    resolve();
                });
            }));
            promises.push(new Promise((resolve) => {
                child.on("exit", (c, s) => {
                    code = c !== null ? c : 1;
                    sig = s === null ? undefined : s;
                    resolve();
                });
            }));
            await Promise.all(promises);
            return new NodeOutput({
                file: exe,
                stdout: stdout,
                stderr: stderr,
                code: code,
                signal: sig,
                success: code === 0,
            });
        }
        finally {
            if (isFile && generated) {
                await rm(file);
            }
        }
    };
    ShellCommand.prototype.outputSync = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        try {
            const args = this.getShellArgs(isFile ? file : this.script, isFile);
            if (isFile && this.args) {
                const commandArgs = convertCommandArgs(this.args);
                args.push(...commandArgs);
            }
            const o = {
                ...this.options,
            };
            o.stdin ??= "inherit";
            o.stdout ??= "piped";
            o.stderr ??= "piped";
            if (this.options?.log) {
                this.options.log(exe, args);
            }
            const child = nodeSpawnSync(exe, args, {
                cwd: o.cwd,
                env: o.env,
                gid: o.gid,
                uid: o.uid,
                stdio: [mapPipe(o.stdin), mapPipe(o.stdout), mapPipe(o.stderr)],
                windowsVerbatimArguments: o.windowsRawArguments,
            });
            const code = child.status ? child.status : 1;
            return new NodeOutput({
                file: exe,
                stdout: new Uint8Array(child.stdout ?? []),
                stderr: new Uint8Array(child.stderr ?? []),
                code: child.status ? child.status : 1,
                signal: child.signal,
                success: code === 0,
            });
        }
        finally {
            if (isFile && generated) {
                rmSync(file);
            }
        }
    };
    ShellCommand.prototype.spawn = function () {
        const exe = pathFinder.findExeSync(this.file);
        if (exe === undefined) {
            throw new NotFoundOnPathError(this.file);
        }
        const { file, generated } = this.getScriptFile();
        const isFile = file !== undefined;
        const args = this.getShellArgs(isFile ? file : this.script, isFile);
        if (isFile && this.args) {
            const commandArgs = convertCommandArgs(this.args);
            args.push(...commandArgs);
        }
        const o = {
            ...this.options,
        };
        o.stdout ??= "inherit";
        o.stderr ??= "inherit";
        o.stdin ??= "inherit";
        const stdin = mapPipe(o.stdin);
        const stdout = mapPipe(o.stdout);
        const stderr = mapPipe(o.stderr);
        if (this.options?.log) {
            this.options.log(exe, args);
        }
        const child = nodeSpawn(exe, args, {
            cwd: o.cwd,
            env: o.env,
            gid: o.gid,
            uid: o.uid,
            stdio: [stdin, stdout, stderr],
            windowsVerbatimArguments: o.windowsRawArguments,
        });
        const proc = new NodeChildProcess(child, this.file, o.signal);
        proc.onDispose = () => {
            if (isFile && generated) {
                rmSync(file);
            }
        };
        return proc;
    };
}
/**
 * Run a command and return the output. This is a shorthand for creating a new
 * {@linkcode Command} and calling {@linkcode Command.output} with stdout and
 * stderr set to `inherit`.
 * @param exe The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to run the command with.
 * @returns The output of the command.
 * @example
 * ```ts
 * import { run } from "@neotales/exec";
 *
 * // Run a command with inherited stdout/stderr (visible in terminal)
 * const output = await run(["npm", "install"]);
 * console.log(output.code); // 0 if successful
 * ```
 */
export function run(args, options) {
    const o = (options || {});
    o.stderr = "inherit";
    o.stdout = "inherit";
    return new Command(args, o).output();
}
/**
 * Run a command and return the output synchronously. This is a shorthand for
 * creating a new {@linkcode Command} and calling {@linkcode Command.outputSync}
 * with stdout and stderr set to `inherit`.
 * @param exe The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to run the command with.
 * @returns The output of the command.
 * @example
 * ```ts
 * import { runSync } from "@neotales/exec";
 *
 * // Run synchronously with inherited stdout/stderr
 * const output = runSync(["echo", "hello"]);
 * console.log(output.code); // 0
 * ```
 */
export function runSync(args, options) {
    const o = (options || {});
    o.stderr = "inherit";
    o.stdout = "inherit";
    return new Command(args, o).outputSync();
}
/**
 * Spawn a command and return the process. This is a shorthand for creating a new
 * {@linkcode Command} and calling {@linkcode Command.spawn} with stdin, stderr,
 * and stdout defaulting to `inherit` if not set in the options.
 * @param exe The executable to run.
 * @param args The arguments to pass to the executable.
 * @param options The options to run the command with.
 * @returns The process of the command.
 * @example
 * ```ts
 * import { spawn } from "@neotales/exec";
 *
 * // Spawn a long-running process
 * await using process = spawn(["node", "server.js"]);
 * console.log("Server started with PID:", process.pid);
 *
 * // Wait for process to complete
 * const output = await process.output();
 * console.log(output.code);
 * ```
 */
export function spawn(args, options) {
    options ??= {};
    options.stdin ??= "inherit";
    options.stderr ??= "inherit";
    options.stdout ??= "inherit";
    return new Command(args, options).spawn();
}
