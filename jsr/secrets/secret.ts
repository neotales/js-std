import { decrypt, encrypt, randomIv } from "./aead.ts";
import { getDefaultKey, type SecretKey } from "./key.ts";

const MASK = "*******";
const inspect = Symbol.for("nodejs.util.inspect.custom");

export type SecretOptions = {
  /** A caller-owned key. Omit it to use an opaque process-local key. */
  key?: SecretKey;
};

/**
 * An encrypted in-memory value that masks itself in normal string, JSON, and
 * Node inspector output. Create instances with `fromText` or `fromBytes`.
 */
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

  /** Encrypts a UTF-8 string. Browser calls are asynchronous because of Web Crypto. */
  static async fromText(value: string, options: SecretOptions = {}): Promise<Secret> {
    return await Secret.fromBytes(new TextEncoder().encode(value), options);
  }

  /** Encrypts a copy of binary data. Browser calls are asynchronous because of Web Crypto. */
  static async fromBytes(value: Uint8Array, options: SecretOptions = {}): Promise<Secret> {
    const key = options.key ?? getDefaultKey();
    const iv = randomIv();
    const ciphertext = await encrypt(value, key, iv);
    return new Secret(ciphertext, iv, key);
  }

  /** Decrypts and returns a new mutable byte buffer. */
  async unprotect(): Promise<Uint8Array> {
    this.assertLive();
    return await decrypt(this.#ciphertext, this.#key, this.#iv);
  }

  /** Decrypts and decodes the value as UTF-8 text. Returned strings cannot be cleared. */
  async unprotectText(): Promise<string> {
    return new TextDecoder().decode(await this.unprotect());
  }

  /** Runs a callback with decrypted bytes, then clears that temporary buffer. */
  async withBytes<T>(callback: (value: Uint8Array) => T | Promise<T>): Promise<T> {
    const value = await this.unprotect();
    try {
      return await callback(value);
    } finally {
      value.fill(0);
    }
  }

  /** Runs a callback with decrypted text. The runtime cannot clear the temporary string. */
  async withText<T>(callback: (value: string) => T | Promise<T>): Promise<T> {
    return await callback(await this.unprotectText());
  }

  /** Clears this object's writable encrypted buffers and prevents further access. */
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

/**
 * Encrypts text or bytes with the opaque process-local key. Browser calls are
 * asynchronous because of Web Crypto.
 */
export async function createSecret(value: string | Uint8Array): Promise<Secret> {
  return typeof value === "string" ? await Secret.fromText(value) : await Secret.fromBytes(value);
}
