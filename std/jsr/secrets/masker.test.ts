import { equal } from "node:assert/strict";
import { test } from "node:test";
import { DefaultSecretMasker } from "./masker.ts";

test("secrets::DefaultSecretMasker masks strings, variants, and all occurrences", () => {
  const masker = new DefaultSecretMasker()
    .addGenerator((secret) => secret.toUpperCase())
    .add(" token ");

  equal(masker.mask("token TOKEN token"), "******* ******* *******");
  equal(masker.mask(null), null);
});

test("secrets::DefaultSecretMasker applies new generators to registered strings", () => {
  const masker = new DefaultSecretMasker()
    .add("secret")
    .addGenerator((secret) => secret.toUpperCase());

  equal(masker.mask("secret SECRET"), "******* *******");
});

test("secrets::DefaultSecretMasker masks non-global patterns", () => {
  const masker = new DefaultSecretMasker().add(/token=\w+/i);

  equal(masker.mask("token=one TOKEN=two"), "******* *******");
});

test("secrets::DefaultSecretMasker masks longer overlapping secrets first", () => {
  const masker = new DefaultSecretMasker().add("secret").add("supersecret");

  equal(masker.mask("supersecret secret"), "******* *******");
});

test("secrets::DefaultSecretMasker ignores blank values", () => {
  const masker = new DefaultSecretMasker().add(null).add(undefined).add(" \t ");

  equal(masker.mask("unchanged"), "unchanged");
});
