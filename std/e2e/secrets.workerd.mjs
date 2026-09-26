import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { createWorkersHarness } from "./workers.mjs";

test("e2e::secrets works in a local Cloudflare Worker", async () => {
  const harness = createWorkersHarness("./e2e/wrangler.secrets.json");
  try {
    await harness.listen();
    const response = await harness.fetch("https://secrets.test/");

    deepStrictEqual(await response.json(), {
      masked: "*******",
      stream: "worker stream",
      text: "worker-token",
    });
  } finally {
    await harness.close();
  }
});
