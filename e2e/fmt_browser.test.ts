import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright";

test("e2e::fmt inspect works in Chromium", { timeout: 60_000 }, async () => {
  const root = Deno.cwd();
  const outputDir = await Deno.makeTempDir({ prefix: "neotales-fmt-browser-" });
  const output = `${outputDir}/fmt.js`;
  const fixture = `${root}/e2e/fmt_browser_fixture.ts`;

  try {
    const bundle = await new Deno.Command(Deno.execPath(), {
      args: ["bundle", "--platform", "browser", "--output", output, fixture],
      cwd: root,
      stdout: "inherit",
      stderr: "inherit",
    }).output();
    if (!bundle.success) throw new Error("Unable to bundle fmt for browser testing.");

    try {
      await Deno.stat(chromium.executablePath());
    } catch {
      throw new Error("Install Chromium first: pnpm exec playwright install chromium");
    }

    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent("<!doctype html><title>fmt browser test</title>");
      await page.addScriptTag({ type: "module", content: await Deno.readTextFile(output) });
      await page.waitForFunction(() => "fmtInspect" in globalThis);

      const result = await page.evaluate(() => {
        const inspect = (
          globalThis as unknown as {
            fmtInspect: (value: unknown, options?: unknown) => string;
          }
        ).fmtInspect;
        const circular: Record<string, unknown> = {};
        circular.self = circular;
        return {
          circular: inspect(circular),
          control: inspect("a\nb\t\u0001"),
          multiline: inspect({ alpha: "one", beta: "two" }, { breakLength: 10 }),
          nested: inspect({ a: { b: 1 } }, { depth: 0 }),
          primitive: inspect(undefined),
        };
      });

      deepStrictEqual(result, {
        circular: "{ self: [Circular] }",
        control: "'a\\nb\\t\\x01'",
        multiline: "{\n  alpha: 'one',\n  beta: 'two'\n}",
        nested: "{ a: [Object] }",
        primitive: "undefined",
      });
    } finally {
      await browser.close();
    }
  } finally {
    await Deno.remove(outputDir, { recursive: true });
  }
});
