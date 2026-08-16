import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

test("e2e::secrets protects values and streams in Chromium", { timeout: 60_000 }, async () => {
  const root = Deno.cwd();
  const outputDir = await Deno.makeTempDir({ prefix: "neotales-secrets-browser-" });
  const output = `${outputDir}/secrets.js`;
  const fixture = `${root}/e2e/secrets_browser_fixture.ts`;

  try {
    const bundle = await new Deno.Command(Deno.execPath(), {
      args: ["bundle", "--platform", "browser", "--output", output, fixture],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!bundle.success) throw new Error("Unable to bundle secrets for browser testing.");

    try {
      await Deno.stat(chromium.executablePath());
    } catch {
      throw new Error("Install Chromium first: pnpm exec playwright install chromium");
    }

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.route("https://secrets.test/", (route) => {
        return route.fulfill({ body: "<!doctype html><title>secrets browser test</title>" });
      });
      await page.goto("https://secrets.test/");
      await page.addScriptTag({ type: "module", content: await Deno.readTextFile(output) });
      await page.waitForFunction(() => "secretsBrowserRoundTrip" in globalThis);
      const result = await page.evaluate(async () => {
        return await (
          globalThis as unknown as {
            secretsBrowserRoundTrip: () => Promise<{
              masked: string;
              stream: string;
              text: string;
            }>;
          }
        ).secretsBrowserRoundTrip();
      });

      deepStrictEqual(result, {
        masked: "*******",
        stream: "browser stream",
        text: "browser-token",
      });
    } finally {
      await browser.close();
    }
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
});
