import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";
import { expectedReports } from "../runtime-tests/expected.ts";

const scenario = "portable core modules";

test(`e2e::${scenario} work in Chromium`, { timeout: 60_000 }, async () => {
  const root = Deno.cwd();
  const outputDir = await Deno.makeTempDir({ prefix: "neotales-portable-browser-" });
  const output = `${outputDir}/portable.js`;
  const fixture = `${root}/e2e/portable_browser_fixture.ts`;

  try {
    const bundle = await new Deno.Command(Deno.execPath(), {
      args: ["--quiet", "bundle", "--platform", "browser", "--output", output, fixture],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!bundle.success) throw new Error("Unable to bundle portable modules for Chromium.");

    try {
      await Deno.stat(chromium.executablePath());
    } catch {
      throw new Error("Install Chromium first: pnpm exec playwright install chromium");
    }

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<!doctype html><title>portable browser test</title>");
      await page.addScriptTag({ type: "module", content: await Deno.readTextFile(output) });
      await page.waitForFunction(() => "portableCoreReport" in globalThis);
      const result = await page.evaluate(() => {
        return (
          globalThis as unknown as {
            portableCoreReport: () => typeof expectedReports.core;
          }
        ).portableCoreReport();
      });
      deepStrictEqual(result, expectedReports.core);
    } finally {
      await browser.close();
    }
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
});
