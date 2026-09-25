import { expand, get, path, remove, set, toObject } from "../../jsr/env/mod.ts";

export type EnvScenarioReport = {
  expanded: string;
  hasPath: boolean;
  removed: boolean;
  value: string;
};

/** Exercises the QuickJS-ng std environment provider. */
export function runEnvScenario(): EnvScenarioReport {
  const name = "NEOTALES_RUNTIME_ENV";
  const inheritedPath = path();
  set(name, "quickjs-env");
  const value = get(name) ?? "";
  const expanded = expand(`\${${name}}:\${MISSING:-fallback}`);
  remove(name);
  return {
    expanded,
    hasPath: inheritedPath.length > 0,
    removed: get(name) === undefined && !(name in toObject()),
    value,
  };
}
