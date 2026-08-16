import { createSecret, decryptStream, encryptStream, SecretKey } from "../jsr/secrets/mod.ts";

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

function streamOf(value: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(value);
      controller.close();
    },
  });
}

export default {
  async fetch(): Promise<Response> {
    const secret = await createSecret("worker-token");
    const key = SecretKey.generate();
    const input = new TextEncoder().encode("worker stream");
    const encrypted = await readAll(streamOf(input).pipeThrough(encryptStream({ key })));
    const decrypted = await readAll(streamOf(encrypted).pipeThrough(decryptStream({ key })));

    return Response.json({
      masked: String(secret),
      stream: new TextDecoder().decode(decrypted),
      text: await secret.unprotectText(),
    });
  },
};
