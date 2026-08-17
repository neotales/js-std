/**
 * ## Overview
 *
 * The exec module makes it easy to spawn child_processes across
 * different runtimes (NodeJS, Bun, Deno) and different operating
 * systems (Windows, Linux, Mac) and include additional utilities
 * like splatting arguments and looking up executables on the path.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-std/refs/heads/master/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/exec)](https://jsr.io/@neotales/exec)
 * [![npm version](https://badge.fury.io/js/@neotales%2Fexec.svg)](https://badge.fury.io/js/@neotales%2Fexec)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/exec/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-std](https://github.com/neotales/js-std)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/exec
 *
 * # npm from jsr
 * npx jsr add @neotales/exec
 *
 * # from npmjs.org
 * npm install @neotales/exec
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * import { cmd, exec, which, run } from "@neotales/exec";
 *
 * // Find an executable on the PATH
 * const gitPath = await which("git");
 * console.log(gitPath); // "/usr/bin/git"
 *
 * // Execute a command and get output
 * const output = await exec(["git", "status"]);
 * console.log(output.text());
 *
 * // Create a command with fluent API
 * const result = await cmd(["ls", "-la"])
 *   .withCwd("/tmp")
 *   .output();
 * console.log(result.lines());
 *
 * // Run command with inherited stdout/stderr (visible in terminal)
 * await run(["npm", "install"]);
 * ```
 *
 * ## API Reference
 *
 * ### Classes
 *
 * | Class | Description |
 * |-------|-------------|
 * | `Command` | A command/syscall that spawns a child process |
 * | `ShellCommand` | A command that spawns a child process for shells (pwsh, bash, sh, etc.) |
 * | `PathFinder` | A registry of executable paths with cross-platform support |
 * | `ArgsBuilder` | A fluent builder for command-line arguments |
 * | `CommandError` | Error thrown when a command fails |
 * | `NotFoundOnPathError` | Error thrown when an executable is not found on PATH |
 *
 * ### Command Execution Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `cmd(args, options?)` | Creates a new Command instance with piped stdout/stderr |
 * | `exec(args, options?)` | Executes a command and returns the output as a Promise |
 * | `execSync(args, options?)` | Executes a command synchronously |
 * | `run(args, options?)` | Runs a command with inherited stdout/stderr |
 * | `runSync(args, options?)` | Runs a command synchronously with inherited stdout/stderr |
 * | `spawn(args, options?)` | Spawns a child process and returns the ChildProcess |
 *
 * ```typescript
 * import { cmd, exec, execSync, run, spawn } from "@neotales/exec";
 *
 * // cmd - Create a command with fluent API
 * const text = await cmd(["echo", "hello"]).text();
 * console.log(text); // "hello\n"
 *
 * // exec - Execute and get output directly
 * const output = await exec(["git", "config", "--list"]);
 * console.log(output.lines());
 *
 * // execSync - Synchronous execution
 * const syncOutput = execSync(["echo", "sync"]);
 * console.log(syncOutput.code); // 0
 *
 * // run - Execute with inherited stdout/stderr
 * await run(["npm", "install"]);
 *
 * // spawn - Long-running processes
 * await using process = spawn(["node", "server.js"]);
 * console.log("Server PID:", process.pid);
 * ```
 *
 * ### Path Lookup Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `which(fileName, prependPath?, useCache?)` | Finds executable path asynchronously |
 * | `whichSync(fileName, prependPath?, useCache?)` | Finds executable path synchronously |
 * | `whichAll(fileName, prependPath?)` | Finds every matching executable path asynchronously |
 * | `whichAllSync(fileName, prependPath?)` | Finds every matching executable path synchronously |
 *
 * ```typescript
 * import { which, whichAll, whichSync } from "@neotales/exec";
 *
 * // Async lookup
 * const gitPath = await which("git");
 * console.log(gitPath); // "/usr/bin/git" or undefined
 *
 * // Sync lookup
 * const nodePath = whichSync("node");
 * console.log(nodePath); // "/usr/bin/node"
 *
 * // With additional search paths
 * const customPath = await which("my-tool", ["/opt/tools/bin"]);
 *
 * // Disable caching for fresh lookup
 * const freshPath = await which("deno", undefined, false);
 *
 * // Find every matching executable, including glob patterns
 * const nodePaths = await whichAll("node*");
 * ```
 *
 * ### Logging Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `setLogger(fn?)` | Sets a global logger for command execution |
 * | `getLogger()` | Gets the current logger function |
 *
 * ```typescript
 * import { setLogger, cmd } from "@neotales/exec";
 *
 * // Log all executed commands
 * setLogger((file, args) => {
 *   console.log(`Executing: ${file} ${args?.join(" ") ?? ""}`);
 * });
 *
 * await cmd(["git", "status"]).output();
 * // Output: "Executing: /usr/bin/git status"
 *
 * // Disable logging
 * setLogger(undefined);
 * ```
 *
 * ### Utility Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `convertCommandArgs(args)` | Converts string, array, or object to string array |
 *
 * ```typescript
 * import { convertCommandArgs } from "@neotales/exec";
 *
 * // String with spaces
 * convertCommandArgs("git commit -m 'hello'");
 * // ["git", "commit", "-m", "hello"]
 *
 * // Object (splat)
 * convertCommandArgs({ verbose: true, count: 5 });
 * // ["--verbose", "--count", "5"]
 *
 * // Array (pass-through)
 * convertCommandArgs(["git", "status"]);
 * // ["git", "status"]
 * ```
 *
 * ### Command Class Methods
 *
 * | Method | Description |
 * |--------|-------------|
 * | `output()` | Execute and return Output promise |
 * | `outputSync()` | Execute synchronously and return Output |
 * | `spawn()` | Spawn child process and return ChildProcess |
 * | `run()` | Execute with inherited stdout/stderr |
 * | `runSync()` | Execute synchronously with inherited stdout/stderr |
 * | `text()` | Get stdout as string |
 * | `lines()` | Get stdout as string array |
 * | `json()` | Parse stdout as JSON |
 * | `pipe(args)` | Pipe output to another command |
 * | `withCwd(path)` | Set working directory |
 * | `withEnv(env)` | Set environment variables |
 * | `withStdin(mode)` | Set stdin mode (inherit/piped/null) |
 * | `withStdout(mode)` | Set stdout mode (inherit/piped/null) |
 * | `withStderr(mode)` | Set stderr mode (inherit/piped/null) |
 * | `withSignal(signal)` | Set AbortSignal for cancellation |
 *
 * ```typescript
 * import { cmd, Command } from "@neotales/exec";
 *
 * // Fluent API
 * const result = await cmd(["ls", "-la"])
 *   .withCwd("/home/user")
 *   .withEnv({ LANG: "en_US.UTF-8" })
 *   .withStdout("piped")
 *   .output();
 *
 * // Get output in different formats
 * const text = await cmd(["cat", "file.txt"]).text();
 * const lines = await cmd(["ls"]).lines();
 * const data = await cmd(["echo", '{"key": "value"}']).json();
 *
 * // Pipe commands together
 * const piped = await cmd(["echo", "hello world"])
 *   .pipe(["grep", "hello"])
 *   .pipe("cat")
 *   .output();
 * console.log(piped.text()); // "hello world\n"
 *
 * // Await command directly
 * const output = await new Command(["echo", "test"]);
 * console.log(output.text());
 * ```
 *
 * ### Output Interface
 *
 * | Property/Method | Description |
 * |-----------------|-------------|
 * | `code` | Exit code of the command |
 * | `success` | Boolean indicating if code === 0 |
 * | `signal` | Signal that terminated the process |
 * | `stdout` | Raw stdout as Uint8Array |
 * | `stderr` | Raw stderr as Uint8Array |
 * | `text()` | Get stdout as string |
 * | `lines()` | Get stdout as string array |
 * | `json()` | Parse stdout as JSON |
 * | `errorText()` | Get stderr as string |
 * | `errorLines()` | Get stderr as string array |
 * | `errorJson()` | Parse stderr as JSON |
 * | `validate(fn?, failOnStderr?)` | Validate output and throw on failure |
 *
 * ```typescript
 * import { exec } from "@neotales/exec";
 *
 * const output = await exec(["git", "status"]);
 *
 * console.log(output.code);    // 0
 * console.log(output.success); // true
 * console.log(output.text());  // "On branch main..."
 *
 * // Validate and throw if failed
 * output.validate();
 *
 * // Custom validation
 * output.validate((code) => code === 0 || code === 1);
 *
 * // Fail on stderr content
 * output.validate(undefined, true);
 * ```
 *
 * ### PathFinder Class
 *
 * | Method | Description |
 * |--------|-------------|
 * | `set(name, options)` | Register executable search options |
 * | `get(name)` | Get registered options |
 * | `has(name)` | Check if name is registered |
 * | `delete(name)` | Remove registration |
 * | `clear()` | Clear all registrations |
 * | `find(name)` | Find options by name |
 * | `findExe(name)` | Find executable path (async) |
 * | `findExeSync(name)` | Find executable path (sync) |
 *
 * ```typescript
 * import { pathFinder } from "@neotales/exec";
 *
 * // Register custom executable paths
 * pathFinder.set("my-tool", {
 *   name: "my-tool",
 *   envVariable: "MY_TOOL_PATH",
 *   windows: ["C:\\Program Files\\MyTool\\my-tool.exe"],
 *   linux: ["/opt/my-tool/bin/my-tool"],
 *   darwin: ["/Applications/MyTool.app/Contents/MacOS/my-tool"],
 * });
 *
 * // Find the executable
 * const toolPath = await pathFinder.findExe("my-tool");
 * console.log(toolPath);
 * ```
 *
 * ### Types
 *
 * | Type | Description |
 * |------|-------------|
 * | `CommandArgs` | `string \| string[] \| SplatObject` |
 * | `Stdio` | `"inherit" \| "piped" \| "null"` |
 * | `Signal` | Unix signals like `"SIGTERM"`, `"SIGKILL"`, etc. |
 * | `CommandOptions` | Options for command execution |
 * | `ShellCommandOptions` | Options for shell command execution |
 * | `Output` | Interface for command output |
 * | `ChildProcess` | Interface for spawned child process |
 * | `CommandStatus` | Status of completed command |
 * | `PathFinderOptions` | Options for PathFinder registration |
 *
 * ### Error Handling
 *
 * ```typescript
 * import { exec, CommandError, NotFoundOnPathError } from "@neotales/exec";
 *
 * try {
 *   const output = await exec(["my-command"]);
 *   output.validate();
 * } catch (e) {
 *   if (e instanceof NotFoundOnPathError) {
 *     console.log("Executable not found:", e.exe);
 *   } else if (e instanceof CommandError) {
 *     console.log("Command failed:", e.fileName);
 *     console.log("Exit code:", e.exitCode);
 *   }
 * }
 * ```
 *
 * ## Extending ShellCommand
 *
 * Create custom shell command classes by extending `ShellCommand`:
 *
 * ```typescript
 * import { ShellCommand, type ShellCommandOptions } from "@neotales/exec";
 *
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
 * // Use custom shell command
 * const cmd = new BashCommand("echo 'Hello from bash'");
 * const output = await cmd.output();
 * console.log(output.text()); // "Hello from bash\n"
 * ```
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * @module
 */
export * from "./args_builder.ts";
export * from "./command.ts";
export * from "./which.ts";
export { setLogger } from "./set_logger.ts";
export * from "./path_finder.ts";
export * from "./errors.ts";
