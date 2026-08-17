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
var _NodeFsFile_nodeFs, _NodeFsFile_nodeStream, _NodeFsFile_nodeTty, _NodeFsFile_nodeUtil, _NodeFsFile_nodeReadFd, _NodeFsFile_nodeWriteFd, _NodeFsFile_closed, _NodeFsFile_rid, _NodeFsFile_readableStream, _NodeFsFile_writableStream;
import { getNodeFs, getNodeStream, getNodeTty, getNodeUtil } from "./_utils.js";
import { mapError } from "./_map_error.js";
import { toFileInfo } from "./_to_file_info.js";
/**
 * The internal class to convert a Node file descriptor into a FsFile object.
 */
export class NodeFsFile {
    constructor(fd) {
        _NodeFsFile_nodeFs.set(this, getNodeFs());
        _NodeFsFile_nodeStream.set(this, getNodeStream());
        _NodeFsFile_nodeTty.set(this, getNodeTty());
        _NodeFsFile_nodeUtil.set(this, getNodeUtil());
        _NodeFsFile_nodeReadFd.set(this, __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").read));
        _NodeFsFile_nodeWriteFd.set(this, __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").write));
        _NodeFsFile_closed.set(this, void 0);
        _NodeFsFile_rid.set(this, void 0);
        _NodeFsFile_readableStream.set(this, void 0);
        _NodeFsFile_writableStream.set(this, void 0);
        __classPrivateFieldSet(this, _NodeFsFile_rid, fd, "f");
        __classPrivateFieldSet(this, _NodeFsFile_closed, false, "f");
    }
    get readable() {
        if (__classPrivateFieldGet(this, _NodeFsFile_readableStream, "f") == null) {
            const readStream = __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").createReadStream(null, {
                fd: __classPrivateFieldGet(this, _NodeFsFile_rid, "f"),
                autoClose: false,
            });
            __classPrivateFieldSet(this, _NodeFsFile_readableStream, __classPrivateFieldGet(this, _NodeFsFile_nodeStream, "f").Readable.toWeb(readStream), "f");
        }
        return __classPrivateFieldGet(this, _NodeFsFile_readableStream, "f");
    }
    get writable() {
        if (__classPrivateFieldGet(this, _NodeFsFile_writableStream, "f") == null) {
            const writeStream = __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").createWriteStream(null, {
                fd: __classPrivateFieldGet(this, _NodeFsFile_rid, "f"),
                autoClose: false,
            });
            __classPrivateFieldSet(this, _NodeFsFile_writableStream, __classPrivateFieldGet(this, _NodeFsFile_nodeStream, "f").Writable.toWeb(writeStream), "f");
        }
        return __classPrivateFieldGet(this, _NodeFsFile_writableStream, "f");
    }
    [(_NodeFsFile_nodeFs = new WeakMap(), _NodeFsFile_nodeStream = new WeakMap(), _NodeFsFile_nodeTty = new WeakMap(), _NodeFsFile_nodeUtil = new WeakMap(), _NodeFsFile_nodeReadFd = new WeakMap(), _NodeFsFile_nodeWriteFd = new WeakMap(), _NodeFsFile_closed = new WeakMap(), _NodeFsFile_rid = new WeakMap(), _NodeFsFile_readableStream = new WeakMap(), _NodeFsFile_writableStream = new WeakMap(), Symbol.dispose)]() {
        if (!__classPrivateFieldGet(this, _NodeFsFile_closed, "f")) {
            this.close();
        }
    }
    close() {
        __classPrivateFieldSet(this, _NodeFsFile_closed, true, "f");
        __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").closeSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
    }
    isTerminal() {
        return __classPrivateFieldGet(this, _NodeFsFile_nodeTty, "f").isatty(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
    }
    // deno-lint-ignore require-await
    async lock(_exclusive) {
        throw new Error("Method not implemented");
    }
    lockSync(_exclusive) {
        throw new Error("Method not implemented");
    }
    async read(p) {
        try {
            const { bytesRead } = await __classPrivateFieldGet(this, _NodeFsFile_nodeReadFd, "f").call(this, __classPrivateFieldGet(this, _NodeFsFile_rid, "f"), p, 0, p.length, null);
            return bytesRead === 0 ? null : bytesRead;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    readSync(p) {
        try {
            const bytesRead = __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").readSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), p);
            return bytesRead === 0 ? null : bytesRead;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    setRaw(_mode, _options) {
        throw new Error("Method not implemented");
    }
    async stat() {
        const nodeStatFd = __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fstat);
        try {
            const fdStat = await nodeStatFd(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
            return toFileInfo(fdStat);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    statSync() {
        try {
            const fdStat = __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fstatSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
            return toFileInfo(fdStat);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async sync() {
        const nodeFsyncFd = __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fsync);
        try {
            await nodeFsyncFd(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
        }
        catch (error) {
            throw mapError(error);
        }
    }
    syncSync() {
        try {
            __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fsyncSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async syncData() {
        const nodeFdatasyncFd = __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fdatasync);
        try {
            await nodeFdatasyncFd(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
        }
        catch (error) {
            throw mapError(error);
        }
    }
    syncDataSync() {
        try {
            __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").fdatasyncSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"));
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async truncate(len) {
        const nodeTruncateFd = __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").ftruncate);
        try {
            await nodeTruncateFd(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), len);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    truncateSync(len) {
        try {
            __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").ftruncateSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), len);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    // deno-lint-ignore require-await
    async unlock() {
        throw new Error("Method not implemented");
    }
    unlockSync() {
        throw new Error("Method not implemented");
    }
    async utime(atime, mtime) {
        const nodeUtimeFd = __classPrivateFieldGet(this, _NodeFsFile_nodeUtil, "f").promisify(__classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").futimes);
        try {
            await nodeUtimeFd(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), atime, mtime);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    utimeSync(atime, mtime) {
        try {
            __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").futimesSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), atime, mtime);
        }
        catch (error) {
            throw mapError(error);
        }
    }
    async write(p) {
        try {
            const { bytesWritten } = await __classPrivateFieldGet(this, _NodeFsFile_nodeWriteFd, "f").call(this, __classPrivateFieldGet(this, _NodeFsFile_rid, "f"), p);
            return bytesWritten;
        }
        catch (error) {
            throw mapError(error);
        }
    }
    writeSync(p) {
        try {
            return __classPrivateFieldGet(this, _NodeFsFile_nodeFs, "f").writeSync(__classPrivateFieldGet(this, _NodeFsFile_rid, "f"), p);
        }
        catch (error) {
            throw mapError(error);
        }
    }
}
