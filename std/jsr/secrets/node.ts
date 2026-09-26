/**
 * Synchronous Node.js, Deno, and Bun AES-256-GCM APIs.
 *
 * This subpath uses `node:crypto` and is not available in browsers. Import the
 * root package for the portable asynchronous APIs.
 *
 * @module
 */

import { createCipheriv, createDecipheriv } from "node:crypto";
import { concatBytes, randomIv, TAG_LENGTH } from "./aead.ts";
import { getDefaultKey, getKeyBytes, SecretKey } from "./key.ts";

const MASK = "*******";
const inspect = Symbol.for("nodejs.util.inspect.custom");
const MAGIC = new Uint8Array([0x4e, 0x54, 0x53, 0x31]);
const HEADER_LENGTH = 12;
const FRAME_HEADER_LENGTH = 4;
const FINAL_FRAME = 0;
const MAX_PLAINTEXT_LENGTH = 64 * 1024;
const MAX_CIPHERTEXT_LENGTH = MAX_PLAINTEXT_LENGTH + TAG_LENGTH;

export { SecretKey };

export type SecretOptions = {
  key?: SecretKey;
};

function encrypt(
  value: Uint8Array,
  key: SecretKey,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Uint8Array {
  const cipher = createCipheriv("aes-256-gcm", getKeyBytes(key), iv);
  if (additionalData) cipher.setAAD(additionalData);
  return concatBytes(cipher.update(value), cipher.final(), cipher.getAuthTag());
}

function decrypt(
  value: Uint8Array,
  key: SecretKey,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Uint8Array {
  if (value.length < TAG_LENGTH) {
    throw new Error("Encrypted value is missing an authentication tag");
  }
  const decipher = createDecipheriv("aes-256-gcm", getKeyBytes(key), iv);
  if (additionalData) decipher.setAAD(additionalData);
  decipher.setAuthTag(value.subarray(-TAG_LENGTH));
  return concatBytes(decipher.update(value.subarray(0, -TAG_LENGTH)), decipher.final());
}

/** A synchronous encrypted in-memory value for Node.js, Deno, and Bun. */
export class Secret {
  #ciphertext: Uint8Array;
  #iv: Uint8Array;
  #key: SecretKey;
  #destroyed = false;

  private constructor(ciphertext: Uint8Array, iv: Uint8Array, key: SecretKey) {
    this.#ciphertext = ciphertext;
    this.#iv = iv;
    this.#key = key;
  }

  static fromText(value: string, options: SecretOptions = {}): Secret {
    return Secret.fromBytes(new TextEncoder().encode(value), options);
  }

  static fromBytes(value: Uint8Array, options: SecretOptions = {}): Secret {
    const key = options.key ?? getDefaultKey();
    const iv = randomIv();
    return new Secret(encrypt(value, key, iv), iv, key);
  }

  unprotect(): Uint8Array {
    this.assertLive();
    return decrypt(this.#ciphertext, this.#key, this.#iv);
  }

  unprotectText(): string {
    return new TextDecoder().decode(this.unprotect());
  }

  withBytes<T>(callback: (value: Uint8Array) => T): T {
    const value = this.unprotect();
    try {
      return callback(value);
    } finally {
      value.fill(0);
    }
  }

  withText<T>(callback: (value: string) => T): T {
    return callback(this.unprotectText());
  }

  destroy(): void {
    this.#ciphertext.fill(0);
    this.#iv.fill(0);
    this.#destroyed = true;
  }

  toString(): string {
    return MASK;
  }

  toJSON(): string {
    return MASK;
  }

  [inspect](): string {
    return MASK;
  }

  assertLive(): void {
    if (this.#destroyed) throw new Error("Secret has been destroyed");
  }
}

/** Encrypts text or bytes with the opaque process-local key. */
export function createSecret(value: string | Uint8Array): Secret {
  return typeof value === "string" ? Secret.fromText(value) : Secret.fromBytes(value);
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

function readUint32(value: Uint8Array): number {
  return new DataView(value.buffer, value.byteOffset, 4).getUint32(0);
}

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function frameAdditionalData(index: number, final: boolean): Uint8Array {
  return new Uint8Array([final ? 1 : 0, ...uint32(index)]);
}

function streamIv(prefix: Uint8Array, index: number): Uint8Array {
  return concatBytes(prefix, uint32(index));
}

function randomPrefix(): Uint8Array {
  const prefix = new Uint8Array(8);
  crypto.getRandomValues(prefix);
  return prefix;
}

/**
 * Encrypts an iterable of chunks with framed AES-256-GCM. Each yielded buffer
 * can be written immediately; the final frame detects stream truncation.
 */
export function* encryptChunks(
  chunks: Iterable<Uint8Array>,
  options: SecretOptions = {},
): Generator<Uint8Array> {
  const key = options.key ?? getDefaultKey();
  const prefix = randomPrefix();
  let index = 0;

  function encryptFrame(value: Uint8Array, final: boolean): Uint8Array {
    if (index === 0xffffffff) throw new RangeError("Encrypted stream contains too many frames");
    const ciphertext = encrypt(
      value,
      key,
      streamIv(prefix, index),
      frameAdditionalData(index, final),
    );
    index++;
    return concatBytes(uint32(final ? FINAL_FRAME : ciphertext.length), ciphertext);
  }

  yield concatBytes(MAGIC, prefix);
  for (const chunk of chunks) {
    for (let offset = 0; offset < chunk.length; offset += MAX_PLAINTEXT_LENGTH) {
      yield encryptFrame(chunk.subarray(offset, offset + MAX_PLAINTEXT_LENGTH), false);
    }
  }
  yield encryptFrame(new Uint8Array(), true);
}

/** Decrypts framed data from `encryptChunks`, verifying every frame and the final marker. */
export function* decryptChunks(
  chunks: Iterable<Uint8Array>,
  options: SecretOptions = {},
): Generator<Uint8Array> {
  const key = options.key ?? getDefaultKey();
  let buffered = new Uint8Array();
  let prefix: Uint8Array | undefined;
  let index = 0;
  let finished = false;

  for (const chunk of chunks) {
    buffered = concatBytes(buffered, chunk);
    if (!prefix && buffered.length >= HEADER_LENGTH) {
      const header = buffered.subarray(0, HEADER_LENGTH);
      if (!equalBytes(header.subarray(0, MAGIC.length), MAGIC)) {
        throw new Error("Invalid encrypted stream header");
      }
      prefix = header.subarray(MAGIC.length).slice();
      buffered = buffered.subarray(HEADER_LENGTH);
    }

    if (!prefix) continue;

    while (buffered.length >= FRAME_HEADER_LENGTH) {
      if (finished) throw new Error("Encrypted stream contains data after its final frame");
      const length = readUint32(buffered);
      const final = length === FINAL_FRAME;
      const ciphertextLength = final ? TAG_LENGTH : length;
      if (!final && (ciphertextLength <= TAG_LENGTH || ciphertextLength > MAX_CIPHERTEXT_LENGTH)) {
        throw new Error("Invalid encrypted stream frame length");
      }
      if (buffered.length < FRAME_HEADER_LENGTH + ciphertextLength) break;

      const ciphertext = buffered.subarray(
        FRAME_HEADER_LENGTH,
        FRAME_HEADER_LENGTH + ciphertextLength,
      );
      const plaintext = decrypt(
        ciphertext,
        key,
        streamIv(prefix, index),
        frameAdditionalData(index, final),
      );
      index++;
      buffered = buffered.subarray(FRAME_HEADER_LENGTH + ciphertextLength);
      if (final) finished = true;
      else yield plaintext;
    }
  }

  if (!prefix || !finished || buffered.length) throw new Error("Truncated encrypted stream");
}
