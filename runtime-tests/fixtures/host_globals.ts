import { emitRuntimeReport } from "../emit.ts";
import { runHostGlobalsScenario } from "../scenarios/host_globals.ts";

emitRuntimeReport(runHostGlobalsScenario("/tmp"));
