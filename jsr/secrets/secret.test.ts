import { deepStrictEqual, equal, rejects } from "node:assert/strict";
import { inspect } from "node:util";
import { test } from "node:test";
import { createSecret, Secret, SecretKey } from "./mod.ts";

test("secrets::createSecret uses the opaque process-local key", async () => {
  equal(await (await createSecret("text")).unprotectText(), "text");
  deepStrictEqual(
    await (await createSecret(new Uint8Array([1, 2]))).unprotect(),
    new Uint8Array([1, 2]),
  );
});

test("secrets::Secret encrypts text and masks normal output", async () => {
  const secret = await Secret.fromText("api-token");

  equal(String(secret), "*******");
  equal(JSON.stringify({ secret }), '{"secret":"*******"}');
  equal(inspect(secret), "*******");
  equal(await secret.unprotectText(), "api-token");
});

test("secrets::Secret supports caller-managed keys", async () => {
  const key = SecretKey.generate();
  const restored = SecretKey.importRaw(key.exportRaw());
  const secret = await Secret.fromBytes(new Uint8Array([1, 2, 3]), { key: restored });

  deepStrictEqual(await secret.unprotect(), new Uint8Array([1, 2, 3]));
  key.destroy();
  restored.destroy();
  await rejects(secret.unprotect(), /destroyed/);
});

test("secrets::Secret clears callback buffers and prevents use after destruction", async () => {
  const secret = await Secret.fromText("temporary");
  let temporary: Uint8Array | undefined;

  await secret.withBytes((value) => {
    temporary = value;
  });
  deepStrictEqual(temporary, new Uint8Array("temporary".length));
  secret.destroy();
  await rejects(secret.unprotect(), /destroyed/);
});
