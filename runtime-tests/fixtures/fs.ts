import { emitRuntimeReport } from "../emit.ts";
import { runFsScenario } from "../scenarios/fs.ts";

const directory = `/tmp/neotales-clearscript-fs-${Date.now()}-${
  Math.floor(Math.random() * 1_000_000)
}`;

// Hosts that run bundles as classic scripts have no top-level await, so the asynchronous work
// is published on `globalThis.__neotalesPromise`; the embedding host awaits it before reading
// the report. Runtimes that drain the microtask queue themselves simply ignore the global.
globalThis.__neotalesPromise = runFsScenario(directory).then(emitRuntimeReport);
