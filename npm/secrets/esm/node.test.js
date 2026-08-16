import { deepStrictEqual, equal, throws } from "node:assert/strict";
import { test } from "node:test";
import { createSecret, decryptChunks, encryptChunks, Secret, SecretKey } from "./node.js";
test("secrets::node createSecret uses the opaque process-local key", () => {
    equal(createSecret("node-text").unprotectText(), "node-text");
});
test("secrets::node Secret provides synchronous protection", () => {
    const secret = Secret.fromText("node-token");
    equal(String(secret), "*******");
    equal(secret.unprotectText(), "node-token");
    secret.destroy();
    throws(() => secret.unprotect(), /destroyed/);
});
test("secrets::node chunk helpers stream synchronously", () => {
    const key = SecretKey.generate();
    const encrypted = [...encryptChunks([new Uint8Array([1, 2]), new Uint8Array([3])], { key })];
    const decrypted = [...decryptChunks(encrypted, { key })];
    deepStrictEqual(decrypted, [new Uint8Array([1, 2]), new Uint8Array([3])]);
});
