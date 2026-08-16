/**
 * String masking utilities for secrets that may appear in logs or output.
 *
 * @module
 */

import { isNullOrSpace } from "@neotales/strings/is-space";

const MASK = "*******";

function normalizePattern(pattern: RegExp): RegExp {
  return new RegExp(
    pattern.source,
    pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
  );
}

/** A collection of values and patterns that can mask a string. */
export interface SecretMasker {
  add(value: string | RegExp | null | undefined): this;
  addGenerator(generator: (secret: string) => string): this;
  mask(value: string | null): string | null;
}

/** Masks registered strings and regular expressions with `*******`. */
export class DefaultSecretMasker implements SecretMasker {
  #strings: string[] = [];
  #patterns: RegExp[] = [];
  #generators: Array<(secret: string) => string> = [];

  add(value: string | RegExp | null | undefined): this {
    if (value === null || value === undefined) return this;

    if (typeof value === "string") {
      if (isNullOrSpace(value)) return this;
      const secret = value.trim();
      this.addString(secret);
      for (const generator of this.#generators) this.addString(generator(secret));
      return this;
    }

    const pattern = normalizePattern(value);
    if (
      !this.#patterns.some(
        (known) => known.source === pattern.source && known.flags === pattern.flags,
      )
    ) {
      this.#patterns.push(pattern);
    }
    return this;
  }

  addGenerator(generator: (secret: string) => string): this {
    this.#generators.push(generator);
    for (const secret of [...this.#strings]) this.addString(generator(secret));
    return this;
  }

  mask(value: string | null): string | null {
    if (value === null) return null;

    let result = value;
    for (const secret of [...this.#strings].sort((left, right) => right.length - left.length)) {
      result = result.replaceAll(secret, MASK);
    }
    for (const pattern of this.#patterns) {
      result = result.replaceAll(pattern, MASK);
    }
    return result;
  }

  addString(secret: string): void {
    if (secret && !this.#strings.includes(secret)) this.#strings.push(secret);
  }
}

/** A process-wide masker for application log/output integration. */
export const secretMasker: DefaultSecretMasker = new DefaultSecretMasker();
