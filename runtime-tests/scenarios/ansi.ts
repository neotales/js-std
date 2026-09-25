import { apply, bgBlue, bold, red, setColorEnabled, stripAnsiCode } from "../../jsr/ansi/mod.ts";

export type AnsiScenarioReport = {
  plain: string;
  styled: string;
};

/** Exercises the complete ANSI entry point, including its process-backed settings. */
export function runAnsiScenario(): AnsiScenarioReport {
  setColorEnabled(true);
  const styled = apply("embedded", bold, red, bgBlue);
  return { plain: stripAnsiCode(styled), styled };
}
