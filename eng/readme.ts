/**
 * Generates and verifies the runtime support table in each module README.
 *
 * The table is derived from `runtimes.json`, so the documentation cannot drift from the
 * capability data. The marker comments make the generated block replaceable without
 * disturbing the hand-written parts of the README.
 */

import { join, resolve } from "@std/path";
import { parseRuntimeTable, renderModuleTable } from "./runtimes.ts";

const root = resolve(import.meta.dirname!, "..");
const jsrDir = join(root, "jsr");

const BEGIN = "<!-- runtime-support:begin -->";
const END = "<!-- runtime-support:end -->";

export type ReadmeReport = { module: string; status: "current" | "stale" | "missing" };

function section(table: ReturnType<typeof parseRuntimeTable>, module: string): string {
  // The blank line after each marker is what `deno fmt` leaves behind, so emit it directly
  // instead of letting the format check discover it.
  return [
    BEGIN,
    "",
    "## Runtime support",
    "",
    "Generated from `runtimes.json`. Run `deno task readme` after changing it.",
    "",
    renderModuleTable(table, module),
    "",
    END,
  ].join("\n");
}

function replace(text: string, block: string): string {
  if (text.includes(BEGIN) && text.includes(END)) {
    const start = text.indexOf(BEGIN);
    const end = text.indexOf(END) + END.length;
    return text.slice(0, start) + block + text.slice(end);
  }
  // No block yet: place it before the first second-level heading after the overview, or at
  // the end when the README has nothing else to anchor to.
  const heading = text.search(/^## (?!Overview)/m);
  if (heading < 0) return `${text.replace(/\n+$/, "")}\n\n${block}\n`;
  return `${text.slice(0, heading).replace(/\n+$/, "")}\n\n${block}\n\n${text.slice(heading)}`;
}

/** Rewrites the generated block in each module README. */
export async function writeReadmes(): Promise<ReadmeReport[]> {
  const table = parseRuntimeTable(await Deno.readTextFile(join(root, "runtimes.json")));
  const reports: ReadmeReport[] = [];

  for (const module of Object.keys(table.modules).sort()) {
    const path = join(jsrDir, module, "README.md");
    let text: string;
    try {
      text = await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        reports.push({ module, status: "missing" });
        continue;
      }
      throw error;
    }
    const updated = replace(text, section(table, module));
    if (updated !== text) await Deno.writeTextFile(path, updated);
    reports.push({ module, status: updated === text ? "current" : "current" });
  }

  return reports;
}

/** Reports which module READMEs are out of date without writing anything. */
export async function verifyReadmes(): Promise<ReadmeReport[]> {
  const table = parseRuntimeTable(await Deno.readTextFile(join(root, "runtimes.json")));
  const reports: ReadmeReport[] = [];

  for (const module of Object.keys(table.modules).sort()) {
    const path = join(jsrDir, module, "README.md");
    let text: string;
    try {
      text = await Deno.readTextFile(path);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        reports.push({ module, status: "missing" });
        continue;
      }
      throw error;
    }
    const expected = section(table, module);
    const current = text.includes(BEGIN) && text.includes(END)
      ? text.slice(text.indexOf(BEGIN), text.indexOf(END) + END.length)
      : "";
    reports.push({ module, status: current === expected ? "current" : "stale" });
  }

  return reports;
}
