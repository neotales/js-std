// Copyright 2018-2026 the Deno authors. MIT license.

/**
 * Formats milliseconds as a duration.
 * @module
 */

type DurationPartUnit =
  | "days"
  | "hours"
  | "minutes"
  | "seconds"
  | "milliseconds"
  | "microseconds"
  | "nanoseconds";

interface DurationPart {
  unit: DurationPartUnit;
  value: number;
}

const narrowUnitNames = new Map<DurationPartUnit, string>([
  ["days", "d"],
  ["hours", "h"],
  ["minutes", "m"],
  ["seconds", "s"],
  ["milliseconds", "ms"],
  ["microseconds", "µs"],
  ["nanoseconds", "ns"],
]);

const fullUnitNames = new Map<DurationPartUnit, string>([
  ["days", "day"],
  ["hours", "hour"],
  ["minutes", "minute"],
  ["seconds", "second"],
  ["milliseconds", "millisecond"],
  ["microseconds", "microsecond"],
  ["nanoseconds", "nanosecond"],
]);

/** Options for {@linkcode format}. */
export interface FormatOptions {
  /** The output style. */
  style?: "narrow" | "digital" | "full";
  /** Omits zero-value components. */
  ignoreZero?: boolean;
}

/**
 * Formats milliseconds as a duration.
 *
 * @example
 * ```ts
 * import { format } from "@neotales/fmt/duration";
 *
 * format(99_674, { ignoreZero: true }); // "1m 39s 674ms"
 * ```
 */
export function format(milliseconds: number, options: FormatOptions = {}): string {
  const { style = "narrow", ignoreZero = false } = options;
  const parts = toParts(milliseconds);

  switch (style) {
    case "narrow":
      return parts
        .filter((part) => !ignoreZero || part.value)
        .map((part) => `${part.value}${narrowUnitNames.get(part.unit)}`)
        .join(" ");
    case "full":
      return parts
        .filter((part) => !ignoreZero || part.value)
        .map(
          (part) => `${part.value} ${fullUnitNames.get(part.unit)}${part.value === 1 ? "" : "s"}`,
        )
        .join(", ");
    case "digital": {
      const result = parts.map((part) =>
        ["milliseconds", "microseconds", "nanoseconds"].includes(part.unit)
          ? String(part.value).padStart(3, "0")
          : String(part.value).padStart(2, "0")
      );
      if (ignoreZero) {
        while (!Number(result[result.length - 1])) result.pop();
      }
      return result.join(":");
    }
    default:
      throw new TypeError('style must be "narrow", "full", or "digital"!');
  }
}

function toParts(milliseconds: number): DurationPart[] {
  const value = Math.abs(milliseconds);
  const fraction = value.toFixed(7).slice(-7, -1);
  return [
    { unit: "days", value: Math.trunc(value / 86_400_000) },
    { unit: "hours", value: Math.trunc(value / 3_600_000) % 24 },
    { unit: "minutes", value: Math.trunc(value / 60_000) % 60 },
    { unit: "seconds", value: Math.trunc(value / 1_000) % 60 },
    { unit: "milliseconds", value: Math.trunc(value) % 1_000 },
    { unit: "microseconds", value: Number(fraction.slice(0, 3)) },
    { unit: "nanoseconds", value: Number(fraction.slice(3, 6)) },
  ];
}
