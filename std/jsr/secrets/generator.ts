/**
 * Cryptographically secure secret generation utilities.
 *
 * @module
 */

import { isDigit } from "@neotales/chars/is-digit";
import { isLetter } from "@neotales/chars/is-letter";
import { isUpper } from "@neotales/chars/is-upper";

const DEFAULT_CHARACTERS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-#@~*:{}";
const SAFE_SPECIAL_CHARACTERS = "_-#@~*:{}|/;";
const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;':\",.<>?/";
const MAX_ATTEMPTS = 5_000;

function assertLength(length: number): void {
  if (!Number.isSafeInteger(length) || length <= 0) {
    throw new RangeError("Secret length must be a positive safe integer");
  }
}

function randomIndex(length: number): number {
  const range = 256 - (256 % length);
  const bytes = new Uint8Array(1);

  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0]! >= range);

  return bytes[0]! % length;
}

/**
 * Returns whether bytes contain an uppercase letter, lowercase letter, digit,
 * and special character. This is the default password validator.
 */
export function validate(data: Uint8Array): boolean {
  let hasDigit = false;
  let hasUpper = false;
  let hasLower = false;
  let hasSpecial = false;

  for (const code of data) {
    if (isLetter(code)) {
      if (isUpper(code)) hasUpper = true;
      else hasLower = true;
    } else if (isDigit(code)) {
      hasDigit = true;
    } else {
      hasSpecial = true;
    }
  }

  return hasDigit && hasUpper && hasLower && hasSpecial;
}

/** A configurable source of cryptographically secure secrets. */
export interface SecretGenerator {
  setValidator(validator: (value: Uint8Array) => boolean): this;
  add(value: string): this;
  generate(length: number): string;
  generateAsUint8Array(length: number): Uint8Array;
}

/**
 * Generates secrets from a configurable single-byte character pool.
 *
 * `generateAsUint8Array` permits callers to clear the generated buffer when it
 * is no longer needed. Passwords remain immutable once converted to strings.
 */
export class DefaultSecretGenerator implements SecretGenerator {
  #codes: number[] = [];
  #validator: (value: Uint8Array) => boolean = validate;

  setValidator(validator: (value: Uint8Array) => boolean): this {
    this.#validator = validator;
    return this;
  }

  addDefaults(): this {
    return this.add(DEFAULT_CHARACTERS);
  }

  addDigits(): this {
    return this.add("0123456789");
  }

  addLower(): this {
    return this.add("abcdefghijklmnopqrstuvwxyz");
  }

  addUpper(): this {
    return this.add("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
  }

  addSpecial(): this {
    return this.add(SPECIAL_CHARACTERS);
  }

  addSpecialSafe(): this {
    return this.add(SAFE_SPECIAL_CHARACTERS);
  }

  add(value: string): this {
    for (const character of value) {
      const code = character.codePointAt(0)!;
      if (code > 255) {
        throw new RangeError("Secret characters must fit in a single byte");
      }
      if (!this.#codes.includes(code)) this.#codes.push(code);
    }
    return this;
  }

  generateAsUint8Array(length: number): Uint8Array {
    assertLength(length);
    if (this.#codes.length === 0) {
      throw new Error("Cannot generate a secret without characters");
    }

    const secret = new Uint8Array(length);
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      for (let index = 0; index < length; index++) {
        secret[index] = this.#codes[randomIndex(this.#codes.length)]!;
      }
      if (this.#validator(secret)) return secret;
    }

    secret.fill(0);
    throw new Error("Failed to generate a secret accepted by its validator");
  }

  generate(length: number): string {
    return String.fromCodePoint(...this.generateAsUint8Array(length));
  }
}

/** Generates a secret using the default character set or a supplied pool. */
export function generateSecret(length: number, characters?: string): string {
  const generator = new DefaultSecretGenerator();
  generator.add(characters || DEFAULT_CHARACTERS);
  return generator.generate(length);
}

/** A preconfigured generator using the default character pool. */
export const secretGenerator: DefaultSecretGenerator = new DefaultSecretGenerator().addDefaults();
