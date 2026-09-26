/**
 * Prints the cross-runtime support matrix from `runtimes.json`.
 *
 * `deno task runtimes` is the developer-facing view; `docs/RUNTIME_MATRIX.md` carries the
 * evidence and the reasoning behind each cell.
 */

import { join, resolve } from "@std/path";
import { environmentsInTier, parseRuntimeTable } from "./runtimes.ts";

const root = resolve(import.meta.dirname!, "..");
const table = parseRuntimeTable(await Deno.readTextFile(join(root, "runtimes.json")));

const mark: Record<string, string> = { full: "yes", partial: "partial", none: "-" };
const modules = Object.keys(table.modules).sort();
const ids = table.ids;

const cells = (name: string): string[] => ids.map((id) => mark[table.modules[name][id]]);
const header = ["module", ...ids];
const rows = modules.map((name) => [name, ...cells(name)]);
const widths = header.map((cell, index) =>
  Math.max(cell.length, ...rows.map((row) => row[index].length))
);
const line = (values: string[]): string =>
  values.map((value, index) => value.padEnd(widths[index])).join("  ");

console.log(line(header));
console.log(widths.map((width) => "-".repeat(width)).join("  "));
for (const row of rows) console.log(line(row));

console.log("\nyes = full support, partial = usable subset, - = not supported\n");
for (const tier of ["core", "web", "embedded"] as const) {
  console.log(`${tier.padEnd(9)} ${environmentsInTier(table, tier).join(", ")}`);
}
