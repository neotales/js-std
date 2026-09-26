/**
 * Cross-runtime support table.
 *
 * `runtimes.json` is the single source of truth. This module reads it, validates it, and
 * answers the three questions the rest of the tooling asks:
 *
 * - which modules can be tested in a given environment
 * - which environments a module supports, for the README table
 * - which environments a CI job should cover
 *
 * The test suites deliberately do not import this. Tests read it through a small per-module
 * helper so a published package never depends on repository tooling.
 */

export type SupportLevel = "full" | "partial" | "none";
export type Tier = "core" | "web" | "embedded";

export type Environment = {
  id: string;
  label: string;
  tier: Tier;
  runner: "jsr" | "npm" | "e2e" | "runtime-lab";
};

export type LevelSpec = {
  testable: boolean;
  badge: string;
  summary: string;
};

export type RuntimeTable = {
  version: number;
  environments: Environment[];
  levels: Record<SupportLevel, LevelSpec>;
  notes: Record<string, string>;
  modules: Record<string, Record<string, SupportLevel>>;
};

export type ResolvedTable = RuntimeTable & {
  /** Environment ids in declaration order. */
  ids: string[];
  /** Module names in alphabetical order. */
  modules: Record<string, Record<string, SupportLevel>>;
};

function fail(message: string): never {
  throw new Error(`runtimes.json: ${message}`);
}

/** Reads and validates the table, failing loudly on any inconsistency. */
export function parseRuntimeTable(text: string): ResolvedTable {
  const raw = JSON.parse(text) as RuntimeTable;

  if (typeof raw.version !== "number") fail("missing numeric `version`");
  if (!Array.isArray(raw.environments) || raw.environments.length === 0) {
    fail("`environments` must be a non-empty array");
  }

  const ids = raw.environments.map((environment) => {
    for (const key of ["id", "label", "tier", "runner"] as const) {
      if (typeof environment?.[key] !== "string" || environment[key] === "") {
        fail(`environment is missing \`${key}\``);
      }
    }
    if (!["core", "web", "embedded"].includes(environment.tier)) {
      fail(`environment ${environment.id} has unknown tier ${environment.tier}`);
    }
    if (!["jsr", "npm", "e2e", "runtime-lab"].includes(environment.runner)) {
      fail(`environment ${environment.id} has unknown runner ${environment.runner}`);
    }
    return environment.id;
  });

  if (new Set(ids).size !== ids.length) fail("duplicate environment ids");

  for (const level of ["full", "partial", "none"] as const) {
    const spec = raw.levels?.[level];
    if (typeof spec?.testable !== "boolean") fail(`level ${level} is missing \`testable\``);
    if (typeof spec.summary !== "string" || spec.summary === "") {
      fail(`level ${level} is missing \`summary\``);
    }
  }

  const moduleNames = Object.keys(raw.modules ?? {}).sort();
  if (moduleNames.length === 0) fail("`modules` must list at least one module");

  for (const name of moduleNames) {
    const entry = raw.modules[name];
    if (typeof entry !== "object" || entry === null) fail(`module ${name} has no support map`);
    for (const id of ids) {
      const level = entry[id];
      if (!(level in raw.levels)) {
        fail(`module ${name} has no valid level for ${id}: ${String(level)}`);
      }
    }
    const extra = Object.keys(entry).filter((id) => !ids.includes(id));
    if (extra.length > 0) {
      fail(`module ${name} lists unknown environments: ${extra.join(", ")}`);
    }
  }

  return { ...raw, ids, modules: raw.modules };
}

/** Returns true when the module can be exercised in that environment. */
export function supports(
  table: ResolvedTable,
  module: string,
  environment: string,
): boolean {
  const level = table.modules[module]?.[environment];
  if (level === undefined) fail(`module ${module} is not listed for ${environment}`);
  return table.levels[level].testable;
}

/** Returns the modules that can be exercised in that environment, in alphabetical order. */
export function testableModules(
  table: ResolvedTable,
  environment: string,
): string[] {
  if (!table.ids.includes(environment)) fail(`unknown environment ${environment}`);
  return Object.keys(table.modules).sort()
    .filter((name) => supports(table, name, environment));
}

/** Returns the environment ids in a tier. */
export function environmentsInTier(table: ResolvedTable, tier: Tier): string[] {
  return table.environments.filter((environment) => environment.tier === tier)
    .map((environment) => environment.id);
}

/**
 * Renders the per-module support table used in the module READMEs.
 *
 * The column padding matches what `deno fmt` produces for a markdown table, so the generated
 * block survives a format run unchanged and `deno task readme:check` does not fight it.
 */
export function renderModuleTable(
  table: ResolvedTable,
  module: string,
): string {
  const entry = table.modules[module];
  if (!entry) fail(`module ${module} is not listed`);

  const cell: Record<SupportLevel, string> = {
    full: "Yes",
    partial: "Partial",
    none: "No",
  };
  const header = ["Capability", ...table.environments.map((environment) => environment.label)];
  const row = [
    "Supported",
    ...table.environments.map((environment) => cell[entry[environment.id]]),
  ];
  const widths = header.map((value, index) => Math.max(value.length, row[index].length));
  const renderRow = (values: string[]): string =>
    `| ${values.map((value, index) => value.padEnd(widths[index])).join(" | ")} |`;

  const lines = [
    renderRow(header),
    renderRow(widths.map((width) => "-".repeat(width))),
    renderRow(row),
  ];

  const note = table.notes[module];
  if (note) lines.push("", note);
  lines.push("", "Yes = full support, Partial = usable subset, No = not supported.");

  return lines.join("\n");
}
