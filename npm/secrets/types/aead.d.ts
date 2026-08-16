import { type SecretKey } from "./key.js";
export declare const IV_LENGTH = 12;
export declare const TAG_LENGTH = 16;
export declare function encrypt(value: Uint8Array, key: SecretKey, iv: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array>;
export declare function decrypt(value: Uint8Array, key: SecretKey, iv: Uint8Array, additionalData?: Uint8Array): Promise<Uint8Array>;
export declare function randomIv(): Uint8Array;
export declare function concatBytes(...parts: Uint8Array[]): Uint8Array<ArrayBuffer>;
