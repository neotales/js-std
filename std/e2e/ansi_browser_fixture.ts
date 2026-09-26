import { apply, bgBlue, bold, red, setColorEnabled, stripAnsiCode } from "../jsr/ansi/mod.ts";

function ansiBrowserStyles(): { plain: string; styled: string } {
  setColorEnabled(true);
  const styled = apply("browser", bold, red, bgBlue);
  return { plain: stripAnsiCode(styled), styled };
}

(globalThis as { ansiBrowserStyles?: typeof ansiBrowserStyles }).ansiBrowserStyles =
  ansiBrowserStyles;
