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
import type { ChildProcess, CommandArgs, CommandOptions, Output, ShellCommandOptions } from "./types.js";
export type { ChildProcess, CommandArgs, CommandOptions, Output, ShellCommandOptions };
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
export declare function convertCommandArgs(args?: CommandArgs): string[];
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
export declare class Command {
    #private;
    protected file: string;
    protected args?: CommandArgs;
    protected options?: CommandOptions;
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
    constructor(args?: CommandArgs, options?: CommandOptions);
    [key: string]: unknown;
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
    toArgs(): string[];
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
    toOptions(): CommandOptions;
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
    withFile(value: string): this;
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
    withCwd(value: string | URL): this;
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
    withEnv(value: Record<string, string>): this;
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
    withUid(value: number): this;
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
    withGid(value: number): this;
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
    withSignal(value: AbortSignal): this;
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
    withArgs(value: CommandArgs, includesFile?: boolean): this;
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
    withStdin(value: "inherit" | "piped" | "null" | undefined): this;
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
    withStdout(value: "inherit" | "piped" | "null" | undefined): this;
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
    withStderr(value: "inherit" | "piped" | "null" | undefined): this;
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
    then<TValue = Output, TError = Error | never>(onfulfilled?: ((value: Output) => TValue | PromiseLike<TValue>) | null | undefined, onrejected?: ((reason: any) => TError | PromiseLike<TError>) | null | undefined): PromiseLike<TValue | TError>;
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
    run(): Promise<Output>;
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
    runSync(): Output;
    /**
     * Pipes the output of the command to another command or child process.
     * @param name The name of the command to pipe to.
     * @param args The arguments for the command.
     * @param options The options for the command.
     * @returns A Pipe instance that represents the piped output.
     * @example
     * ```ts
     * import { cmd } from "@neotales/exec";
     *
     * // Chain multiple commands together using pipe
     * const result = await cmd(["echo", "hello world"])
     *   .pipe(["grep", "hello"])
     *   .pipe("cat")
     *   .output();
     * console.log(result.text()); // "hello world\n"
     * ```
     */
    pipe(args?: CommandArgs, options?: CommandOptions): Pipe;
    pipe(command: Command | ChildProcess): Pipe;
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
    text(): Promise<string>;
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
    lines(): Promise<string[]>;
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
    json(): Promise<unknown>;
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
    output(): Promise<Output>;
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
    outputSync(): Output;
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
    spawn(): ChildProcess;
}
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
export declare class ShellCommand extends Command {
    protected shellArgs?: string[];
    protected script: string;
    protected isFile?: boolean;
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
    constructor(exe: string, script: string, options?: ShellCommandOptions);
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
    get ext(): string;
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
    toArgs(): string[];
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
    getShellArgs(script: string, _isFile: boolean): string[];
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
    getScriptFile(): {
        file: string | undefined;
        generated: boolean;
    };
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
export declare function cmd(args?: CommandArgs, options?: CommandOptions): Command;
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
export declare function exec(args: CommandArgs, options?: CommandOptions): Promise<Output>;
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
export declare function execSync(args: CommandArgs, options?: CommandOptions): Output;
/**
 * Represents a factory function that creates a command.
 * @param file - The file to execute.
 * @param args - Optional arguments for the command.
 * @param options - Optional options for the command.
 * @returns A command instance.
 */
export interface CommandFactory {
    (args?: CommandArgs, options?: CommandOptions): Command;
}
/**
 * Represents a pipe for executing commands and chaining them together.
 */
declare class Pipe {
    #private;
    private readonly process;
    private readonly cmdFactory;
    /**
     * Creates a new instance of the Pipe class.
     * @param process The initial ChildProcess to start the pipe with.
     * @param cmdFactory The factory function for creating Command instances.
     */
    constructor(process: ChildProcess, cmdFactory: CommandFactory);
    [key: string]: unknown;
    /**
     * Chains a command to the pipe.
     * @param name The name of the command to execute.
     * @param args The arguments to pass to the command.
     * @param options The options to configure the command.
     * @returns The updated Pipe instance.
     */
    pipe(args?: CommandArgs, options?: CommandOptions): Pipe;
    /**
     * Chains a ChildProcess, Command, or Output instance to the pipe.
     * @param next The next ChildProcess, Command, or Output instance to chain.
     * @returns The updated Pipe instance.
     */
    pipe(next: ChildProcess | Command | Output): Pipe;
    /**
     * Retrieves the output of the pipe as an Output instance.
     * @returns A Promise that resolves to the Output instance.
     */
    output(): Promise<Output>;
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
export declare function run(args?: CommandArgs, options?: Omit<CommandOptions, "stderr" | "stdout">): Promise<Output>;
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
export declare function runSync(args?: CommandArgs, options?: Omit<CommandOptions, "stderr" | "stdout">): Output;
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
export declare function spawn(args?: CommandArgs, options?: CommandOptions): ChildProcess;
