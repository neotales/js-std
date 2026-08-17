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

// @ts-nocheck TS2455
import { CommandError, NotFoundOnPathError } from "./errors.ts";
import { globals, loadChildProcess } from "./globals.ts";
import { pathFinder } from "./path_finder.ts";
import { getLogger } from "./set_logger.ts";
import { splat } from "@neotales/args/splat";
import { split } from "@neotales/args/split";
import { rm, rmSync } from "@neotales/fs/rm";
import type {
  ChildProcess,
  CommandArgs,
  CommandOptions,
  CommandStatus,
  Output,
  ShellCommandOptions,
  Signal,
} from "./types.ts";
import type { ChildProcess as Node2ChildProcess, IOType } from "node:child_process";

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
export function convertCommandArgs(args?: CommandArgs): string[] {
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
  protected file: string;
  protected args?: CommandArgs;
  protected options?: CommandOptions;

  static #pipeFactory?: PipeFactory;

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
  constructor(args?: CommandArgs, options?: CommandOptions) {
    options ??= {};
    if (args === undefined || args === null) {
      this.file = "";
      this.args = [];
    } else if (typeof args === "string" && !args.includes(" ")) {
      this.file = args;
      this.args = [];
    } else if (Array.isArray(args)) {
      this.file = args[0];
      this.args = args.length > 0 ? args.slice(1) : [];
    } else {
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
  toArgs(): string[] {
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
  toOptions(): CommandOptions {
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
  withFile(value: string): this {
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
  withCwd(value: string | URL): this {
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
  withEnv(value: Record<string, string>): this {
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
  withUid(value: number): this {
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
  withGid(value: number): this {
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
  withSignal(value: AbortSignal): this {
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
  withArgs(value: CommandArgs, includesFile = false): this {
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
  withStdin(value: "inherit" | "piped" | "null" | undefined): this {
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
  withStdout(value: "inherit" | "piped" | "null" | undefined): this {
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
  withStderr(value: "inherit" | "piped" | "null" | undefined): this {
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
  then<TValue = Output, TError = Error | never>(
    onfulfilled?: ((value: Output) => TValue | PromiseLike<TValue>) | null | undefined,
    // deno-lint-ignore no-explicit-any
    onrejected?: ((reason: any) => TError | PromiseLike<TError>) | null | undefined,
  ): PromiseLike<TValue | TError> {
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
  async run(): Promise<Output> {
    this.options ??= {};
    const { stdout, stderr } = this.options;
    try {
      this.options.stdout = "inherit";
      this.options.stderr = "inherit";
      return await this.output();
    } finally {
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
  runSync(): Output {
    this.options ??= {};
    const { stdout, stderr } = this.options;
    try {
      this.options.stdout = "inherit";
      this.options.stderr = "inherit";
      return this.outputSync();
    } finally {
      this.options.stdout = stdout;
      this.options.stderr = stderr;
    }
  }

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
  pipe(): Pipe {
    this.options ??= {};
    this.options.stdout = "piped";
    this.options.stderr = "inherit";

    if (arguments.length === 0) {
      throw new Error("Invalid arguments");
    }

    let next: ChildProcess | Command;

    if (typeof arguments[0] === "object" && "spawn" in arguments[0]) {
      next = arguments[0];
    } else {
      const args = arguments[0] as CommandArgs;
      const options = arguments[1] as CommandOptions;
      const ctor = Object.getPrototypeOf(this).constructor;
      next = new ctor(args, options) as Command;
      next.withStdout("piped");
      next.withStdin("piped");
      next.withStderr("null");
    }

    Command.#pipeFactory ??= new PipeFactory((args, options) => {
      const ctor = Object.getPrototypeOf(this).constructor;
      next = new ctor(args, options) as Command;
      next.withStdin("piped");
      next.withStdout("piped");
      next.withStderr("null");
      return next;
    });
    return Command.#pipeFactory.create(this.spawn()).pipe(next);
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
  async text(): Promise<string> {
    this.options ??= {};
    const { stdout } = this.options;
    try {
      this.options.stdout = "piped";
      const output = await this.output();
      return output.text();
    } finally {
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
  async lines(): Promise<string[]> {
    this.options ??= {};
    const { stdout } = this.options;
    try {
      this.options.stdout = "piped";
      const output = await this.output();
      return output.lines();
    } finally {
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
  async json(): Promise<unknown> {
    this.options ??= {};
    const { stdout } = this.options;
    try {
      this.options.stdout = "piped";
      const output = await this.output();
      return output.json();
    } finally {
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
  output(): Promise<Output> {
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
  outputSync(): Output {
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
  spawn(): ChildProcess {
    throw new Error("Not implemented");
  }
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
export class ShellCommand extends Command {
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
  constructor(exe: string, script: string, options?: ShellCommandOptions) {
    super(undefined, options);
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
  get ext(): string {
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
  override toArgs(): string[] {
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
  getShellArgs(script: string, _isFile: boolean): string[] {
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
  getScriptFile(): { file: string | undefined; generated: boolean } {
    if (
      this.isFile ||
      (!this.script.match(/\n/) && this.ext.length && this.script.trimEnd().endsWith(this.ext))
    ) {
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
export function cmd(args?: CommandArgs, options?: CommandOptions): Command {
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
export function exec(args: CommandArgs, options?: CommandOptions): Promise<Output> {
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
export function execSync(args: CommandArgs, options?: CommandOptions): Output {
  return new Command(args, options).outputSync();
}

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
class Pipe {
  #promise: Promise<ChildProcess>;

  /**
   * Creates a new instance of the Pipe class.
   * @param process The initial ChildProcess to start the pipe with.
   * @param cmdFactory The factory function for creating Command instances.
   */
  constructor(
    private readonly process: ChildProcess,
    private readonly cmdFactory: CommandFactory,
  ) {
    this.#promise = Promise.resolve(process);
  }

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
  pipe(): Pipe {
    if (arguments.length === 0) {
      throw new Error("Invalid arguments");
    }

    if (typeof arguments[0] === "object" && "spawn" in arguments[0]) {
      const next = arguments[0];

      this.#promise = this.#promise.then(async (process) => {
        let child = next as ChildProcess;
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
        } catch (error) {
          const detail = error instanceof Error ? `${error.message} ${error.stack}` : String(error);
          throw new CommandError({
            message: `Pipe failed for ${process}: ${detail}`,
            cause: error,
          });
        }

        return child;
      });
      return this;
    }

    const args = arguments[0] as CommandArgs;
    const options = arguments[1] as CommandOptions;
    const next = this.cmdFactory(args, options);
    return this.pipe(next);
  }

  /**
   * Retrieves the output of the pipe as an Output instance.
   * @returns A Promise that resolves to the Output instance.
   */
  async output(): Promise<Output> {
    const process = await this.#promise;
    return process.output();
  }
}

/**
 * Represents a factory for creating Pipe instances.
 */
class PipeFactory {
  constructor(private readonly cmdFactory: CommandFactory) {}

  /**
   * Creates a new Pipe instance.
   * @param process The ChildProcess object to associate with the Pipe.
   * @returns A new Pipe instance.
   */
  create(process: ChildProcess): Pipe {
    return new Pipe(process, this.cmdFactory);
  }
}

if (globals.Deno) {
  const EMPTY = "";

  class DenoChildProcess implements ChildProcess {
    #childProcess: any;
    #options: CommandOptions;
    #file: string;

    constructor(childProcess: any, options: CommandOptions, file: string) {
      this.#childProcess = childProcess;
      this.#options = options;
      this.#file = file;
    }

    get stdin(): WritableStream<Uint8Array> {
      return this.#childProcess.stdin;
    }

    get stdout(): ReadableStream<Uint8Array> {
      return this.#childProcess.stdout;
    }

    get stderr(): ReadableStream<Uint8Array> {
      return this.#childProcess.stderr;
    }

    get pid(): number {
      return this.#childProcess.pid;
    }

    get status(): Promise<CommandStatus> {
      return this.#childProcess.status;
    }

    ref(): void {
      return this.#childProcess.ref();
    }

    unref(): void {
      return this.#childProcess.unref();
    }

    async output(): Promise<Output> {
      const out = await this.#childProcess.output();

      return new DenoOutput(
        {
          stdout: this.#options.stdout === "piped" ? out.stdout : new Uint8Array(0),
          stderr: this.#options.stderr === "piped" ? out.stderr : new Uint8Array(0),
          code: out.code,
          signal: out.signal,
          success: out.success,
        },
        this.#file,
      );
    }

    kill(signo?: Signal): void {
      return this.#childProcess.kill(signo);
    }

    onDispose: (() => void) | undefined;

    [Symbol.asyncDispose](): Promise<void> {
      if (this.onDispose) {
        this.onDispose();
      }

      return this.#childProcess[Symbol.asyncDispose]();
    }
  }

  class DenoOutput implements Output {
    #text?: string;
    #lines?: string[];
    #json?: unknown;
    #errorText?: string;
    #errorLines?: string[];
    #errorJson?: unknown;
    #file: string;
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
    readonly code: number;
    readonly signal?: string | undefined;
    readonly success: boolean;

    constructor(output: any, file: string) {
      this.stdout = output.stdout;
      this.stderr = output.stderr;
      this.code = output.code;
      this.signal = output.signal as string;
      this.success = output.success;
      this.#file = file;
    }

    validate(fn?: ((code: number) => boolean) | undefined, failOnStderr?: true | undefined): this {
      fn ??= (code: number) => code === 0;
      if (!fn(this.code)) {
        throw new CommandError({ fileName: this.#file, code: this.code });
      }

      if (failOnStderr && this.stderr.length > 0) {
        throw new CommandError({
          fileName: this.#file,
          code: this.code,
          message: `${this.#file} failed with stderr: ${this.errorText()}`,
        });
      }

      return this;
    }

    text(): string {
      if (this.#text) {
        return this.#text;
      }

      if (this.stdout.length === 0) {
        this.#text = EMPTY;
        return this.#text;
      }

      this.#text = new TextDecoder().decode(this.stdout);
      return this.#text;
    }

    lines(): string[] {
      if (this.#lines) {
        return this.#lines;
      }

      this.#lines = this.text().split(/\r?\n/);
      return this.#lines;
    }

    json(): unknown {
      if (this.#json) {
        return this.#json;
      }

      this.#json = JSON.parse(this.text());
      return this.#json;
    }
    errorText(): string {
      if (this.#errorText) {
        return this.#errorText;
      }

      if (this.stderr.length === 0) {
        this.#errorText = EMPTY;
        return this.#errorText;
      }

      this.#errorText = new TextDecoder().decode(this.stderr);
      return this.#errorText;
    }

    errorLines(): string[] {
      if (this.#errorLines) {
        return this.#errorLines;
      }

      this.#errorLines = this.errorText().split(/\r?\n/);
      return this.#errorLines;
    }

    errorJson(): unknown {
      if (this.#errorJson) {
        return this.#errorJson;
      }

      this.#errorJson = JSON.parse(this.errorText());
      return this.#errorJson;
    }

    toString(): string {
      return this.text();
    }
  }

  Command.prototype.spawn = function (): ChildProcess {
    const exe = pathFinder.findExeSync(this.file);
    if (exe === undefined) {
      throw new NotFoundOnPathError(this.file);
    }
    const args = this.args ? convertCommandArgs(this.args) : undefined;
    const options = {
      ...this.options,
      args: args,
    } as any;

    if (this.options?.log) {
      this.options?.log(exe, args);
    }

    const process = new globals.Deno.Command(exe, options);
    return new DenoChildProcess(process.spawn(), options, this.file);
  };

  Command.prototype.outputSync = function (): Output {
    const exe = pathFinder.findExeSync(this.file);
    if (exe === undefined) {
      throw new NotFoundOnPathError(this.file);
    }

    const args = this.args ? convertCommandArgs(this.args) : undefined;
    const options = {
      ...this.options,
      args: args,
    } as any;

    options.stdout ??= "piped";
    options.stderr ??= "piped";
    options.stdin ??= "inherit";
    if (this.options?.log) {
      this.options?.log(exe, args);
    }

    const process = new globals.Deno.Command(exe, options);
    const out = process.outputSync();

    return new DenoOutput(
      {
        stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
        stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
        code: out.code,
        signal: out.signal,
        success: out.success,
      },
      this.file,
    );
  };
  Command.prototype.output = async function (): Promise<Output> {
    const exe = await pathFinder.findExe(this.file);
    if (exe === undefined) {
      throw new NotFoundOnPathError(this.file);
    }
    const args = this.args ? convertCommandArgs(this.args) : undefined;
    const options = {
      ...this.options,
      args: args,
      // deno-lint-ignore no-explicit-any
    } as any;

    options.stdout ??= "piped";
    options.stderr ??= "piped";
    options.stdin ??= "inherit";

    if (this.options?.log) {
      this.options?.log(exe, args);
    }

    const process = new globals.Deno.Command(exe, options);
    const out = await process.output();

    return new DenoOutput(
      {
        stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
        stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
        code: out.code,
        signal: out.signal,
        success: out.success,
      },
      this.file,
    );
  };

  ShellCommand.prototype.output = async function (): Promise<Output> {
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
      } as any;

      options.stdout ??= "piped";
      options.stderr ??= "piped";
      options.stdin ??= "inherit";
      if (this.options?.log) {
        this.options?.log(exe, args);
      }

      const process = new globals.Deno.Command(exe, options);
      const out = await process.output();

      return new DenoOutput(
        {
          stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
          stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
          code: out.code,
          signal: out.signal,
          success: out.success,
        },
        this.file,
      );
    } finally {
      if (isFile && generated) {
        await rm(file);
      }
    }
  };

  ShellCommand.prototype.outputSync = function (): Output {
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

      return new DenoOutput(
        {
          stdout: options.stdout === "piped" ? out.stdout : new Uint8Array(0),
          stderr: options.stderr === "piped" ? out.stderr : new Uint8Array(0),
          code: out.code,
          signal: out.signal,
          success: out.success,
        },
        this.file,
      );
    } finally {
      if (isFile && generated) {
        rmSync(file);
      }
    }
  };

  ShellCommand.prototype.spawn = function (): ChildProcess {
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
    } as any;

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
} else if (globals.process) {
  // TODO: Use Bun.spawn and Bun.spawnSync for the native Bun implementation.
  const child_process = loadChildProcess();
  const { spawn: nodeSpawn, spawnSync: nodeSpawnSync } = child_process!;

  interface NodeCommonOutput {
    file: string;
    args?: string[];
    stdout: Uint8Array;
    stderr: Uint8Array;
    code: number;
    signal?: string;
    success: boolean;
  }

  class NodeOutput implements Output {
    #text?: string;
    #lines?: string[];
    #json?: unknown;
    #errorText?: string;
    #errorLines?: string[];
    #errorJson?: unknown;
    #file: string;
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
    readonly code: number;
    readonly signal?: string | undefined;
    readonly success: boolean;

    constructor(output: NodeCommonOutput) {
      this.stdout = output.stdout;
      this.stderr = output.stderr;
      this.code = output.code;
      this.signal = output.signal as string;
      this.success = output.success;
      this.#file = output.file;
    }

    validate(fn?: ((code: number) => boolean) | undefined, failOnStderr?: true | undefined): this {
      fn ??= (code: number) => code === 0;

      if (!fn(this.code)) {
        throw new CommandError({
          fileName: this.#file,
          code: this.code,
        });
      }

      if (failOnStderr && this.stderr.length > 0) {
        throw new CommandError({
          fileName: this.#file,
          code: this.code,
          message: `Command failed with stderr: ${this.errorText()}`,
        });
      }

      return this;
    }

    text(): string {
      if (this.#text) {
        return this.#text;
      }

      if (this.stdout.length === 0) {
        this.#text = "";
        return this.#text;
      }

      this.#text = new TextDecoder().decode(this.stdout);
      return this.#text;
    }

    lines(): string[] {
      if (this.#lines) {
        return this.#lines;
      }

      this.#lines = this.text().split(/\r?\n/);
      return this.#lines;
    }

    json(): unknown {
      if (this.#json) {
        return this.#json;
      }

      this.#json = JSON.parse(this.text());
      return this.#json;
    }
    errorText(): string {
      if (this.#errorText) {
        return this.#errorText;
      }

      if (this.stderr.length === 0) {
        this.#errorText = "";
        return this.#errorText;
      }

      this.#errorText = new TextDecoder().decode(this.stderr);
      return this.#errorText;
    }

    errorLines(): string[] {
      if (this.#errorLines) {
        return this.#errorLines;
      }

      this.#errorLines = this.errorText().split(/\r?\n/);
      return this.#errorLines;
    }

    errorJson(): unknown {
      if (this.#errorJson) {
        return this.#errorJson;
      }

      this.#errorJson = JSON.parse(this.errorText());
      return this.#errorJson;
    }

    toString(): string {
      return this.text();
    }
  }

  class NodeChildProcess implements ChildProcess {
    readonly #child: Node2ChildProcess;
    #stdout?: ReadableStream<Uint8Array>;
    #stderr?: ReadableStream<Uint8Array>;
    #stdin?: WritableStream<Uint8Array>;
    #status: Promise<CommandStatus>;
    #file: string;

    constructor(child: Node2ChildProcess, file: string, signal?: AbortSignal) {
      this.#child = child;
      this.#file = file;

      if (signal !== undefined) {
        signal.addEventListener("abort", () => {
          child.kill("SIGTERM");
        });
      }

      this.#status = new Promise<CommandStatus>((resolve, reject) => {
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
      });
    }

    get pid(): number {
      return this.#child.pid ? this.#child.pid : -1;
    }

    get status(): Promise<CommandStatus> {
      return this.#status;
    }

    get stdout(): ReadableStream<Uint8Array> {
      if (this.#stdout) {
        return this.#stdout;
      }

      const child = this.#child;
      if (child.stdout === null) {
        throw new Error("stdout is not available");
      }

      const stream = new ReadableStream<Uint8Array>({
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

      this.#stdout = stream;
      return stream;
    }

    get stderr(): ReadableStream<Uint8Array> {
      if (this.#stderr) {
        return this.#stderr;
      }

      const child = this.#child;
      if (child.stderr === null) {
        throw new Error("stderr is not available");
      }

      const stream = new ReadableStream<Uint8Array>({
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

      this.#stderr = stream;
      return stream;
    }

    get stdin(): WritableStream<Uint8Array> {
      if (this.#stdin) {
        return this.#stdin;
      }

      const child = this.#child;
      if (child.stdin === null) {
        throw new Error("stdin is not available");
      }

      const stream = new WritableStream<Uint8Array>({
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

      this.#stdin = stream;
      return stream;
    }

    kill(signo?: Signal | undefined): void {
      if (signo === "SIGEMT") {
        signo = "SIGTERM";
      }

      this.#child.kill(signo);
    }

    ref(): void {
      this.#child.ref();
    }

    unref(): void {
      this.#child.unref();
    }

    output(): Promise<Output> {
      let stdout = new Uint8Array(0);
      let stderr = new Uint8Array(0);

      this.#child.stdout?.on("data", (data) => {
        stdout = new Uint8Array([...stdout, ...data]);
      });

      this.#child.stderr?.on("data", (data) => {
        stderr = new Uint8Array([...stderr, ...data]);
      });

      return new Promise<Output>((resolve, reject) => {
        this.#child.on("error", (err) => {
          reject(err);
        });

        this.#child.on("exit", (code, signal) => {
          const o = {
            file: this.#file,
            stdout: stdout,
            stderr: stderr,
            code: code,
            signal: signal,
            success: code === 0,
          } as NodeCommonOutput;

          resolve(new NodeOutput(o));
        });
      });
    }

    onDispose?: (() => void) | undefined;

    async [Symbol.asyncDispose](): Promise<void> {
      if (this.onDispose) {
        this.onDispose();
      }

      await this.status;
    }
  }

  // deno-lint-ignore no-inner-declarations
  function mapPipe(pipe: "inherit" | "null" | "piped" | undefined): IOType | null | undefined {
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

  Command.prototype.output = async function (): Promise<Output> {
    const exe = await pathFinder.findExe(this.file);
    if (exe === undefined) {
      throw new NotFoundOnPathError(this.file);
    }
    const args = this.args ? convertCommandArgs(this.args) : [];
    let signal: AbortSignal | undefined;
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
      signal: signal as any,
    });
    if (this.options?.log) {
      this.options.log(exe, args);
    }

    let stdout = new Uint8Array(0);
    let stderr = new Uint8Array(0);

    let code = 1;
    let sig: string | Signal | undefined;

    const promises: Promise<void>[] = [];
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

    promises.push(
      new Promise<void>((resolve) => {
        if (child.stdout === null) {
          resolve();
          return;
        }

        child.stdout.on("end", () => {
          resolve();
        });
      }),
    );

    promises.push(
      new Promise<void>((resolve) => {
        if (child.stderr === null) {
          resolve();
          return;
        }

        child.stderr.on("end", () => {
          resolve();
        });
      }),
    );

    promises.push(
      new Promise<void>((resolve) => {
        child.on("exit", (c, s) => {
          code = c !== null ? c : 0;
          sig = s === null ? undefined : s;
          resolve();
        });
      }),
    );

    await Promise.all(promises);

    return new NodeOutput({
      file: this.file,
      stdout: stdout,
      stderr: stderr,
      code: code,
      signal: sig,
      success: code === 0,
    } as NodeCommonOutput);
  };

  Command.prototype.outputSync = function (): Output {
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
    } as NodeCommonOutput);
  };

  Command.prototype.spawn = function (): ChildProcess {
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

  ShellCommand.prototype.output = async function (): Promise<Output> {
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

      let signal: AbortSignal | undefined;
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
        signal: signal as any,
      });

      let stdout = new Uint8Array(0);
      let stderr = new Uint8Array(0);

      let code = 1;
      let sig: string | Signal | undefined;

      const promises: Promise<void>[] = [];
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

      promises.push(
        new Promise<void>((resolve) => {
          if (child.stdout === null) {
            resolve();
            return;
          }

          child.stdout.on("end", () => {
            resolve();
          });
        }),
      );

      promises.push(
        new Promise<void>((resolve) => {
          if (child.stderr === null) {
            resolve();
            return;
          }

          child.stderr.on("end", () => {
            resolve();
          });
        }),
      );

      promises.push(
        new Promise<void>((resolve) => {
          child.on("exit", (c, s) => {
            code = c !== null ? c : 1;
            sig = s === null ? undefined : s;
            resolve();
          });
        }),
      );

      await Promise.all(promises);

      return new NodeOutput({
        file: exe,
        stdout: stdout,
        stderr: stderr,
        code: code,
        signal: sig,
        success: code === 0,
      } as NodeCommonOutput);
    } finally {
      if (isFile && generated) {
        await rm(file);
      }
    }
  };

  ShellCommand.prototype.outputSync = function (): Output {
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
      } as NodeCommonOutput);
    } finally {
      if (isFile && generated) {
        rmSync(file);
      }
    }
  };

  ShellCommand.prototype.spawn = function (): ChildProcess {
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
export function run(
  args?: CommandArgs,
  options?: Omit<CommandOptions, "stderr" | "stdout">,
): Promise<Output> {
  const o = (options || {}) as CommandOptions;
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
export function runSync(
  args?: CommandArgs,
  options?: Omit<CommandOptions, "stderr" | "stdout">,
): Output {
  const o = (options || {}) as CommandOptions;
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
export function spawn(args?: CommandArgs, options?: CommandOptions): ChildProcess {
  options ??= {};
  options.stdin ??= "inherit";
  options.stderr ??= "inherit";
  options.stdout ??= "inherit";

  return new Command(args, options).spawn();
}
