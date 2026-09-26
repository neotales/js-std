/**
 * Exercises every `node:fs`, `node:os`, and `node:path` entry point that `@neotales/fs`
 * resolves, so a shim gap is caught by a scenario rather than by a matrix claim.
 *
 * The runtime lab runs this against the compatibility layer's own shim. It is deliberately
 * written against the Node API rather than against the Neotales modules, so it keeps working as
 * a direct conformance check of the host.
 */

export type HostGlobalsScenarioReport = {
  copy: number;
  errors: string[];
  /** Counts of the names each shim exposes, compared against Node 26.10.0 on Linux x64. */
  surface: Record<string, [number, number]>;
  flags: string;
  handleRead: string;
  handleWrite: string;
  hardLink: string;
  /** Assertions that the Unix identity fields are real rather than placeholders. */
  identity: {
    devPositive: boolean;
    hardLinkSharesIno: boolean;
    inoPositive: boolean;
    perm: string;
    uidIsKnown: boolean;
    uidMatchesDirectory: boolean;
  };
  lstat: { followsTarget: boolean; isLink: boolean };
  os: Record<string, string>;
  path: string;
  stat: Record<string, unknown>;
  symlink: string;
  utimes: boolean;
};

/** The real Node types are discarded on purpose: this checks the shim, not the typings. */
type ShimModule = {
  [name: string]: unknown;
  constants: Record<string, number>;
  promises: Record<string, unknown>;
};

function call<T>(module: ShimModule, name: string, ...args: unknown[]): T {
  const member = module[name];
  if (typeof member !== "function") {
    throw new Error(`${name} is ${member === undefined ? "missing" : typeof member}`);
  }
  return (member as (...rest: unknown[]) => T).apply(module, args);
}

function countNames(value: object): number {
  let total = 0;
  for (const key in value) {
    if (key) total++;
  }
  return total;
}

