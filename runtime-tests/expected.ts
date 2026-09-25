import type { AnsiScenarioReport } from "./scenarios/ansi.ts";
import type { CoreScenarioReport } from "./scenarios/core.ts";
import type { FmtInspectScenarioReport } from "./scenarios/fmt_inspect.ts";
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
  ansi: {
    plain: "embedded",
    styled: "\x1b[44m\x1b[31m\x1b[1membedded\x1b[22m\x1b[39m\x1b[49m",
  } satisfies AnsiScenarioReport,
  secrets: {
    keyBytes: 32,
    masked: "*******",
    text: "embedded-token",
  } satisfies SecretsScenarioReport,
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
