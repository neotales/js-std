import { emitRuntimeReport } from "../emit.ts";
import { runAnsiScenario } from "../scenarios/ansi.ts";

emitRuntimeReport(runAnsiScenario());
