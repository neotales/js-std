import { emitRuntimeReport } from "../emit.ts";
import { runFmtInspectScenario } from "../scenarios/fmt_inspect.ts";

emitRuntimeReport(runFmtInspectScenario());
