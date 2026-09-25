import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { createWorkersHarness } from "./workers.mjs";

test("e2e::env expands Cloudflare worker bindings", async () => {
  const harness = createWorkersHarness("./e2e/wrangler.env-binding.json");
  try {
    await harness.listen();
    const response = await harness.fetch("https://env-binding.test/");
    deepStrictEqual(await response.json(), {
      binding: "cloudflare-binding",
      expanded: "cloudflare-binding",
    });
  } finally {
    await harness.close();
  }
});
