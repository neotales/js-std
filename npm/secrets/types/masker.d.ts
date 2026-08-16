/**
 * String masking utilities for secrets that may appear in logs or output.
 *
 * @module
 */
/** A collection of values and patterns that can mask a string. */
export interface SecretMasker {
    add(value: string | RegExp | null | undefined): this;
    addGenerator(generator: (secret: string) => string): this;
    mask(value: string | null): string | null;
}
/** Masks registered strings and regular expressions with `*******`. */
export declare class DefaultSecretMasker implements SecretMasker {
    #private;
    add(value: string | RegExp | null | undefined): this;
    addGenerator(generator: (secret: string) => string): this;
    mask(value: string | null): string | null;
    addString(secret: string): void;
}
/** A process-wide masker for application log/output integration. */
export declare const secretMasker: DefaultSecretMasker;
