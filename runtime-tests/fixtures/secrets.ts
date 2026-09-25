import { emitRuntimeReport } from "../emit.ts";
import { runSecretsScenario } from "../scenarios/secrets.ts";

runSecretsScenario().then(emitRuntimeReport);
