import { concatBytes, decrypt, encrypt, TAG_LENGTH } from "./aead.ts";
import { getDefaultKey, type SecretKey } from "./key.ts";

const MAGIC = new Uint8Array([0x4e, 0x54, 0x53, 0x31]);
const HEADER_LENGTH = 12;
const FRAME_HEADER_LENGTH = 4;
const FINAL_FRAME = 0;
const MAX_PLAINTEXT_LENGTH = 64 * 1024;
const MAX_CIPHERTEXT_LENGTH = MAX_PLAINTEXT_LENGTH + TAG_LENGTH;

export type StreamOptions = {
  /** A caller-owned key. Omit it to use an opaque process-local key. */
  key?: SecretKey;
};

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function uint32(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value);
  return bytes;
}

function readUint32(value: Uint8Array): number {
  return new DataView(value.buffer, value.byteOffset, 4).getUint32(0);
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
 * Creates a framed AES-256-GCM encryption transform. Each input chunk is split
 * into authenticated 64 KiB frames and the final frame prevents truncation.
 */
export function encryptStream(
  options: StreamOptions = {},
): TransformStream<Uint8Array, Uint8Array> {
  const key = options.key ?? getDefaultKey();
  const prefix = randomPrefix();
  let index = 0;

  async function encryptFrame(value: Uint8Array, final: boolean): Promise<Uint8Array> {
    if (index === 0xffffffff) throw new RangeError("Encrypted stream contains too many frames");
    const ciphertext = await encrypt(
      value,
      key,
      streamIv(prefix, index),
      frameAdditionalData(index, final),
    );
    index++;
    return concatBytes(uint32(final ? FINAL_FRAME : ciphertext.length), ciphertext);
  }

  return new TransformStream({
    start(controller) {
      controller.enqueue(concatBytes(MAGIC, prefix));
    },
    async transform(value, controller) {
      for (let offset = 0; offset < value.length; offset += MAX_PLAINTEXT_LENGTH) {
        controller.enqueue(
          await encryptFrame(value.subarray(offset, offset + MAX_PLAINTEXT_LENGTH), false),
        );
      }
    },
    async flush(controller) {
      controller.enqueue(await encryptFrame(new Uint8Array(), true));
    },
  });
}

/** Decrypts framed data produced by `encryptStream`. */
export function decryptStream(
  options: StreamOptions = {},
): TransformStream<Uint8Array, Uint8Array> {
  const key = options.key ?? getDefaultKey();
  let buffered: Uint8Array<ArrayBuffer> = new Uint8Array();
  let prefix: Uint8Array | undefined;
  let index = 0;
  let finished = false;

  async function process(controller: TransformStreamDefaultController<Uint8Array>): Promise<void> {
    if (!prefix && buffered.length >= HEADER_LENGTH) {
      const header = buffered.subarray(0, HEADER_LENGTH);
      if (!equalBytes(header.subarray(0, MAGIC.length), MAGIC))
        throw new Error("Invalid encrypted stream header");
      prefix = header.subarray(MAGIC.length).slice();
      buffered = buffered.subarray(HEADER_LENGTH);
    }

    if (!prefix) return;

    while (buffered.length >= FRAME_HEADER_LENGTH) {
      if (finished) throw new Error("Encrypted stream contains data after its final frame");
      const length = readUint32(buffered);
      const final = length === FINAL_FRAME;
      const ciphertextLength = final ? TAG_LENGTH : length;
      if (!final && (ciphertextLength <= TAG_LENGTH || ciphertextLength > MAX_CIPHERTEXT_LENGTH)) {
        throw new Error("Invalid encrypted stream frame length");
      }
      if (buffered.length < FRAME_HEADER_LENGTH + ciphertextLength) return;

      const ciphertext = buffered.subarray(
        FRAME_HEADER_LENGTH,
        FRAME_HEADER_LENGTH + ciphertextLength,
      );
      const plaintext = await decrypt(
        ciphertext,
        key,
        streamIv(prefix, index),
        frameAdditionalData(index, final),
      );
      index++;
      buffered = buffered.subarray(FRAME_HEADER_LENGTH + ciphertextLength);
      if (final) finished = true;
      else controller.enqueue(plaintext);
    }
  }

  return new TransformStream({
    async transform(value, controller) {
      buffered = concatBytes(buffered, value);
      await process(controller);
    },
    async flush(controller) {
      await process(controller);
      if (!prefix || !finished || buffered.length) throw new Error("Truncated encrypted stream");
    },
  });
}
