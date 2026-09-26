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
var _Secret_ciphertext, _Secret_iv, _Secret_key, _Secret_destroyed;
import { decrypt, encrypt, randomIv } from "./aead.js";
import { getDefaultKey } from "./key.js";
const MASK = "*******";
const inspect = Symbol.for("nodejs.util.inspect.custom");
/**
 * An encrypted in-memory value that masks itself in normal string, JSON, and
 * Node inspector output. Create instances with `fromText` or `fromBytes`.
 */
export class Secret {
    constructor(ciphertext, iv, key) {
        _Secret_ciphertext.set(this, void 0);
        _Secret_iv.set(this, void 0);
        _Secret_key.set(this, void 0);
        _Secret_destroyed.set(this, false);
        __classPrivateFieldSet(this, _Secret_ciphertext, ciphertext, "f");
        __classPrivateFieldSet(this, _Secret_iv, iv, "f");
        __classPrivateFieldSet(this, _Secret_key, key, "f");
    }
    /** Encrypts a UTF-8 string. Browser calls are asynchronous because of Web Crypto. */
    static async fromText(value, options = {}) {
        return await Secret.fromBytes(new TextEncoder().encode(value), options);
    }
    /** Encrypts a copy of binary data. Browser calls are asynchronous because of Web Crypto. */
    static async fromBytes(value, options = {}) {
        const key = options.key ?? getDefaultKey();
        const iv = randomIv();
        const ciphertext = await encrypt(value, key, iv);
        return new Secret(ciphertext, iv, key);
    }
    /** Decrypts and returns a new mutable byte buffer. */
    async unprotect() {
        this.assertLive();
        return await decrypt(__classPrivateFieldGet(this, _Secret_ciphertext, "f"), __classPrivateFieldGet(this, _Secret_key, "f"), __classPrivateFieldGet(this, _Secret_iv, "f"));
    }
    /** Decrypts and decodes the value as UTF-8 text. Returned strings cannot be cleared. */
    async unprotectText() {
        return new TextDecoder().decode(await this.unprotect());
    }
    /** Runs a callback with decrypted bytes, then clears that temporary buffer. */
    async withBytes(callback) {
        const value = await this.unprotect();
        try {
            return await callback(value);
        }
        finally {
            value.fill(0);
        }
    }
    /** Runs a callback with decrypted text. The runtime cannot clear the temporary string. */
    async withText(callback) {
        return await callback(await this.unprotectText());
    }
    /** Clears this object's writable encrypted buffers and prevents further access. */
    destroy() {
        __classPrivateFieldGet(this, _Secret_ciphertext, "f").fill(0);
        __classPrivateFieldGet(this, _Secret_iv, "f").fill(0);
        __classPrivateFieldSet(this, _Secret_destroyed, true, "f");
    }
    toString() {
        return MASK;
    }
    toJSON() {
        return MASK;
    }
    [(_Secret_ciphertext = new WeakMap(), _Secret_iv = new WeakMap(), _Secret_key = new WeakMap(), _Secret_destroyed = new WeakMap(), inspect)]() {
        return MASK;
    }
    assertLive() {
        if (__classPrivateFieldGet(this, _Secret_destroyed, "f"))
            throw new Error("Secret has been destroyed");
    }
}
/**
 * Encrypts text or bytes with the opaque process-local key. Browser calls are
 * asynchronous because of Web Crypto.
 */
export async function createSecret(value) {
    return typeof value === "string" ? await Secret.fromText(value) : await Secret.fromBytes(value);
}
