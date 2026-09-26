/**
 * Cryptographically secure secret generation utilities.
 *
 * @module
 */
/**
 * Returns whether bytes contain an uppercase letter, lowercase letter, digit,
 * and special character. This is the default password validator.
 */
export declare function validate(data: Uint8Array): boolean;
/** A configurable source of cryptographically secure secrets. */
export interface SecretGenerator {
    setValidator(validator: (value: Uint8Array) => boolean): this;
    add(value: string): this;
    generate(length: number): string;
    generateAsUint8Array(length: number): Uint8Array;
}
/**
 * Generates secrets from a configurable single-byte character pool.
 *
 * `generateAsUint8Array` permits callers to clear the generated buffer when it
 * is no longer needed. Passwords remain immutable once converted to strings.
 */
export declare class DefaultSecretGenerator implements SecretGenerator {
    #private;
    setValidator(validator: (value: Uint8Array) => boolean): this;
    addDefaults(): this;
    addDigits(): this;
    addLower(): this;
    addUpper(): this;
    addSpecial(): this;
    addSpecialSafe(): this;
    add(value: string): this;
    generateAsUint8Array(length: number): Uint8Array;
    generate(length: number): string;
}
/** Generates a secret using the default character set or a supplied pool. */
export declare function generateSecret(length: number, characters?: string): string;
/** A preconfigured generator using the default character pool. */
export declare const secretGenerator: DefaultSecretGenerator;
