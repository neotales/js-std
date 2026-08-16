# @neotales/ansi

## Overview

Cross-runtime ANSI color styles, terminal capability detection, and mutable
terminal settings. The style helpers work in Deno, Node.js, Bun, browsers, and
Cloudflare Workers. Terminal detection is meaningful only in runtimes with a
terminal; browser and Worker environments default to plain text.

## Installation

```sh
deno add jsr:@neotales/ansi
npm install @neotales/ansi
```

## Styles

```ts
import { apply, bgBlue, blue, bold, green, stripAnsiCode } from "@neotales/ansi";

console.log(blue("information"));
console.log(green("success"));
console.log(apply("notice", bold, blue, bgBlue));

stripAnsiCode("\x1b[31merror\x1b[39m"); // "error"
```

Set `setColorEnabled(false)` to suppress all escape codes. Pass `undefined` to
restore automatic enablement from `AnsiSettings.current.mode`. The override is
module-global, so applications should restore it after a temporary change.

## Terminal Detection

`detectMode()` checks `--color`, `--color=<level>`, `--no-color`, `NO_COLOR`,
`FORCE_COLOR`, common CI variables, `COLORTERM`, and `TERM`. Color levels accept
16-color, 256-color, and truecolor aliases. `AnsiSettings.current` holds the
shared detected mode and controls adaptive custom colors.

```ts
import { AnsiModes, AnsiSettings, defineColor, yellow } from "@neotales/ansi";

AnsiSettings.current = new AnsiSettings(AnsiModes.TwentyFourBit);
const orange = defineColor(0xff8c00, 208, yellow);
console.log(orange("warning"));
```

## Hyperlinks

`link` creates an OSC-8 terminal hyperlink when colors and
`AnsiSettings.current.links` are enabled. URLs are stripped of terminal control
characters before output.

```ts
import { link } from "@neotales/ansi";

console.log(link("Neotales", "https://github.com/neotales/js-std"));
```

## Extended Colors

```ts
import { bgRgb24, rgb8, rgb24 } from "@neotales/ansi";

rgb8("palette", 208);
rgb24("true color", { r: 255, g: 140, b: 0 });
bgRgb24("background", 0x123456);
```

`rgb8`, `rgb24`, and their background variants clamp channels and palette
indexes to valid ANSI ranges. `rgb24To8` downgrades true color to the 256-color
palette.

## Browser And Workers

Browsers and Cloudflare Workers can produce and strip ANSI sequences, but they
have no terminal to detect. Styles default to disabled there unless an
application explicitly calls `setColorEnabled(true)`. ANSI escapes are not CSS
styling and will not affect browser-rendered text.

## License

[MIT](./LICENSE.md)
