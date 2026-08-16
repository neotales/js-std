/**
 * Synchronous Node.js, Deno, and Bun AES-256-GCM APIs.
 *
 * This subpath uses `node:crypto` and is not available in browsers. Import the
 * root package for the portable asynchronous APIs.
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
var _Secret_ciphertext, _Secret_iv, _Secret_key, _Secret_destroyed;
import { createCipheriv, createDecipheriv } from "node:crypto";
import { concatBytes, randomIv, TAG_LENGTH } from "./aead.js";
import { getDefaultKey, getKeyBytes, SecretKey } from "./key.js";
const MASK = "*******";
const inspect = Symbol.for("nodejs.util.inspect.custom");
const MAGIC = new Uint8Array([0x4e, 0x54, 0x53, 0x31]);
const HEADER_LENGTH = 12;
const FRAME_HEADER_LENGTH = 4;
const FINAL_FRAME = 0;
const MAX_PLAINTEXT_LENGTH = 64 * 1024;
const MAX_CIPHERTEXT_LENGTH = MAX_PLAINTEXT_LENGTH + TAG_LENGTH;
export { SecretKey };
function encrypt(value, key, iv, additionalData) {
    const cipher = createCipheriv("aes-256-gcm", getKeyBytes(key), iv);
    if (additionalData)
        cipher.setAAD(additionalData);
    return concatBytes(cipher.update(value), cipher.final(), cipher.getAuthTag());
}
function decrypt(value, key, iv, additionalData) {
    if (value.length < TAG_LENGTH)
        throw new Error("Encrypted value is missing an authentication tag");
    const decipher = createDecipheriv("aes-256-gcm", getKeyBytes(key), iv);
    if (additionalData)
        decipher.setAAD(additionalData);
    decipher.setAuthTag(value.subarray(-TAG_LENGTH));
    return concatBytes(decipher.update(value.subarray(0, -TAG_LENGTH)), decipher.final());
}
/** A synchronous encrypted in-memory value for Node.js, Deno, and Bun. */
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
    static fromText(value, options = {}) {
        return Secret.fromBytes(new TextEncoder().encode(value), options);
    }
    static fromBytes(value, options = {}) {
        const key = options.key ?? getDefaultKey();
        const iv = randomIv();
        return new Secret(encrypt(value, key, iv), iv, key);
    }
    unprotect() {
        this.assertLive();
        return decrypt(__classPrivateFieldGet(this, _Secret_ciphertext, "f"), __classPrivateFieldGet(this, _Secret_key, "f"), __classPrivateFieldGet(this, _Secret_iv, "f"));
    }
    unprotectText() {
        return new TextDecoder().decode(this.unprotect());
    }
    withBytes(callback) {
        const value = this.unprotect();
        try {
            return callback(value);
        }
        finally {
            value.fill(0);
        }
    }
    withText(callback) {
        return callback(this.unprotectText());
    }
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
/** Encrypts text or bytes with the opaque process-local key. */
export function createSecret(value) {
    return typeof value === "string" ? Secret.fromText(value) : Secret.fromBytes(value);
}
function uint32(value) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value);
    return bytes;
}
function readUint32(value) {
    return new DataView(value.buffer, value.byteOffset, 4).getUint32(0);
}
function equalBytes(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index]);
}
function frameAdditionalData(index, final) {
    return new Uint8Array([final ? 1 : 0, ...uint32(index)]);
}
function streamIv(prefix, index) {
    return concatBytes(prefix, uint32(index));
}
function randomPrefix() {
    const prefix = new Uint8Array(8);
    crypto.getRandomValues(prefix);
    return prefix;
}
/**
 * Encrypts an iterable of chunks with framed AES-256-GCM. Each yielded buffer
 * can be written immediately; the final frame detects stream truncation.
 */
export function* encryptChunks(chunks, options = {}) {
    const key = options.key ?? getDefaultKey();
    const prefix = randomPrefix();
    let index = 0;
    function encryptFrame(value, final) {
        if (index === 0xffffffff)
            throw new RangeError("Encrypted stream contains too many frames");
        const ciphertext = encrypt(value, key, streamIv(prefix, index), frameAdditionalData(index, final));
        index++;
        return concatBytes(uint32(final ? FINAL_FRAME : ciphertext.length), ciphertext);
    }
    yield concatBytes(MAGIC, prefix);
    for (const chunk of chunks) {
        for (let offset = 0; offset < chunk.length; offset += MAX_PLAINTEXT_LENGTH) {
            yield encryptFrame(chunk.subarray(offset, offset + MAX_PLAINTEXT_LENGTH), false);
        }
    }
    yield encryptFrame(new Uint8Array(), true);
}
/** Decrypts framed data from `encryptChunks`, verifying every frame and the final marker. */
export function* decryptChunks(chunks, options = {}) {
    const key = options.key ?? getDefaultKey();
    let buffered = new Uint8Array();
    let prefix;
    let index = 0;
    let finished = false;
    for (const chunk of chunks) {
        buffered = concatBytes(buffered, chunk);
        if (!prefix && buffered.length >= HEADER_LENGTH) {
            const header = buffered.subarray(0, HEADER_LENGTH);
            if (!equalBytes(header.subarray(0, MAGIC.length), MAGIC))
                throw new Error("Invalid encrypted stream header");
            prefix = header.subarray(MAGIC.length).slice();
            buffered = buffered.subarray(HEADER_LENGTH);
        }
        if (!prefix)
            continue;
        while (buffered.length >= FRAME_HEADER_LENGTH) {
            if (finished)
                throw new Error("Encrypted stream contains data after its final frame");
            const length = readUint32(buffered);
            const final = length === FINAL_FRAME;
            const ciphertextLength = final ? TAG_LENGTH : length;
            if (!final && (ciphertextLength <= TAG_LENGTH || ciphertextLength > MAX_CIPHERTEXT_LENGTH)) {
                throw new Error("Invalid encrypted stream frame length");
            }
            if (buffered.length < FRAME_HEADER_LENGTH + ciphertextLength)
                break;
            const ciphertext = buffered.subarray(FRAME_HEADER_LENGTH, FRAME_HEADER_LENGTH + ciphertextLength);
            const plaintext = decrypt(ciphertext, key, streamIv(prefix, index), frameAdditionalData(index, final));
            index++;
            buffered = buffered.subarray(FRAME_HEADER_LENGTH + ciphertextLength);
            if (final)
                finished = true;
            else
                yield plaintext;
        }
    }
    if (!prefix || !finished || buffered.length)
        throw new Error("Truncated encrypted stream");
}
