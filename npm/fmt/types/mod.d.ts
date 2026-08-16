/**
 * ## Overview
 *
 * A cross-runtime string formatting module providing printf-style formatting,
 * value inspection, and ANSI code handling. Works seamlessly with Deno, Node.js,
 * Bun, and the browser. Byte and duration formatters are available from the
 * `@neotales/fmt/bytes` and `@neotales/fmt/duration` subpaths.
 *
 * ![logo](https://raw.githubusercontent.com/neotales/js-std/refs/heads/master/eng/assets/logo.png)
 *
 * [![JSR](https://jsr.io/badges/@neotales/fmt)](https://jsr.io/@neotales/fmt)
 * [![npm version](https://badge.fury.io/js/@neotales%2Ffmt.svg)](https://badge.fury.io/js/@neotales%2Ffmt)
 * [![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)
 *
 * ## Documentation
 *
 * Documentation is available on [jsr.io](https://jsr.io/@neotales/fmt/doc)
 *
 * A list of other modules can be found at [github.com/neotales/js-std](https://github.com/neotales/js-std)
 *
 * ## Installation
 *
 * ```bash
 * # Deno
 * deno add jsr:@neotales/fmt
 *
 * # npm from jsr
 * npx jsr add @neotales/fmt
 *
 * # from npmjs.org
 * npm install @neotales/fmt
 * ```
 *
 * ## Quick Start
 *
 * ```typescript
 * import { sprintf, printf, echo, inspect, stripAnsiCode } from "@neotales/fmt";
 *
 * // Format strings with sprintf
 * const msg = sprintf("Hello %s! You have %d messages.", "Alice", 5);
 * // "Hello Alice! You have 5 messages."
 *
 * // Print directly to stdout
 * printf("Processing: %d%%\n", 75);
 *
 * // Print with automatic newline
 * echo("Hello, World!");
 *
 * // Inspect complex values for debugging
 * const obj = { user: "bob", scores: [95, 87, 92] };
 * console.log(inspect(obj));
 *
 * // Strip ANSI escape codes from colored text
 * const colored = "\x1b[31mError\x1b[0m: Something failed";
 * const plain = stripAnsiCode(colored); // "Error: Something failed"
 * ```
 *
 * ## API Reference
 *
 * ### Formatting Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `sprintf(format, ...args)` | Returns a formatted string using POSIX-style format specifiers |
 * | `printf(format, ...args)` | Formats and prints to stdout |
 * | `print(...args)` | Prints arguments to stdout without formatting |
 * | `echo(...args)` | Prints arguments to stdout followed by a newline |
 * | `echof(format, ...args)` | Printf with automatic newline |
 * | `errorf(format, ...args)` | Creates an Error with a formatted message |
 *
 * ```typescript
 * import { sprintf, printf, echo, errorf } from "@neotales/fmt";
 *
 * // sprintf - format and return
 * const formatted = sprintf("Value: %d, Hex: %x, Float: %.2f", 255, 255, 3.14159);
 * // "Value: 255, Hex: ff, Float: 3.14"
 *
 * // printf - format and print
 * printf("Name: %-10s Age: %d\n", "Alice", 30);
 *
 * // echo - simple output with newline
 * echo("Starting process...");
 *
 * // errorf - create formatted errors
 * throw errorf("File %s not found at line %d", "config.json", 42);
 * ```
 *
 * ### Inspection Functions
 *
 * | Function | Description |
 * |----------|-------------|
 * | `inspect(value, options?)` | Returns a string representation of any value |
 *
 * The `inspect` function works cross-runtime using `Deno.inspect`, `util.inspect` (Node.js),
 * or falls back to `JSON.stringify`.
 *
 * ```typescript
 * import { inspect } from "@neotales/fmt";
 *
 * // Simple values
 * inspect("hello");    // "'hello'"
 * inspect(42);         // "42"
 * inspect(true);       // "true"
 *
 * // Complex objects
 * inspect({ a: 1, b: [2, 3] });
 * // "{ a: 1, b: [ 2, 3 ] }"
 *
 * // With options
 * inspect(deepObject, { depth: 2 });       // Limit nesting depth
 * inspect(data, { colors: true });         // Enable ANSI colors
 * inspect(obj, { compact: false });        // Multi-line output
 * ```
 *
 * ### ANSI Utilities
 *
 * | Function | Description |
 * |----------|-------------|
 * | `stripAnsiCode(str)` | Removes all ANSI escape sequences from a string |
 *
 * ```typescript
 * import { stripAnsiCode } from "@neotales/fmt";
 *
 * // Remove color codes for logging or comparison
 * const colored = "\x1b[1m\x1b[32m✓\x1b[0m Test passed";
 * const plain = stripAnsiCode(colored); // "✓ Test passed"
 *
 * // Clean terminal output for file logging
 * const logLine = "\x1b[90m[INFO]\x1b[0m Server started on port 3000";
 * fs.writeFileSync("app.log", stripAnsiCode(logLine));
 * ```
 *
 * ## Notes
 *
 * @neotales/fmt is cross runtime alternative to `@std/fmt` for sprintf and printf functions.
 * The `@std/fmt` module uses `Deno.inspect` and `Deno.stdout.writeSync` for printf
 * which is not available in bun, node, or the browser.
 *
 * The `@neotales/fmt` module makes modifications to the `@std/fmt` module.
 *
 * For inspect or the `/I` flag inspect uses `Deno.inspect`,
 * `util.inspect` or falls back to `json.parse`.  **A browsify fallback may
 * be included at a later date**.
 *
 * For writing to a stream for printf, print, etc; the @neotales/process module
 * is used which abstracts stdout for the different runtimes.
 *
 * ## From Deno's docs
 *
 * This implementation is inspired by POSIX and Golang but does not port
 * implementation code.
 *
 * sprintf converts and formats a variable number of arguments as is specified
 * by a `format string`. In it's basic form, a format string may just be a
 * literal. In case arguments are meant to be formatted, a `directive` is
 * contained in the format string, preceded by a '%' character:
 *
 *      `%<verb>`
 *
 * The verb `s` indicates the directive should be replaced by the string
 * representation of the argument in the corresponding position of the argument
 * list:
 *
 *      `Hello %s!`
 *
 * applied to the arguments "World" yields "Hello World!".
 *
 * The meaning of the format string is modelled after [POSIX][1] format strings
 * as well as well as [Golang format strings][2]. Both contain elements specific
 * to the respective programming language that don't apply to JavaScript, so
 * they can not be fully supported. Furthermore we implement some functionality
 * that is specific to JS.
 *
 * ### Verbs
 *
 * The following verbs are supported:
 *
 * | Verb  | Meaning                                                        |
 * | ----- | -------------------------------------------------------------- |
 * | `%`   | print a literal percent                                        |
 * | `t`   | evaluate arg as boolean, print `true` or `false`               |
 * | `b`   | eval as number, print binary                                   |
 * | `c`   | eval as number, print character corresponding to the codePoint |
 * | `o`   | eval as number, print octal                                    |
 * | `x X` | print as hex (ff FF), treat string as list of bytes            |
 * | `e E` | print number in scientific/exponent format 1.123123e+01        |
 * | `f F` | print number as float with decimal point and no exponent       |
 * | `g G` | use %e %E or %f %F depending on size of argument               |
 * | `s`   | interpolate string                                             |
 * | `T`   | type of arg, as returned by `typeof`                           |
 * | `v`   | value of argument in 'default' format (see below)              |
 * | `j`   | argument as formatted by `JSON.stringify`                      |
 * | `i`   | argument as formatted by `Deno.inspect`                        |
 * | `I`   | argument as formatted by `Deno.inspect` in compact format      |
 *
 * ### Width and Precision
 *
 * Verbs may be modified by providing them with width and precision, either or
 * both may be omitted:
 *
 *     %9f    width 9, default precision
 *     %.9f   default width, precision 9
 *     %8.9f  width 8, precision 9
 *     %8.f   width 9, precision 0
 *
 * In general, 'width' describes the minimum length of the output, while
 * 'precision' limits the output.
 *
 * | verb      | precision                                                       |
 * | --------- | --------------------------------------------------------------- |
 * | `t`       | n/a                                                             |
 * | `b c o`   | n/a                                                             |
 * | `x X`     | n/a for number, strings are truncated to p bytes(!)             |
 * | `e E f F` | number of places after decimal, default 6                       |
 * | `g G`     | set maximum number of digits                                    |
 * | `s`       | truncate input                                                  |
 * | `T`       | truncate                                                        |
 * | `v`       | truncate, or depth if used with # see "'default' format", below |
 * | `j`       | n/a                                                             |
 *
 * Numerical values for width and precision can be substituted for the `*` char,
 * in which case the values are obtained from the next args, e.g.:
 *
 *     sprintf("%*.*f", 9, 8, 456.0)
 *
 * is equivalent to:
 *
 *     sprintf("%9.8f", 456.0)
 *
 * ### Flags
 *
 * The effects of the verb may be further influenced by using flags to modify
 * the directive:
 *
 * | Flag  | Verb      | Meaning                                                                    |
 * | ----- | --------- | -------------------------------------------------------------------------- |
 * | `+`   | numeric   | always print sign                                                          |
 * | `-`   | all       | pad to the right (left justify)                                            |
 * | `#`   |           | alternate format                                                           |
 * | `#`   | `b o x X` | prefix with `0b 0 0x`                                                      |
 * | `#`   | `g G`     | don't remove trailing zeros                                                |
 * | `#`   | `v`       | use output of `inspect` instead of `toString`                              |
 * | `' '` |           | space character                                                            |
 * | `' '` | `x X`     | leave spaces between bytes when printing string                            |
 * | `' '` | `d`       | insert space for missing `+` sign character                                |
 * | `0`   | all       | pad with zero, `-` takes precedence, sign is appended in front of padding  |
 * | `<`   | all       | format elements of the passed array according to the directive (extension) |
 *
 * ### 'default' format
 *
 * The default format used by `%v` is the result of calling `toString()` on the
 * relevant argument. If the `#` flags is used, the result of calling `inspect()`
 * is interpolated. In this case, the precision, if set is passed to `inspect()`
 * as the 'depth' config parameter.
 *
 * ### Positional arguments
 *
 * Arguments do not need to be consumed in the order they are provided and may
 * be consumed more than once:
 *
 *     sprintf("%[2]s %[1]s", "World", "Hello")
 *
 * returns "Hello World". The presence of a positional indicator resets the arg
 * counter allowing args to be reused:
 *
 *     sprintf("dec[%d]=%d hex[%[1]d]=%x oct[%[1]d]=%#o %s", 1, 255, "Third")
 *
 * returns `dec[1]=255 hex[1]=0xff oct[1]=0377 Third`
 *
 * Width and precision my also use positionals:
 *
 *     "%[2]*.[1]*d", 1, 2
 *
 * This follows the golang conventions and not POSIX.
 *
 * ### Errors
 *
 * The following errors are handled:
 *
 * Incorrect verb:
 *
 *     S("%h", "") %!(BAD VERB 'h')
 *
 * ## License
 *
 * [MIT License](./LICENSE.md)
 *
 * [Deno MIT Licence](https://github.com/denoland/std/blob/main/LICENSE)
 *
 * [1]: https://pubs.opengroup.org/onlinepubs/009695399/functions/fprintf.html
 * [2]: https://golang.org/pkg/fmt/
 * @module
 */
export * from "./printf.js";
export * from "./inspect.js";
export * from "./strip_ansi_code.js";
