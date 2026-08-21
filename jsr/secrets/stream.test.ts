import { deepStrictEqual, rejects } from "node:assert/strict";
import { test } from "node:test";
import { decryptStream, encryptStream, SecretKey } from "./mod.ts";

async function readAll(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    chunks.push(next.value);
    length += next.value.length;
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function streamOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

test("secrets::stream encrypts and decrypts framed data", async () => {
  const key = SecretKey.generate();
  const input = new Uint8Array(70_000).fill(42);
  const encrypted = await readAll(streamOf(input).pipeThrough(encryptStream({ key })));
  const decrypted = await readAll(streamOf(encrypted).pipeThrough(decryptStream({ key })));

  deepStrictEqual(decrypted, input);
});

test("secrets::stream rejects tampering and truncation", async () => {
  const key = SecretKey.generate();
  const encrypted = await readAll(
    streamOf(new TextEncoder().encode("secret")).pipeThrough(encryptStream({ key })),
  );
  const tampered = encrypted.slice();
  tampered[15] ^= 1;

  await rejects(readAll(streamOf(tampered).pipeThrough(decryptStream({ key }))));
  await rejects(readAll(streamOf(encrypted.subarray(0, -1)).pipeThrough(decryptStream({ key }))));
});
