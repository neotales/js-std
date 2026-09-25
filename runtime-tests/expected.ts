import type { AnsiScenarioReport } from "./scenarios/ansi.ts";
import type { CoreScenarioReport } from "./scenarios/core.ts";
import type { FmtInspectScenarioReport } from "./scenarios/fmt_inspect.ts";
import type { EnvScenarioReport } from "./scenarios/env.ts";
import type { FsScenarioReport } from "./scenarios/fs.ts";
import type { HostGlobalsScenarioReport } from "./scenarios/host_globals.ts";
import type { JsOsScenarioReport } from "./scenarios/js_os.ts";
import type { SecretsScenarioReport } from "./scenarios/secrets.ts";

export const expectedReports = {
  core: {
    args: 'a|b c:a "b c":{"_":[],"name":"neo"}',
    chars: true,
    dotenv: "two:A='1'\nB='two'",
    env: "embedded-fallback",
    path: "b/c.txt",
    results: "true:true:2:y",
    slices: "2,3,4:1,2",
    strings: "helloWorld:people:hello world",
  } satisfies CoreScenarioReport,
  fmtInspect: {
    circular: "{ self: [Circular] }",
    nested: "{ a: [Object] }",
    primitive: "undefined",
  } satisfies FmtInspectScenarioReport,
  env: {
    expanded: "quickjs-env:fallback",
    hasPath: true,
    removed: true,
    value: "quickjs-env",
  } satisfies EnvScenarioReport,
  clearScriptEnv: {
    expanded: "clearscript-env:fallback",
    hasPath: true,
    removed: true,
    value: "clearscript-env",
  } satisfies EnvScenarioReport,
  ansi: {
    plain: "embedded",
    styled: "\x1b[44m\x1b[31m\x1b[1membedded\x1b[22m\x1b[39m\x1b[49m",
  } satisfies AnsiScenarioReport,
  secrets: {
    keyBytes: 32,
    masked: "*******",
    text: "embedded-token",
  } satisfies SecretsScenarioReport,
  moduleFs: {
    entries: ["value.txt"],
    exists: true,
    info: { isDirectory: false, isFile: true, size: 14 },
    text: "clearscript-fs",
  } satisfies FsScenarioReport,
  jsOs: {
    isElevated: { available: true, uidMatches: true },
    libsecret: { available: false, entries: [] },
    winCred: { available: false, entries: [] },
    winDpapi: { available: false },
    winRegistry: { available: false },
  } satisfies JsOsScenarioReport,
  hostGlobals: {
    copy: 13,
    errors: [],
    surface: {
      fs: [60, 106],
      os: [14, 24],
      path: [16, 18],
      promises: [23, 34],
    },
    flags: "193",
    handleRead: "host",
    handleWrite: "HOST",
    hardLink: "EINVAL",
    os: {
      arch: "x64",
      eol: '"\\n"',
      homedir: "set",
      platform: "linux",
      tmpdir: "set",
      user: "set",
    },
    path: "/a/c|b|.txt|/a|true|/|:|/a/c",
    stat: { isFile: true, size: 13 },
    symlink: "value.txt",
    utimes: true,
  } satisfies HostGlobalsScenarioReport,
  quickJsFs: {
    contents: "quickjs-fs",
    size: 10,
  },
  txikiFs: {
    entries: ["value.txt"],
    size: 8,
    value: "txiki-fs",
  },
} as const;
