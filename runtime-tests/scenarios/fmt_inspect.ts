import { inspect } from "../../jsr/fmt/inspect.ts";

export type FmtInspectScenarioReport = {
  circular: string;
  nested: string;
  primitive: string;
};

/** Exercises fmt's focused cross-runtime inspector without importing process streams. */
export function runFmtInspectScenario(): FmtInspectScenarioReport {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  return {
    circular: inspect(circular),
    nested: inspect({ a: { b: 1 } }, { depth: 0 }),
    primitive: inspect(undefined),
  };
}
