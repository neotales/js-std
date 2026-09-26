import { apply, bgBlue, bold, red, setColorEnabled, stripAnsiCode } from "../jsr/ansi/mod.ts";

export default {
  fetch(): Response {
    setColorEnabled(true);
    const styled = apply("worker", bold, red, bgBlue);
    return Response.json({ plain: stripAnsiCode(styled), styled });
  },
};
