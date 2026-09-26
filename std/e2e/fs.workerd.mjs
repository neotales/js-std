import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { createWorkersHarness } from "./workers.mjs";

test("e2e::fs uses Workers ephemeral tmp storage", async () => {
  const harness = createWorkersHarness("./e2e/wrangler.fs.json");
  try {
    await harness.listen();
    const response = await harness.fetch("https://fs.test/");
    deepStrictEqual(await response.json(), { names: ["value.txt"], size: 6, value: "worker" });
  } finally {
    await harness.close();
  }
});
