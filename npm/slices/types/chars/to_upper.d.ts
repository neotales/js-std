import type { Char } from "./types.js";
/**
 * Converts a lowercase letter to uppercase.
 * If the input value is already uppercase or a non-letter, it returns the input value as is.
 * If the input value is a lowercase letter, it converts it to uppercase using the specified locales.
 * @param char - The Unicode value of the character to convert.
 * @param locales - Optional. A string or an array of strings that specify the locales to use for the conversion.
 * @returns The Unicode value of the uppercase character.
 *
 * @example
 * ```typescript
 * import { toUpper } from '@neotales/chars';
 *
 * console.log(toUpper(65)); // Output: 65
 * console.log(toUpper(97)); // Output: 65
 * console.log(toUpper(48)); // Output: 48
 * ```
 */
export declare function toUpper(char: Char): Char;
