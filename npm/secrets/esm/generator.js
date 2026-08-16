/**
 * Cryptographically secure secret generation utilities.
 *
 * @module
 */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DefaultSecretGenerator_codes, _DefaultSecretGenerator_validator;
import { isDigit } from "@neotales/chars/is-digit";
import { isLetter } from "@neotales/chars/is-letter";
import { isUpper } from "@neotales/chars/is-upper";
const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-#@~*:{}";
const SAFE_SPECIAL_CHARACTERS = "_-#@~*:{}|/;";
const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;':\",.<>?/";
const MAX_ATTEMPTS = 5_000;
function assertLength(length) {
    if (!Number.isSafeInteger(length) || length <= 0) {
        throw new RangeError("Secret length must be a positive safe integer");
    }
}
function randomIndex(length) {
    const range = 256 - (256 % length);
    const bytes = new Uint8Array(1);
    do {
        crypto.getRandomValues(bytes);
    } while (bytes[0] >= range);
    return bytes[0] % length;
}
/**
 * Returns whether bytes contain an uppercase letter, lowercase letter, digit,
 * and special character. This is the default password validator.
 */
export function validate(data) {
    let hasDigit = false;
    let hasUpper = false;
    let hasLower = false;
    let hasSpecial = false;
    for (const code of data) {
        if (isLetter(code)) {
            if (isUpper(code))
                hasUpper = true;
            else
                hasLower = true;
        }
        else if (isDigit(code)) {
            hasDigit = true;
        }
        else {
            hasSpecial = true;
        }
    }
    return hasDigit && hasUpper && hasLower && hasSpecial;
}
/**
 * Generates secrets from a configurable single-byte character pool.
 *
 * `generateAsUint8Array` permits callers to clear the generated buffer when it
 * is no longer needed. Passwords remain immutable once converted to strings.
 */
export class DefaultSecretGenerator {
    constructor() {
        _DefaultSecretGenerator_codes.set(this, []);
        _DefaultSecretGenerator_validator.set(this, validate);
    }
    setValidator(validator) {
        __classPrivateFieldSet(this, _DefaultSecretGenerator_validator, validator, "f");
        return this;
    }
    addDefaults() {
        return this.add(DEFAULT_CHARACTERS);
    }
    addDigits() {
        return this.add("0123456789");
    }
    addLower() {
        return this.add("abcdefghijklmnopqrstuvwxyz");
    }
    addUpper() {
        return this.add("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    addSpecial() {
        return this.add(SPECIAL_CHARACTERS);
    }
    addSpecialSafe() {
        return this.add(SAFE_SPECIAL_CHARACTERS);
    }
    add(value) {
        for (const character of value) {
            const code = character.codePointAt(0);
            if (code > 255) {
                throw new RangeError("Secret characters must fit in a single byte");
            }
            if (!__classPrivateFieldGet(this, _DefaultSecretGenerator_codes, "f").includes(code))
                __classPrivateFieldGet(this, _DefaultSecretGenerator_codes, "f").push(code);
        }
        return this;
    }
    generateAsUint8Array(length) {
        assertLength(length);
        if (__classPrivateFieldGet(this, _DefaultSecretGenerator_codes, "f").length === 0) {
            throw new Error("Cannot generate a secret without characters");
        }
        const secret = new Uint8Array(length);
        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            for (let index = 0; index < length; index++) {
                secret[index] = __classPrivateFieldGet(this, _DefaultSecretGenerator_codes, "f")[randomIndex(__classPrivateFieldGet(this, _DefaultSecretGenerator_codes, "f").length)];
            }
            if (__classPrivateFieldGet(this, _DefaultSecretGenerator_validator, "f").call(this, secret))
                return secret;
        }
        secret.fill(0);
        throw new Error("Failed to generate a secret accepted by its validator");
    }
    generate(length) {
        return String.fromCodePoint(...this.generateAsUint8Array(length));
    }
}
_DefaultSecretGenerator_codes = new WeakMap(), _DefaultSecretGenerator_validator = new WeakMap();
/** Generates a secret using the default character set or a supplied pool. */
export function generateSecret(length, characters) {
    const generator = new DefaultSecretGenerator();
    generator.add(characters || DEFAULT_CHARACTERS);
    return generator.generate(length);
}
/** A preconfigured generator using the default character pool. */
export const secretGenerator = new DefaultSecretGenerator().addDefaults();