export function runHostGlobalsScenario(root: string): HostGlobalsScenarioReport {
  const fs = process.getBuiltinModule("node:fs") as unknown as ShimModule;
  const os = process.getBuiltinModule("node:os") as unknown as ShimModule;
  const path = process.getBuiltinModule("node:path") as unknown as ShimModule;

  const report: HostGlobalsScenarioReport = {
    copy: 0,
    errors: [],
    surface: {},
    flags: "",
    handleRead: "",
    handleWrite: "",
    hardLink: "",
    identity: {
      devPositive: false,
      hardLinkSharesIno: false,
      inoPositive: false,
      perm: "",
      uidIsKnown: false,
      uidMatchesDirectory: false,
    },
    lstat: { followsTarget: false, isLink: false },
    os: {},
    path: "",
    stat: {},
    symlink: "",
    utimes: false,
  };

  function check(name: string, run: () => void): void {
    try {
      run();
    } catch (error) {
      report.errors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  function expectError(name: string, code: string, run: () => void): string {
    try {
      run();
    } catch (error) {
      const actual = (error as { code?: string }).code;
      if (actual === code) return code;
      report.errors.push(`${name}: expected ${code}, got ${actual ?? "none"}`);
      return "";
    }
    report.errors.push(`${name}: expected ${code}, but the call succeeded`);
    return "";
  }

  const directory = `${root}/neotales-host-globals`;
  const file = `${directory}/value.txt`;
  const copy = `${directory}/copy.txt`;
  const hard = `${directory}/hard.txt`;
  const soft = `${directory}/soft.txt`;

  check("mkdirSync", () => call(fs, "mkdirSync", directory, { recursive: true }));
  check("writeFileSync", () => call(fs, "writeFileSync", file, "host-globals", "utf-8"));

  check("readFileSync/text", () => {
    if (call<string>(fs, "readFileSync", file, "utf-8") !== "host-globals") {
      throw new Error("text mismatch");
    }
  });

  check("readFileSync/buffer", () => {
    const bytes = call<Uint8Array>(fs, "readFileSync", file);
    if (!(bytes instanceof Uint8Array)) throw new Error("not a Uint8Array");
    if (bytes.length !== 12) throw new Error(`length ${bytes.length}`);
  });

  check("appendFileSync", () => call(fs, "appendFileSync", file, "!", "utf-8"));
  check("accessSync", () => call(fs, "accessSync", file, fs.constants.R_OK));

  check("existsSync", () => {
    if (!call<boolean>(fs, "existsSync", file)) throw new Error("existing path reported missing");
    if (call<boolean>(fs, "existsSync", `${directory}/nope`)) {
      throw new Error("missing path reported present");
    }
  });

  check("statSync", () => {
    const stat = call<Record<string, unknown>>(fs, "statSync", file);
    const isFile = stat.isFile as () => boolean;
    if (isFile() !== true) throw new Error("isFile is false");
    if (stat.size !== 13) throw new Error(`size is ${String(stat.size)}`);
    report.stat = { isFile: isFile(), size: stat.size };
  });

  check("lstatSync", () => {
    const stat = call<Record<string, unknown>>(fs, "lstatSync", file);
    if (typeof (stat.isSymbolicLink as () => boolean) !== "function") {
      throw new Error("isSymbolicLink is missing");
    }
  });

  check("readdirSync", () => {
    const names = call<string[]>(fs, "readdirSync", directory);
    if (!Array.isArray(names)) throw new Error("not an array");
    if (names.length !== 1) throw new Error(`expected 1 entry, got ${names.length}`);
  });

  check("readdirSync/withFileTypes", () => {
    const entries = call<{ name: string; isFile(): boolean }[]>(
      fs,
      "readdirSync",
      directory,
      { withFileTypes: true },
    );
    if (!entries[0].isFile()) throw new Error("the entry is not a file");
  });

  check("copyFileSync", () => {
    call(fs, "copyFileSync", file, copy);
    report.copy = call<{ size: number }>(fs, "statSync", copy).size;
  });

  check("linkSync", () => call(fs, "linkSync", file, hard));

  check("readlinkSync/hardLink", () => {
    // Node raises EINVAL when the path is not a symbolic link, even though a hard link is a
    // perfectly valid link. The shim has to agree, or a caller cannot tell the two apart.
    report.hardLink = expectError(
      "readlinkSync/hardLink",
      "EINVAL",
      () => call(fs, "readlinkSync", hard),
    );
  });

  check("symlinkSync", () => {
    // The target is stored literally, so a relative link reads back unchanged.
    call(fs, "symlinkSync", "value.txt", soft);
    report.symlink = call<string>(fs, "readlinkSync", soft);
  });

  check("lstatSync/followsNothing", () => {
    // lstat must report the link itself; stat must resolve through it.
    const stat = call<Record<string, unknown>>(fs, "lstatSync", soft);
    if ((stat.isSymbolicLink as () => boolean)() !== true) {
      throw new Error("lstat did not report a symbolic link");
    }
    const target = call<Record<string, unknown>>(fs, "statSync", soft);
    if ((target.isSymbolicLink as () => boolean)() !== false) {
      throw new Error("stat resolved the link but still reported it as one");
    }
    report.lstat = { followsTarget: false, isLink: true };
  });

  check("statSync/realFields", () => {
    // These come from stat(2) on Unix. An inode of 0 or -1 would mean the host is inventing
    // values, which is exactly what inode-based identity must not rely on.
    const stat = call<Record<string, number | boolean>>(fs, "statSync", file);
    const linkStat = call<Record<string, number | boolean>>(fs, "statSync", hard);
    const dirStat = call<Record<string, number | boolean>>(fs, "statSync", directory);
    const uid = stat.uid as number;
    const perm = ((stat.mode as number) & 0o777).toString(8);

    if ((stat.ino as number) <= 0) {
      throw new Error(`ino is ${String(stat.ino)}, so inode-based identity is unusable`);
    }
    if ((stat.dev as number) <= 0) throw new Error(`dev is ${String(stat.dev)}`);
    if (uid < 0) throw new Error(`uid is ${uid}, so ownership is unknown`);
    if ((stat.mtimeMs as number) <= 0) throw new Error("mtimeMs is not a real timestamp");
    if (stat.ino !== linkStat.ino) throw new Error("a hard link did not share the inode");
    if (stat.ino === dirStat.ino) throw new Error("distinct entries shared an inode");
    if (uid !== (dirStat.uid as number)) throw new Error("file and directory owners disagree");

    report.identity = {
      devPositive: (stat.dev as number) > 0,
      hardLinkSharesIno: stat.ino === linkStat.ino,
      inoPositive: (stat.ino as number) > 0,
      perm,
      uidIsKnown: uid >= 0,
      uidMatchesDirectory: uid === (dirStat.uid as number),
    };
  });

  check("realpathSync", () => {
    if (typeof call(fs, "realpathSync", file) !== "string") throw new Error("not a path");
  });

  check("chmodSync", () => call(fs, "chmodSync", file, 0o600));

  check("utimesSync", () => {
    const when = new Date(1_600_000_000_000);
    call(fs, "utimesSync", file, when, when);
    report.utimes = true;
  });

  check("truncateSync", () => {
    call(fs, "truncateSync", file, 4);
    if (call<{ size: number }>(fs, "statSync", file).size !== 4) throw new Error("not truncated");
    call(fs, "truncateSync", file, 13);
  });

  check("openSync/read/write/close", () => {
    const handle = call<number>(fs, "openSync", file, fs.constants.O_RDWR);
    try {
      const buffer = new Uint8Array(4);
      if (call<number>(fs, "readSync", handle, buffer, 0, 4, 0) !== 4) {
        throw new Error("short read");
      }
      report.handleRead = new TextDecoder().decode(buffer);
      call(fs, "writeSync", handle, new TextEncoder().encode("HOST"), 0, 4, 0);
      call(fs, "fsyncSync", handle);
      report.handleWrite = new TextDecoder()
        .decode(call<Uint8Array>(fs, "readFileSync", file))
        .slice(0, 4);
    } finally {
      call(fs, "closeSync", handle);
    }
  });

  check("ftruncateSync", () => {
    const handle = call<number>(fs, "openSync", file, fs.constants.O_RDWR);
    try {
      call(fs, "ftruncateSync", handle, 13);
    } finally {
      call(fs, "closeSync", handle);
    }
  });

  check("fstatSync", () => {
    const handle = call<number>(fs, "openSync", file, fs.constants.O_RDONLY);
    try {
      if (call<{ size: number }>(fs, "fstatSync", handle).size !== 13) {
        throw new Error("wrong size");
      }
    } finally {
      call(fs, "closeSync", handle);
    }
  });

  check("constants", () => {
    report.flags = String(fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL);
  });

  check("promises", () => {
    for (
      const name of [
        "chmod",
        "chown",
        "copyFile",
        "link",
        "lstat",
        "mkdir",
        "open",
        "opendir",
        "readFile",
        "readdir",
        "readlink",
        "realpath",
        "rename",
        "rm",
        "rmdir",
        "stat",
        "symlink",
        "truncate",
        "unlink",
        "writeFile",
      ]
    ) {
      if (typeof fs.promises[name] !== "function") throw new Error(`promises.${name} is missing`);
    }
  });

  check("renameSync", () => call(fs, "renameSync", copy, `${directory}/renamed.txt`));

  check("unlinkSync", () => {
    call(fs, "unlinkSync", `${directory}/renamed.txt`);
    call(fs, "unlinkSync", hard);
    call(fs, "unlinkSync", soft);
  });

  check("rmSync", () => call(fs, "rmSync", directory, { recursive: true, force: true }));

  check("surface", () => {
    // The counts are recorded so coverage cannot grow or shrink without a report diff. The
    // right-hand value is what Node 26.10.0 exposes on Linux x64.
    report.surface = {
      fs: [countNames(fs), 106],
      os: [countNames(os), 24],
      path: [countNames(path), 18],
      promises: [countNames(fs.promises), 34],
    };
  });

  check("os", () => {
    report.os = {
      arch: call<string>(os, "arch"),
      eol: JSON.stringify(os.EOL),
      homedir: call<string>(os, "homedir").length > 0 ? "set" : "empty",
      platform: call<string>(os, "platform"),
      tmpdir: call<string>(os, "tmpdir").length > 0 ? "set" : "empty",
      user: call<{ username: string }>(os, "userInfo").username.length > 0 ? "set" : "empty",
    };
  });

  check("path", () => {
    report.path = [
      call<string>(path, "join", "/a", "b", "../c"),
      call<string>(path, "basename", "/a/b.txt", ".txt"),
      call<string>(path, "extname", "/a/b.txt"),
      call<string>(path, "dirname", "/a/b.txt"),
      String(call<boolean>(path, "isAbsolute", "/a")),
      path.sep,
      path.delimiter,
      call<string>(path, "normalize", "/a//b/../c"),
    ].join("|");
  });

  return report;
}
