// Copyright 2014-2021 Sindre Sorhus. All rights reserved. MIT license.
// Copyright 2021 Yoshiya Hinosawa. All rights reserved. MIT license.
// Copyright 2021 Giuseppe Eletto. All rights reserved. MIT license.
// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Convert bytes to a human-readable string: 1337 -> 1.34 kB.
 *
 * Based on {@link https://github.com/sindresorhus/pretty-bytes | pretty-bytes}.
 * @module
 */

type LocaleOptions = {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

/** Options for {@linkcode format}. */
export interface FormatOptions {
  /** Uses bits representation. */
  bits?: boolean;
  /** Uses binary bytes, such as kibibytes. */
  binary?: boolean;
  /** Includes a plus sign for positive numbers. */
  signed?: boolean;
  /** Uses localized number formatting. */
  locale?: boolean | string | string[];
  /** Minimum number of fraction digits to display. */
  minimumFractionDigits?: number;
  /** Maximum number of fraction digits to display. */
  maximumFractionDigits?: number;
}

/**
 * Converts bytes to a human-readable string.
 *
 * @example
 * ```ts
 * import { format } from "@neotales/fmt/bytes";
 *
 * format(1337); // "1.34 kB"
 * ```
 */
export function format(num: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(num)) {
    throw new TypeError(`Expected a finite number, got ${typeof num}: ${num}`);
  }

  const units = (options.bits ? "b" : "B") + "kMGTPEZY";
  if (options.signed && num === 0) return ` 0 ${units[0]}`;

  const prefix = num < 0 ? "-" : options.signed ? "+" : "";
  num = Math.abs(num);
  const localeOptions = getLocaleOptions(options);

  if (num < 1) return prefix + toLocaleString(num, options.locale, localeOptions) + " " + units[0];

  const exponent = Math.min(
    Math.floor(options.binary ? Math.log(num) / Math.log(1024) : Math.log10(num) / 3),
    units.length - 1,
  );
  num /= Math.pow(options.binary ? 1024 : 1000, exponent);
  if (!localeOptions) num = Number(num.toPrecision(3));

  let unit = units[exponent];
  if (exponent > 0) {
    unit += options.binary ? "i" : "";
    unit += options.bits ? "bit" : "B";
  }

  return prefix + toLocaleString(num, options.locale, localeOptions) + " " + unit;
}

function getLocaleOptions({
  maximumFractionDigits,
  minimumFractionDigits,
}: FormatOptions): LocaleOptions | undefined {
  if (maximumFractionDigits === undefined && minimumFractionDigits === undefined) return;
  return {
    ...(maximumFractionDigits === undefined ? {} : { maximumFractionDigits }),
    ...(minimumFractionDigits === undefined ? {} : { minimumFractionDigits }),
  };
}

function toLocaleString(
  num: number,
  locale: FormatOptions["locale"],
  options: LocaleOptions | undefined,
): string {
  if (typeof locale === "string" || Array.isArray(locale))
    return num.toLocaleString(locale, options);
  if (locale === true || options !== undefined) return num.toLocaleString(undefined, options);
  return num.toString();
}
