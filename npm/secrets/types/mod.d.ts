/**
 * Cryptographically secure secret generation and string masking for sensitive
 * values in logs and output. Supports Deno, Node.js, Bun, and browsers with
 * Web Crypto support.
 *
 * @module
 */
export * from "./generator.js";
export { SecretKey } from "./key.js";
export * from "./masker.js";
export { createSecret, Secret, type SecretOptions } from "./secret.js";
export { decryptStream, encryptStream, type StreamOptions } from "./stream.js";
