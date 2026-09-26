export declare function toPathString(pathUrl: string | URL): string;
/**
 * True if the runtime is Deno, false otherwise.
 */
export declare const isDeno: boolean;
/**
 * @returns The Node.js `fs` module.
 */
export declare function getNodeFs(): any;
/**
 * @returns The Node.js `os` module.
 */
export declare function getNodeOs(): any;
/**
 * @returns The Node.js `path` module.
 */
export declare function getNodePath(): any;
/**
 * @returns The Node.js `process` module.
 */
export declare function getNodeProcess(): any;
/**
 * @returns The Node.js `stream` module.
 */
export declare function getNodeStream(): any;
/**
 * @returns The Node.js `tty` module.
 */
export declare function getNodeTty(): any;
/**
 * @returns The Node.js `util` module.
 */
export declare function getNodeUtil(): any;
/** @returns The Node.js cryptography module. */
export declare function getNodeCrypto(): any;
/**
 * Used for naming temporary files. See {@linkcode makeTempFile} and
 * {@linkcode makeTempFileSync}.
 * @returns A randomized 6-digit hexadecimal string.
 */
export declare function randomId(): string;
