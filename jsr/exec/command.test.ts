import {
  deepStrictEqual as equal,
  fail,
  notDeepStrictEqual as notEqual,
  ok,
  throws,
} from "node:assert/strict";
const nope = (value: unknown, message?: string) => ok(!value, message);
import { test } from "node:test";
import {
  Command,
  exec,
  execSync,
  runSync,
  ShellCommand,
  type ShellCommandOptions,
  spawn,
} from "./command.ts";
import { globals, WIN } from "./globals.ts";
import { env } from "@neotales/env/export";
import { rm, writeTextFile } from "@neotales/fs";
import { dirname, fromFileUrl } from "@neotales/path";
import { pathFinder } from "./path_finder.ts";

let rt = "node";
if (globals.Deno) {
  rt = "deno";
} else if (globals.Bun) {
  rt = "bun";
}
const RUNTIME = rt;
const EOL = WIN ? "\r\n" : "\n";
const g = globalThis as { DEBUG?: boolean };
const debug = g.DEBUG;

if (WIN) {
  pathFinder.set("echo", {
    name: "echo",
    envVariable: "ECHO_EXE",
    windows: [
      "C:\\Program Files\\Git\\usr\\bin\\echo.exe",
      "C:\\Program Files(x86)\\Git\\usr\\bin\\echo.exe",
    ],
  });

  pathFinder.set("ls", {
    name: "ls",
    envVariable: "LS_EXE",
    windows: [
      "C:\\Program Files\\Git\\usr\\bin\\ls.exe",
      "C:\\Program Files(x86)\\Git\\usr\\bin\\ls.exe",
    ],
  });

  pathFinder.set("grep", {
    name: "grep",
    envVariable: "GREP_EXE",
    windows: [
      "C:\\Program Files\\Git\\usr\\bin\\grep.exe",
      "C:\\Program Files(x86)\\Git\\usr\\bin\\grep.exe",
    ],
  });

  pathFinder.set("cat", {
    name: "cat",
    envVariable: "CAT_EXE",
    windows: [
      "C:\\Program Files\\Git\\usr\\bin\\cat.exe",
      "C:\\Program Files(x86)\\Git\\usr\\bin\\cat.exe",
    ],
  });
}

const echo = await pathFinder.findExe("echo");
const ls = await pathFinder.findExe("ls");
const grep = await pathFinder.findExe("grep");
const cat = await pathFinder.findExe("cat");
const pwsh = await pathFinder.findExe("pwsh");
const git = await pathFinder.findExe("git");

test("exec::Command - with simple output", async () => {
  let exe = "deno";
  let cmd = "which";
  switch (RUNTIME) {
    case "node":
      exe = "node";
      break;
    case "bun":
      exe = "bun";
      break;
  }

  if (WIN) {
    exe += ".exe";
    cmd = "where.exe";
  }

  const cmd2 = new Command([cmd, exe]);
  const output = await cmd2.output();
  equal(output.code, 0);
  ok(output.text().trim().endsWith(exe));
});

test("exec::Command - with inherit returns no output", { skip: !echo }, async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"], { stdout: "inherit" });
  const output = await cmd.output();
  equal(output.code, 0);
  equal(output.stdout.length, 0);
  equal(output.text(), "");
});

test("exec::Command - with bad command returns error", async (t) => {
  if (!git) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: git command not found");
    return;
  }

  const cmd = new Command(["git", "clone"], { stderr: "piped", stdout: "piped" });
  const output = await cmd.output();
  ok(output.code !== 0);
  notEqual(output.stderr.length, 0);
  notEqual(output.errorText(), "");
});

test("exec::exec runs inline command", async (t) => {
  if (!git) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: git command not found");
    return;
  }

  const output = await exec(`git config \
        --list`);
  ok(output.code === 0, `exit code was ${output.code} and should be 0`);
});

test("exec::Command - set cwd", async (t) => {
  if (!ls) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: ls command not found");
    return;
  }

  let dir = import.meta.dirname;
  dir ??= dirname(fromFileUrl(import.meta.url));
  const cmd2 = new Command(["ls", "-l"], { cwd: dir });
  const output2 = await cmd2.output();
  equal(output2.code, 0);
  ok(output2.text().includes("command.ts") || output2.text().includes("command.js"));

  const home = env.get("HOME") ??
    env.get("USERPROFILE") ??
    "/home/" + (env.get("USERNAME") ?? env.get("USER"));
  const cmd = new Command(["ls", "-l"], { cwd: home });
  const output = await cmd.output();
  equal(output.code, 0);
  nope(output.text().includes("base.ts") || output.text().includes("base.js"));
});

test("exec::Command - spawn", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"]);
  const process = cmd.spawn();
  const output = await process.output();
  equal(output.code, 0);
  // should default to piped
  equal(output.text().trim().length, 5);
});

