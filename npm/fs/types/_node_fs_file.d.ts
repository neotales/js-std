import type { FileInfo, FsFile, SetRawOptions } from "./types.js";
/**
 * The internal class to convert a Node file descriptor into a FsFile object.
 */
export declare class NodeFsFile implements FsFile {
    #private;
    constructor(fd: number);
    get readable(): ReadableStream<Uint8Array>;
    get writable(): WritableStream<Uint8Array>;
    [Symbol.dispose](): void;
    close(): void;
    isTerminal(): boolean;
    lock(_exclusive?: boolean): Promise<void>;
    lockSync(_exclusive?: boolean): void;
    read(p: Uint8Array): Promise<number | null>;
    readSync(p: Uint8Array): number | null;
    setRaw(_mode: boolean, _options?: SetRawOptions): void;
    stat(): Promise<FileInfo>;
    statSync(): FileInfo;
    sync(): Promise<void>;
    syncSync(): void;
    syncData(): Promise<void>;
    syncDataSync(): void;
    truncate(len?: number): Promise<void>;
    truncateSync(len?: number): void;
    unlock(): Promise<void>;
    unlockSync(): void;
    utime(atime: number | Date, mtime: number | Date): Promise<void>;
    utimeSync(atime: number | Date, mtime: number | Date): void;
    write(p: Uint8Array): Promise<number>;
    writeSync(p: Uint8Array): number;
}
