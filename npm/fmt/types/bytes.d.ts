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
export declare function format(num: number, options?: FormatOptions): string;