test("exec::Command - spawn with piped options", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"], {
    stdout: "piped",
    stderr: "piped",
  });
  const process = cmd.spawn();
  const output = await process.output();
  equal(output.code, 0);
  // should default to inherits
  equal(output.stdout.length, 6);
});

test("exec::Command - await the command", async () => {
  const cmd = new Command(["echo", "hello"]);
  const output = await cmd;
  equal(output.code, 0);
  equal(output.text(), "hello\n");
});

test("exec::Command return text", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"]);
  const output = await cmd.text();
  equal(output, "hello\n");
});

test("exec::Command return lines", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"]);
  const output = await cmd.lines();
  equal(output.length, 2);
  equal(output[0], "hello");
  equal(output[1], "");
});

test("exec::Command - pipe to invoke echo, grep, and cat", async (t) => {
  if (!echo || !grep || !cat) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo, grep, or cat command not found");
    return;
  }

  const result = await new Command(`echo "my test"`).pipe(["grep", "test"]).pipe("cat").output();

  equal(result.code, 0);

  if (debug) {
    console.log(result.text());
  }
});

test("exec::Command - output to json", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", '{"hello": "world"}']);
  const output = (await cmd.json()) as Record<string, string>;
  equal(output.hello, "world");
});

test("exec::Command with log", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  let f: string = "";
  let args: string[] | undefined = [];

  const cmd = new Command([echo!, "hello"], {
    log: (file, a) => {
      f = file;
      args = a;
    },
  });
  const output = await cmd.output();
  equal(output.code, 0);
  if (WIN) {
    ok(f.endsWith("echo.exe"));
  } else {
    ok(f.endsWith("echo"));
  }

  ok(args !== undefined, "args is undefined");
  equal(args.length, 1);
});

test("exec::Command - use validate on output", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "hello"]);
  const output = await cmd.output();
  try {
    output.validate();
  } catch {
    fail("Should not throw");
  }

  const cmd2 = new Command(["git", "clone"], { stderr: "piped", stdout: "piped" });
  const output2 = await cmd2.output();
  throws(() => output2.validate());
  try {
    output2.validate((_) => true);
  } catch {
    fail("Should not throw");
  }
});

class Pwsh extends ShellCommand {
  constructor(script: string, options?: ShellCommandOptions) {
    super("pwsh", script, options);
  }

  override get ext(): string {
    return ".ps1";
  }

  override getShellArgs(script: string, isFile: boolean): string[] {
    const params = this.shellArgs ?? [
      "-NoProfile",
      "-NonInteractive",
      "-NoLogo",
      "-ExecutionPolicy",
      "ByPass",
    ];
    if (isFile) {
      params.push("-File", script);
    } else {
      params.push("-Command", script);
    }

    return params;
  }
}

test("exec::ShellCommand - get expected shell args for pwsh", (t) => {
  if (!pwsh) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: pwsh command not found");
    return;
  }
  const cmd = new Pwsh("hello.ps1");
  const args = cmd.getShellArgs("hello.ps1", true);
  equal(args.length, 7);
  equal(args[0], "-NoProfile");
  equal(args[1], "-NonInteractive");
  equal(args[2], "-NoLogo");
  equal(args[3], "-ExecutionPolicy");
  equal(args[4], "ByPass");
  equal(args[5], "-File");
});

test("exec::ShellCommand - get ext from command", () => {
  // this isn't executed
  const cmd = new Pwsh("Write-Host 'Hello, World!'");
  const ext = cmd.ext;
  equal(ext, ".ps1");
});

test("exec::ShellCommand - run inline script", async (t) => {
  if (!pwsh) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: pwsh command not found");
    return;
  }
  const cmd = new Pwsh("Write-Host 'Hello, World!'");
  const output = await cmd.output();
  equal(output.code, 0);
  equal(output.text(), `Hello, World!${EOL}`);
});

test("exec::ShellCommand - run file", async (t) => {
  if (!pwsh) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: pwsh command not found");
    return;
  }
  await writeTextFile("hello.ps1", "Write-Host 'Hello, World!'");

  try {
    const cmd = new Pwsh("hello.ps1");
    const output = await cmd.output();
    equal(output.code, 0);
    equal(output.text(), `Hello, World!${EOL}`);
  } finally {
    await rm("hello.ps1");
  }
});

test("exec:ShellCommand - use spawn", async (t) => {
  if (!pwsh) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests using node:test");
      return;
    }
    t.skip("Skipping test: pwsh command not found");
    return;
  }

  await writeTextFile("hello2.ps1", "Write-Host 'Hello, World!'");

  try {
    const cmd = new Pwsh("hello2.ps1", { stdout: "piped", stderr: "piped" });
    await using process = cmd.spawn();

    const output = await process.output();
    equal(output.code, 0);
    equal(output.text(), `Hello, World!${EOL}`);
  } finally {
    await rm("hello2.ps1");
  }
});

