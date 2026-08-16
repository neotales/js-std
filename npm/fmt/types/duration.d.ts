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
export declare function format(milliseconds: number, options?: FormatOptions): string;
