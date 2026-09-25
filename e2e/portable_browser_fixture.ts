import { runCoreScenario } from "../runtime-tests/scenarios/core.ts";

(globalThis as { portableCoreReport?: typeof runCoreReport }).portableCoreReport = runCoreReport;

function runCoreReport() {
  return runCoreScenario();
}
