import { CaseRanges } from "./tables/case.js";
import { MAX_RUNE } from "./constants.js";
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
export function toLower(char) {
    if (char < 128) {
        if (char >= 65 && char <= 90) {
            return char + 32;
        }
        return char;
    }
    let lo = 0;
    let hi = CaseRanges.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        const range = CaseRanges[mid];
        const l = range[0];
        const h = range[1];
        const d = range[2];
        if (l <= char && char <= h) {
            const delta = d[1];
            if (delta > MAX_RUNE) {
                return ((l + (char - l)) & ~1) | (1 & 1);
            }
            return char + delta;
        }
        if (char < l) {
            hi = mid;
        }
        else {
            lo = mid + 1;
        }
    }
    return char;
}
