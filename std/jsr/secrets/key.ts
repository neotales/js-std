const KEY_LENGTH = 32;
const keyBytes = Symbol("secret key bytes");

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/** A caller-owned AES-256-GCM key for protecting secrets and streams. */
export class SecretKey {
  #bytes: Uint8Array;
  #destroyed = false;

  private constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
  }

  /** Generates a new random 256-bit AES key. */
  static generate(): SecretKey {
    return new SecretKey(randomBytes(KEY_LENGTH));
  }

  /** Imports a copy of a 256-bit AES key. */
  static importRaw(value: Uint8Array): SecretKey {
    if (value.length !== KEY_LENGTH) throw new RangeError("AES-256-GCM keys must contain 32 bytes");
    return new SecretKey(value.slice());
  }

  /**
   * Returns a copy of this key's raw bytes for caller-managed persistence.
   * Treat the returned bytes as sensitive and clear them after use.
   */
  exportRaw(): Uint8Array {
    return this[keyBytes]().slice();
  }

  /** Clears this key from this object's writable buffer. */
  destroy(): void {
    this.#bytes.fill(0);
    this.#destroyed = true;
  }

  [keyBytes](): Uint8Array {
    if (this.#destroyed) throw new Error("Secret key has been destroyed");
    return this.#bytes;
  }
}

let defaultKey: SecretKey | undefined;

/** @internal */
export function getDefaultKey(): SecretKey {
  defaultKey ??= SecretKey.generate();
  return defaultKey;
}

/** @internal */
export function getKeyBytes(key: SecretKey): Uint8Array {
  return key[keyBytes]();
}
