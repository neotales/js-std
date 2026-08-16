import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

test("e2e::ansi styles work in Chromium", { timeout: 60_000 }, async () => {
  const root = Deno.cwd();
  const outputDir = await Deno.makeTempDir({ prefix: "neotales-ansi-browser-" });
  const output = `${outputDir}/ansi.js`;
  const fixture = `${root}/e2e/ansi_browser_fixture.ts`;

  try {
    const bundle = await new Deno.Command(Deno.execPath(), {
      args: ["bundle", "--platform", "browser", "--output", output, fixture],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!bundle.success) throw new Error("Unable to bundle ansi for browser testing.");

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<!doctype html><title>ansi browser test</title>");
      await page.addScriptTag({ type: "module", content: await Deno.readTextFile(output) });
      await page.waitForFunction(() => "ansiBrowserStyles" in globalThis);
      const result = await page.evaluate(() => {
        return (
          globalThis as unknown as {
            ansiBrowserStyles: () => { plain: string; styled: string };
          }
        ).ansiBrowserStyles();
      });

      deepStrictEqual(result, {
        plain: "browser",
        styled: "\x1b[44m\x1b[31m\x1b[1mbrowser\x1b[22m\x1b[39m\x1b[49m",
      });
    } finally {
      await browser.close();
    }
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
});
