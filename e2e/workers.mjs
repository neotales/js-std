import { createTestHarness } from "wrangler";

const root = new URL("../", import.meta.url);

/** Starts a local workerd harness using a fixture-specific Wrangler config. */
export function createWorkersHarness(configPath) {
  return createTestHarness({
    root: root.pathname,
    workers: [{ configPath }],
  });
}
