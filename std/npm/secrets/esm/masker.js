/**
 * String masking utilities for secrets that may appear in logs or output.
 *
 * @module
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DefaultSecretMasker_strings, _DefaultSecretMasker_patterns, _DefaultSecretMasker_generators;
import { isNullOrSpace } from "@neotales/strings/is-space";
const MASK = "*******";
function normalizePattern(pattern) {
    return new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
}
/** Masks registered strings and regular expressions with `*******`. */
export class DefaultSecretMasker {
    constructor() {
        _DefaultSecretMasker_strings.set(this, []);
        _DefaultSecretMasker_patterns.set(this, []);
        _DefaultSecretMasker_generators.set(this, []);
    }
    add(value) {
        if (value === null || value === undefined)
            return this;
        if (typeof value === "string") {
            if (isNullOrSpace(value))
                return this;
            const secret = value.trim();
            this.addString(secret);
            for (const generator of __classPrivateFieldGet(this, _DefaultSecretMasker_generators, "f"))
                this.addString(generator(secret));
            return this;
        }
        const pattern = normalizePattern(value);
        if (!__classPrivateFieldGet(this, _DefaultSecretMasker_patterns, "f").some((known) => known.source === pattern.source && known.flags === pattern.flags)) {
            __classPrivateFieldGet(this, _DefaultSecretMasker_patterns, "f").push(pattern);
        }
        return this;
    }
    addGenerator(generator) {
        __classPrivateFieldGet(this, _DefaultSecretMasker_generators, "f").push(generator);
        for (const secret of [...__classPrivateFieldGet(this, _DefaultSecretMasker_strings, "f")])
            this.addString(generator(secret));
        return this;
    }
    mask(value) {
        if (value === null)
            return null;
        let result = value;
        for (const secret of [...__classPrivateFieldGet(this, _DefaultSecretMasker_strings, "f")].sort((left, right) => right.length - left.length)) {
            result = result.replaceAll(secret, MASK);
        }
        for (const pattern of __classPrivateFieldGet(this, _DefaultSecretMasker_patterns, "f")) {
            result = result.replaceAll(pattern, MASK);
        }
        return result;
    }
    addString(secret) {
        if (secret && !__classPrivateFieldGet(this, _DefaultSecretMasker_strings, "f").includes(secret))
            __classPrivateFieldGet(this, _DefaultSecretMasker_strings, "f").push(secret);
    }
}
_DefaultSecretMasker_strings = new WeakMap(), _DefaultSecretMasker_patterns = new WeakMap(), _DefaultSecretMasker_generators = new WeakMap();
/** A process-wide masker for application log/output integration. */
export const secretMasker = new DefaultSecretMasker();
