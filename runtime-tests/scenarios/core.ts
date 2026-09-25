import { join as joinArgs, parse as parseArgs, split } from "../../jsr/args/mod.ts";
import { equalFold, isDigit } from "../../jsr/chars/mod.ts";
import { parse, stringify } from "../../jsr/dotenv/mod.ts";
import { expand, remove, set } from "../../jsr/env/mod.ts";
import { join, normalize } from "../../jsr/path/mod.ts";
import { fail, ok } from "../../jsr/results/mod.ts";
import { ReadOnlySlice, Slice } from "../../jsr/slices/mod.ts";
import { camelize, pluralize, StringBuilder } from "../../jsr/strings/mod.ts";

export type CoreScenarioReport = {
  args: string;
  chars: boolean;
  dotenv: string;
  env: string;
  path: string;
  results: string;
  slices: string;
  strings: string;
};

/** Exercises module surfaces that do not require Node, Deno, or Web Platform APIs. */
export function runCoreScenario(): CoreScenarioReport {
  set("NEOTALES_RUNTIME_NAME", "embedded");
  const source = [1, 2, 3, 4, 5];
  const slice = new Slice(source, 1, 3);
  const readonly = new ReadOnlySlice(source, 0, 2);
  const builder = new StringBuilder().append("hello").append(" world");

  const report: CoreScenarioReport = {
    args: `${split("a 'b c'").join("|")}:${joinArgs(["a", "b c"])}:${
      JSON.stringify(parseArgs(["--name", "neo"]))
    }`,
    chars: equalFold(65, 97) && isDigit(48),
    dotenv: `${parse("A=1\nB='two'").B}:${stringify({ A: "1", B: "two" })}`,
    env: expand("${NEOTALES_RUNTIME_NAME}-${MISSING:-fallback}"),
    path: normalize(join("a", "..", "b", "c.txt")),
    results: [ok(1).ok(), fail("x").failed(), ok(2).value, fail("y").error].join(":"),
    slices: `${[...slice].join(",")}:${[...readonly].join(",")}`,
    strings: `${camelize("hello_world")}:${pluralize("person")}:${builder}`,
  };

  remove("NEOTALES_RUNTIME_NAME");
  return report;
}
