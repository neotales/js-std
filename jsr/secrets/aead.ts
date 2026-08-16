import { getKeyBytes, type SecretKey } from "./key.ts";

export const IV_LENGTH = 12;
export const TAG_LENGTH = 16;

function concat(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function owned(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy;
}

function isNodeLike(): boolean {
  const runtime = globalThis as typeof globalThis & {
    Bun?: unknown;
    Deno?: unknown;
    process?: { versions?: { node?: string } };
  };
  return !!(runtime.Bun || runtime.Deno || runtime.process?.versions?.node);
}

async function nativeCrypto(): Promise<typeof import("node:crypto") | undefined> {
  if (!isNodeLike()) return undefined;
  try {
    return await import("node:crypto");
  } catch {
    return undefined;
  }
}

export async function encrypt(
  value: Uint8Array,
  key: SecretKey,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Promise<Uint8Array> {
  const nodeCrypto = await nativeCrypto();
  if (nodeCrypto) {
    const cipher = nodeCrypto.createCipheriv("aes-256-gcm", getKeyBytes(key), iv);
    if (additionalData) cipher.setAAD(additionalData);
    return concat(cipher.update(value), cipher.final(), cipher.getAuthTag());
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    owned(getKeyBytes(key)),
    "AES-GCM",
    false,
    ["encrypt"],
  );
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: owned(iv),
      ...(additionalData ? { additionalData: owned(additionalData) } : {}),
    },
    cryptoKey,
    owned(value),
  );
  return new Uint8Array(encrypted);
}

export async function decrypt(
  value: Uint8Array,
  key: SecretKey,
  iv: Uint8Array,
  additionalData?: Uint8Array,
): Promise<Uint8Array> {
  if (value.length < TAG_LENGTH)
    throw new Error("Encrypted value is missing an authentication tag");

  const nodeCrypto = await nativeCrypto();
  if (nodeCrypto) {
    const ciphertext = value.subarray(0, -TAG_LENGTH);
    const tag = value.subarray(-TAG_LENGTH);
    const decipher = nodeCrypto.createDecipheriv("aes-256-gcm", getKeyBytes(key), iv);
    if (additionalData) decipher.setAAD(additionalData);
    decipher.setAuthTag(tag);
    return concat(decipher.update(ciphertext), decipher.final());
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    owned(getKeyBytes(key)),
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: owned(iv),
      ...(additionalData ? { additionalData: owned(additionalData) } : {}),
    },
    cryptoKey,
    owned(value),
  );
  return new Uint8Array(decrypted);
}

export function randomIv(): Uint8Array {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  return iv;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
  return concat(...parts);
}
