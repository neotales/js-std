import { type SecretKey } from "./key.js";
declare const inspect: unique symbol;
export type SecretOptions = {
    /** A caller-owned key. Omit it to use an opaque process-local key. */
    key?: SecretKey;
};
/**
 * An encrypted in-memory value that masks itself in normal string, JSON, and
 * Node inspector output. Create instances with `fromText` or `fromBytes`.
 */
export declare class Secret {
    #private;
    private constructor();
    /** Encrypts a UTF-8 string. Browser calls are asynchronous because of Web Crypto. */
    static fromText(value: string, options?: SecretOptions): Promise<Secret>;
    /** Encrypts a copy of binary data. Browser calls are asynchronous because of Web Crypto. */
    static fromBytes(value: Uint8Array, options?: SecretOptions): Promise<Secret>;
    /** Decrypts and returns a new mutable byte buffer. */
    unprotect(): Promise<Uint8Array>;
    /** Decrypts and decodes the value as UTF-8 text. Returned strings cannot be cleared. */
    unprotectText(): Promise<string>;
    /** Runs a callback with decrypted bytes, then clears that temporary buffer. */
    withBytes<T>(callback: (value: Uint8Array) => T | Promise<T>): Promise<T>;
    /** Runs a callback with decrypted text. The runtime cannot clear the temporary string. */
    withText<T>(callback: (value: string) => T | Promise<T>): Promise<T>;
    /** Clears this object's writable encrypted buffers and prevents further access. */
    destroy(): void;
    toString(): string;
    toJSON(): string;
    [inspect](): string;
    assertLive(): void;
}
/**
 * Encrypts text or bytes with the opaque process-local key. Browser calls are
 * asynchronous because of Web Crypto.
 */
export declare function createSecret(value: string | Uint8Array): Promise<Secret>;
export {};
