/**
 * Cryptographically secure secret generation and string masking for sensitive
 * values in logs and output. Supports Deno, Node.js, Bun, and browsers with
 * Web Crypto support.
 *
 * @module
 */

export * from "./generator.ts";
export { SecretKey } from "./key.ts";
export * from "./masker.ts";
export { createSecret, Secret, type SecretOptions } from "./secret.ts";
export { decryptStream, encryptStream, type StreamOptions } from "./stream.ts";
