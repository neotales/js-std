import { emitRuntimeReport } from "../emit.ts";
import { runEnvScenario } from "../scenarios/env.ts";

emitRuntimeReport(runEnvScenario("clearscript-env"));
