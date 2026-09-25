import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { createWorkersHarness } from "./workers.mjs";

const expected = {
  args: 'a|b c:a "b c":{"_":[],"name":"neo"}',
  chars: true,
  dotenv: "two:A='1'\nB='two'",
  env: "embedded-fallback",
  path: "b/c.txt",
  results: "true:true:2:y",
  slices: "2,3,4:1,2",
  strings: "helloWorld:people:hello world",
};

test("e2e::portable core modules work in a local Cloudflare Worker", async () => {
  const harness = createWorkersHarness("./e2e/wrangler.portable.json");
  try {
    await harness.listen();
    const response = await harness.fetch("https://portable.test/");
    deepStrictEqual(await response.json(), expected);
  } finally {
    await harness.close();
  }
});
