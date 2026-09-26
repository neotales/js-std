import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { createWorkersHarness } from "./workers.mjs";

test("e2e::ansi styles work in a local Cloudflare Worker", async () => {
  const harness = createWorkersHarness("./e2e/wrangler.ansi.json");
  try {
    await harness.listen();
    const response = await harness.fetch("https://ansi.test/");

    deepStrictEqual(await response.json(), {
      plain: "worker",
      styled: "\x1b[44m\x1b[31m\x1b[1mworker\x1b[22m\x1b[39m\x1b[49m",
    });
  } finally {
    await harness.close();
  }
});
