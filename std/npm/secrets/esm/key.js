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
var _SecretKey_bytes, _SecretKey_destroyed;
const KEY_LENGTH = 32;
const keyBytes = Symbol("secret key bytes");
function randomBytes(length) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
}
/** A caller-owned AES-256-GCM key for protecting secrets and streams. */
export class SecretKey {
    constructor(bytes) {
        _SecretKey_bytes.set(this, void 0);
        _SecretKey_destroyed.set(this, false);
        __classPrivateFieldSet(this, _SecretKey_bytes, bytes, "f");
    }
    /** Generates a new random 256-bit AES key. */
    static generate() {
        return new SecretKey(randomBytes(KEY_LENGTH));
    }
    /** Imports a copy of a 256-bit AES key. */
    static importRaw(value) {
        if (value.length !== KEY_LENGTH)
            throw new RangeError("AES-256-GCM keys must contain 32 bytes");
        return new SecretKey(value.slice());
    }
    /**
     * Returns a copy of this key's raw bytes for caller-managed persistence.
     * Treat the returned bytes as sensitive and clear them after use.
     */
    exportRaw() {
        return this[keyBytes]().slice();
    }
    /** Clears this key from this object's writable buffer. */
    destroy() {
        __classPrivateFieldGet(this, _SecretKey_bytes, "f").fill(0);
        __classPrivateFieldSet(this, _SecretKey_destroyed, true, "f");
    }
    [(_SecretKey_bytes = new WeakMap(), _SecretKey_destroyed = new WeakMap(), keyBytes)]() {
        if (__classPrivateFieldGet(this, _SecretKey_destroyed, "f"))
            throw new Error("Secret key has been destroyed");
        return __classPrivateFieldGet(this, _SecretKey_bytes, "f");
    }
}
let defaultKey;
/** @internal */
export function getDefaultKey() {
    defaultKey ??= SecretKey.generate();
    return defaultKey;
}
/** @internal */
export function getKeyBytes(key) {
    return key[keyBytes]();
}
