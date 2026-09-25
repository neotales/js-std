import { emitRuntimeReport } from "../emit.ts";
import { runCoreScenario } from "../scenarios/core.ts";

emitRuntimeReport(runCoreScenario());
