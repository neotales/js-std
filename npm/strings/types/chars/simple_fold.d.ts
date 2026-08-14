import type { Char } from "./types.js";
/**
 * Returns the simple case folding of the given character. Based on
 * golang's unicode/simplefold.go implementation.
 * @param char The character to fold.
 * @returns The folded character.
 *
 * @example
 * ```ts
 * import { simpleFold } from "@neotales/chars";
 *
 * console.log(String.fromCharCode(simpleFold(0x41))); // 'a'
 * console.log(String.fromCharCode(simpleFold(0x61))); // 'A'
 * console.log(String.fromCharCode(simpleFold(0xDF))); // 's'
 * console.log(String.fromCharCode(simpleFold(0x73))); // 'ß'
 * console.log(String.fromCharCode(simpleFold(0x1F88))); // 'ᾀ'
 * console.log(String.fromCharCode(simpleFold(0x1F80))); // 'ᾈ'
 * ```
 */
export declare function simpleFold(char: Char): Char;
/**
 * Compares two characters for equality under simple case folding
 * which is a more general form of case-insensitivity.
 *
 * @param a The first character to compare.
 * @param b The second character to compare.
 * @returns `true` if the characters are equal under simple cas
 * folding, `false` otherwise.
 *
 * @example
 * ```ts
 * import { equalFold } from "@neotales/chars";
 *
 * console.log(equalFold(0x41, 0x61)); // true ('A' and 'a')
 * console.log(equalFold(0xDF, 0x73)); // true ('ß' and 's')
 * console.log(equalFold(0x1F88, 0x1F80)); // true ('ᾈ' and 'ᾀ')
 * console.log(equalFold(0x41, 0x42)); // false ('A' and 'B')
 * ```
 */
export declare function equalFold(a: Char, b: Char): boolean;
