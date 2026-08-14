import type { Char } from "./types.js";
/**
 * Converts the given Unicode code point to its lowercase equivalent.
 * If the code point is already lowercase or non-letter, it returns the same value.
 * If the code point represents an uppercase letter, it converts it to lowercase.
 * If the code point represents a titlecase or uppercase letter with a specific locale,
 * it converts it to lowercase based on the specified locale.
 *
 * @param char - The Unicode code point to convert to lowercase.
 * @param locales - Optional. A string or an array of strings that specify the locale(s) to use for the conversion.
 *                  If not provided, the default locale of the JavaScript runtime is used.
 * @returns The lowercase equivalent of the given Unicode code point.
 *
 * @example
 * ```typescript
 * import { toLower } from '@neotales/chars';
 *
 * console.log(toLower(65)); // Output: 97
 * console.log(toLower(97)); // Output: 97
 * console.log(toLower(48)); // Output: 48
 * ```
 */
export declare function toLower(char: Char): Char;
