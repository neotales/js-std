/**
 * Synchronous Node.js, Deno, and Bun AES-256-GCM APIs.
 *
 * This subpath uses `node:crypto` and is not available in browsers. Import the
 * root package for the portable asynchronous APIs.
 *
 * @module
 */
import { SecretKey } from "./key.js";
declare const inspect: unique symbol;
export { SecretKey };
export type SecretOptions = {
    key?: SecretKey;
};
/** A synchronous encrypted in-memory value for Node.js, Deno, and Bun. */
export declare class Secret {
    #private;
    private constructor();
    static fromText(value: string, options?: SecretOptions): Secret;
    static fromBytes(value: Uint8Array, options?: SecretOptions): Secret;
    unprotect(): Uint8Array;
    unprotectText(): string;
    withBytes<T>(callback: (value: Uint8Array) => T): T;
    withText<T>(callback: (value: string) => T): T;
    destroy(): void;
    toString(): string;
    toJSON(): string;
    [inspect](): string;
    assertLive(): void;
}
/** Encrypts text or bytes with the opaque process-local key. */
export declare function createSecret(value: string | Uint8Array): Secret;
/**
 * Encrypts an iterable of chunks with framed AES-256-GCM. Each yielded buffer
 * can be written immediately; the final frame detects stream truncation.
 */
export declare function encryptChunks(chunks: Iterable<Uint8Array>, options?: SecretOptions): Generator<Uint8Array>;
/** Decrypts framed data from `encryptChunks`, verifying every frame and the final marker. */
export declare function decryptChunks(chunks: Iterable<Uint8Array>, options?: SecretOptions): Generator<Uint8Array>;
