import { type SecretKey } from "./key.js";
export type StreamOptions = {
    /** A caller-owned key. Omit it to use an opaque process-local key. */
    key?: SecretKey;
};
/**
 * Creates a framed AES-256-GCM encryption transform. Each input chunk is split
 * into authenticated 64 KiB frames and the final frame prevents truncation.
 */
export declare function encryptStream(options?: StreamOptions): TransformStream<Uint8Array, Uint8Array>;
/** Decrypts framed data produced by `encryptStream`. */
export declare function decryptStream(options?: StreamOptions): TransformStream<Uint8Array, Uint8Array>;