test("exec::Command - withFile method", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["placeholder", "hello"]);
  cmd.withFile(echo!);
  const output = await cmd.output();
  equal(output.code, 0);
  ok(output.text().includes("hello"));
});

test("exec::Command - withArgs method", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo"]);
  cmd.withArgs(["world"]);
  const output = await cmd.output();
  equal(output.code, 0);
  ok(output.text().includes("world"));
});

test("exec::Command - withArgs with includesFile", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command([]);
  cmd.withArgs(["echo", "test123"], true);
  const output = await cmd.output();
  equal(output.code, 0);
  ok(output.text().includes("test123"));
});

test("exec::Command - withStdout and withStderr", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["echo", "test"]);
  cmd.withStdout("piped").withStderr("piped");
  const output = await cmd.output();
  equal(output.code, 0);
  ok(output.text().includes("test"));
});

test("exec::Command - toArgs returns correct format", () => {
  const cmd = new Command(["git", "status", "--short"]);
  const args = cmd.toArgs();
  equal(args.length, 3);
  equal(args[0], "git");
  equal(args[1], "status");
  equal(args[2], "--short");
});

test("exec::Command - toOptions returns options", () => {
  const cmd = new Command(["echo"], { cwd: "/tmp" });
  const options = cmd.toOptions();
  equal(options.cwd, "/tmp");
});

test("exec::convertCommandArgs - handles string input", async () => {
  const { convertCommandArgs } = await import("./command.ts");
  const result = convertCommandArgs("git status --short");
  equal(result.length, 3);
  equal(result[0], "git");
  equal(result[1], "status");
  equal(result[2], "--short");
});

test("exec::convertCommandArgs - handles array input", async () => {
  const { convertCommandArgs } = await import("./command.ts");
  const result = convertCommandArgs(["git", "commit", "-m", "test"]);
  equal(result.length, 4);
  equal(result[0], "git");
  equal(result[3], "test");
});

test("exec::convertCommandArgs - handles undefined/null", async () => {
  const { convertCommandArgs } = await import("./command.ts");
  equal(convertCommandArgs(undefined).length, 0);
  equal(convertCommandArgs(null as unknown as string).length, 0);
});

test("exec::convertCommandArgs - handles object with options", async () => {
  const { convertCommandArgs } = await import("./command.ts");
  const result = convertCommandArgs({ verbose: true, count: 5 });
  ok(result.includes("--verbose"));
  ok(result.includes("--count"));
  ok(result.includes("5"));
});

test("exec::Command - output validate with custom function", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test: Bun does not support skipping tests");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const output = await new Command(["echo", "test"]).output();
  // Custom validator that accepts any code
  output.validate((code) => code >= 0);
  ok(output.success);
});

test("exec::Command - outputSync method", { skip: !echo }, (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const cmd = new Command(["git", "status", "--short"]);
  const output = cmd.outputSync();
  equal(
    output.code,
    0,
    `exit code was ${output.code} and should be 0. Stdout: ${output.text()} Stderr: ${output.errorText()}`,
  );
});

test("exec::execSync captures output", { skip: !echo }, (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const output = execSync([echo, "sync"]);
  equal(output.code, 0);
  ok(output.text().includes("sync"));
});

test("exec::runSync and spawn invoke top-level helpers", { skip: !echo }, async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const runOutput = runSync([echo, "run"], { stdin: "null" });
  equal(runOutput.code, 0);

  const process = spawn([echo, "spawn"], {
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  });
  const spawnOutput = await process.output();
  equal(spawnOutput.code, 0);
  ok(spawnOutput.text().includes("spawn"));
});

test("exec::Command - constructor with single word string", () => {
  // When a string has no spaces, it should be treated as the file only
  const cmd = new Command("echo");
  equal(cmd.toArgs()[0], "echo");
  equal(cmd.toArgs().length, 1);
});

test("exec::Command - constructor with object args", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  // Object-based args (splat)
  const cmd = new Command({ _: ["echo", "hello"] });
  const output = await cmd.output();
  equal(output.code, 0);
});

test("exec::Command - withUid and withGid methods exist", () => {
  const cmd = new Command(["echo"]);
  // Just verify the methods exist and return this
  ok(cmd.withUid(1000) === cmd);
  ok(cmd.withGid(1000) === cmd);
});

test("exec::Command - withSignal method", async (t) => {
  if (!echo) {
    if (rt === "bun") {
      ok(true, "Skipping test");
      return;
    }
    t.skip("Skipping test: echo command not found");
    return;
  }

  const controller = new AbortController();
  const cmd = new Command(["echo", "test"]);
  cmd.withSignal(controller.signal);
  const output = await cmd.output();
  equal(output.code, 0);
});
