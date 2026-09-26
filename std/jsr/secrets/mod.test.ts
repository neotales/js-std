import { deepStrictEqual } from "node:assert/strict";
import { test } from "node:test";
import * as secrets from "./mod.ts";

test("secrets::mod exports the public API", () => {
  deepStrictEqual(Object.keys(secrets).sort(), [
    "DefaultSecretGenerator",
    "DefaultSecretMasker",
    "Secret",
    "SecretKey",
    "createSecret",
    "decryptStream",
    "encryptStream",
    "generateSecret",
    "secretGenerator",
    "secretMasker",
    "validate",
  ]);
});
