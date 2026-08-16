declare const keyBytes: unique symbol;
/** A caller-owned AES-256-GCM key for protecting secrets and streams. */
export declare class SecretKey {
    #private;
    private constructor();
    /** Generates a new random 256-bit AES key. */
    static generate(): SecretKey;
    /** Imports a copy of a 256-bit AES key. */
    static importRaw(value: Uint8Array): SecretKey;
    /**
     * Returns a copy of this key's raw bytes for caller-managed persistence.
     * Treat the returned bytes as sensitive and clear them after use.
     */
    exportRaw(): Uint8Array;
    /** Clears this key from this object's writable buffer. */
    destroy(): void;
    [keyBytes](): Uint8Array;
}
/** @internal */
export declare function getDefaultKey(): SecretKey;
/** @internal */
export declare function getKeyBytes(key: SecretKey): Uint8Array;
export {};
