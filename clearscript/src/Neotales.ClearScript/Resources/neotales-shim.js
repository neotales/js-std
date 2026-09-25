// Neotales.ClearScript compatibility shim.
//
// This file is embedded in the Neotales.ClearScript assembly and executed before every
// bundle. It turns the .NET host objects into the globals that the Neotales modules and
// js-os modules probe for at runtime. It is plain ES2015 so the same source runs on
// engines without module or top-level-await support.

(function bootstrapNeotales() {
  "use strict";

  var system = globalThis.__neotalesSystem;
  if (!system) return;

  var envHost = globalThis.__neotalesEnvironment || null;
  var fsHost = globalThis.__neotalesFileSystem || null;
  var childHost = globalThis.__neotalesChildProcess || null;
  var cryptoHost = globalThis.__neotalesCrypto || null;
  var stdoutHost = globalThis.__neotalesStdout || null;
  var stderrHost = globalThis.__neotalesStderr || null;
  var hostArgs = globalThis.__neotalesConfig || [];

  // ---------------------------------------------------------------------------
  // base64
  // ---------------------------------------------------------------------------

  var BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function bytesToBase64(bytes) {
    var result = "";
    var length = bytes.length;
    for (var index = 0; index < length; index += 3) {
      var byte1 = bytes[index];
      var byte2 = index + 1 < length ? bytes[index + 1] : 0;
      var byte3 = index + 2 < length ? bytes[index + 2] : 0;
      result += BASE64[byte1 >> 2];
      result += BASE64[((byte1 & 0x03) << 4) | (byte2 >> 4)];
      result += index + 1 < length ? BASE64[((byte2 & 0x0f) << 2) | (byte3 >> 6)] : "=";
      result += index + 2 < length ? BASE64[byte3 & 0x3f] : "=";
    }
    return result;
  }

  // ClearScript exposes .NET arrays as host objects. Neotales modules expect real JavaScript
  // arrays, so every host array is copied into one.
  function toArray(hostArray) {
    var result = [];
    if (!hostArray) return result;
    var length = hostArray.Length !== undefined ? hostArray.Length : hostArray.length;
    for (var index = 0; index < length; index++) {
      result.push(hostArray[index]);
    }
    return result;
  }

  function base64ToBytes(text) {
    var clean = String(text).replace(/[\r\n\s]/g, "");
    var padding = 0;
    if (clean.charAt(clean.length - 1) === "=") padding += 1;
    if (clean.charAt(clean.length - 2) === "=") padding += 1;
    var size = ((clean.length * 3) >> 2) - padding;
    var bytes = new Uint8Array(size);
    var position = 0;
    for (var index = 0; index < clean.length; index += 4) {
      var value1 = BASE64.indexOf(clean.charAt(index));
      var value2 = BASE64.indexOf(clean.charAt(index + 1));
      var value3 = BASE64.indexOf(clean.charAt(index + 2));
      var value4 = BASE64.indexOf(clean.charAt(index + 3));
      if (position < size) bytes[position++] = (value1 << 2) | (value2 >> 4);
      if (position < size) bytes[position++] = ((value2 & 0x0f) << 4) | (value3 >> 2);
      if (position < size) bytes[position++] = ((value3 & 0x03) << 6) | (value4 & 0x3f);
    }
    return bytes;
  }

  // ---------------------------------------------------------------------------
  // encoding
  // ---------------------------------------------------------------------------

  function encodeUtf8(text) {
    var bytes = [];
    for (var index = 0; index < text.length; index++) {
      var code = text.charCodeAt(index);
      if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
        var next = text.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
          index += 1;
        }
      }
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f),
        );
      }
    }
    return new Uint8Array(bytes);
  }

  function decodeUtf8(bytes) {
    var result = "";
    var index = 0;
    while (index < bytes.length) {
      var byte1 = bytes[index++];
      var code;
      if (byte1 < 0x80) {
        code = byte1;
      } else if (byte1 < 0xe0) {
        code = ((byte1 & 0x1f) << 6) | (bytes[index++] & 0x3f);
      } else if (byte1 < 0xf0) {
        code = ((byte1 & 0x0f) << 12) | ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      } else {
        code = ((byte1 & 0x07) << 18) | ((bytes[index++] & 0x3f) << 12) |
          ((bytes[index++] & 0x3f) << 6) | (bytes[index++] & 0x3f);
      }
      if (code > 0xffff) {
        code -= 0x10000;
        result += String.fromCharCode(0xd800 + (code >> 10), 0xdc00 + (code & 0x3ff));
      } else {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }

  function decodeUtf16(bytes) {
    var result = "";
    for (var index = 0; index + 1 < bytes.length; index += 2) {
      result += String.fromCharCode(bytes[index] | (bytes[index + 1] << 8));
    }
    return result;
  }

  function installEncoding() {
    if (typeof globalThis.TextEncoder === "undefined") {
      globalThis.TextEncoder = function TextEncoder() {};
      globalThis.TextEncoder.prototype.encode = function (input) {
        return encodeUtf8(input === undefined ? "" : String(input));
      };
      globalThis.TextEncoder.prototype.encodeInto = function (input, target) {
        var bytes = encodeUtf8(input);
        var written = Math.min(bytes.length, target.length);
        target.set(bytes.subarray(0, written));
        return { read: input.length, written: written };
      };
    }

    if (typeof globalThis.TextDecoder === "undefined") {
      globalThis.TextDecoder = function TextDecoder(encoding) {
        this.encoding = String(encoding || "utf-8").toLowerCase();
      };
      globalThis.TextDecoder.prototype.decode = function (input) {
        if (input === undefined) return "";
        var bytes = input instanceof Uint8Array ? input : new Uint8Array(input.buffer || input);
        if (this.encoding === "utf-16le" || this.encoding === "utf16le") return decodeUtf16(bytes);
        return decodeUtf8(bytes);
      };
    }

    if (typeof globalThis.btoa === "undefined") {
      globalThis.btoa = function btoa(input) {
        return bytesToBase64(encodeUtf8(input === undefined ? "" : String(input)));
      };
    }

    if (typeof globalThis.atob === "undefined") {
      globalThis.atob = function atob(input) {
        return decodeUtf8(base64ToBytes(input));
      };
    }
  }

  // ---------------------------------------------------------------------------
  // console
  // ---------------------------------------------------------------------------

  function installConsole() {
    // ClearScript's built-in console is native and does not route to the host process streams,
    // so the shim installs writers backed by `Console.Out`/`Console.Error` and keeps the native
    // object reachable for methods the shim does not replace.
    var native = globalThis.console;
    if (native && native.__neotales) return;
    var write = function (stream, prefix) {
      return function () {
        var parts = [];
        for (var index = 0; index < arguments.length; index++) {
          parts.push(format(arguments[index]));
        }
        var text = prefix + parts.join(" ") + system.NewLine;
        if (stream) stream.Write(text);
      };
    };
    var shim = {
      __neotales: true,
      native: native,
      log: write(stdoutHost, ""),
      info: write(stdoutHost, ""),
      debug: write(stdoutHost, ""),
      warn: write(stderrHost, "warning: "),
      error: write(stderrHost, ""),
      trace: write(stderrHost, "trace: "),
      dir: write(stdoutHost, ""),
      table: write(stdoutHost, ""),
      group: write(stdoutHost, ""),
      groupCollapsed: write(stdoutHost, ""),
      groupEnd: function () {},
      time: function () {},
      timeEnd: function () {},
      timeLog: write(stdoutHost, ""),
      timeStamp: function () {},
      count: function () {},
      countReset: function () {},
      assert: function (condition) {
        if (condition) return;
        var message = "Assertion failed";
        for (var index = 1; index < arguments.length; index++) {
          message += " " + format(arguments[index]);
        }
        if (stderrHost) stderrHost.Write("Assertion failed: " + message + system.NewLine);
      },
    };
    if (native) {
      for (var key in native) {
        if (!(key in shim)) shim[key] = native[key];
      }
    }
    globalThis.console = shim;
  }

  function format(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || value.message;
    try {
      var json = JSON.stringify(value);
      return json === undefined ? String(value) : json;
    } catch (error) {
      return String(value);
    }
  }

  // ---------------------------------------------------------------------------
  // crypto
  // ---------------------------------------------------------------------------

  function installCrypto() {
    if (!cryptoHost) return;
    if (typeof globalThis.crypto === "undefined") globalThis.crypto = {};
    if (typeof globalThis.crypto.getRandomValues === "undefined") {
      globalThis.crypto.getRandomValues = function (target) {
        var bytes = base64ToBytes(cryptoHost.GetRandomValues(target.length));
        target.set(bytes.subarray(0, target.length));
        return target;
      };
    }
    if (typeof globalThis.crypto.randomUUID === "undefined") {
      globalThis.crypto.randomUUID = function () {
        return cryptoHost.RandomUuid();
      };
    }
    if (typeof globalThis.crypto.subtle === "undefined") {
      globalThis.crypto.subtle = {
        importKey: function (format, keyData, algorithm, extractable, usages) {
          return Promise.resolve(
            cryptoHost.ImportKey(format, bytesToBase64(rawPayload(keyData)), algorithm, usages),
          );
        },
        encrypt: function (parameters, key, data) {
          return Promise.resolve(
            base64ToBytes(
              cryptoHost.Encrypt(
                parameters.name,
                parameters.iv === undefined ? null : bytesToBase64(rawPayload(parameters.iv)),
                parameters.additionalData === undefined
                  ? null
                  : bytesToBase64(rawPayload(parameters.additionalData)),
                key,
                bytesToBase64(rawPayload(data)),
              ),
            ),
          );
        },
        decrypt: function (parameters, key, data) {
          return Promise.resolve(
            base64ToBytes(
              cryptoHost.Decrypt(
                parameters.name,
                parameters.iv === undefined ? null : bytesToBase64(rawPayload(parameters.iv)),
                parameters.additionalData === undefined
                  ? null
                  : bytesToBase64(rawPayload(parameters.additionalData)),
                key,
                bytesToBase64(rawPayload(data)),
              ),
            ),
          );
        },
        digest: function (algorithm, data) {
          return Promise.resolve(
            base64ToBytes(cryptoHost.Digest(algorithm, bytesToBase64(rawPayload(data)))),
          );
        },
      };
    }
  }

  // ---------------------------------------------------------------------------
  // timers
  // ---------------------------------------------------------------------------

  var timerSequence = 0;
  var pendingTimers = {};
  var timerQueue = Promise.resolve();

  function scheduleTimer(handler, delay, args, repeat) {
    if (typeof handler !== "function") return 0;
    timerSequence += 1;
    var id = timerSequence;
    pendingTimers[id] = true;
    timerQueue = timerQueue.then(function () {
      if (!pendingTimers[id]) return undefined;
      if (!repeat) delete pendingTimers[id];
      return handler.apply(undefined, args);
    });
    return id;
  }

  function installTimers() {
    if (typeof globalThis.setTimeout === "undefined") {
      globalThis.setTimeout = function (handler, delay) {
        var args = Array.prototype.slice.call(arguments, 2);
        return scheduleTimer(handler, delay, args, false);
      };
    }
    if (typeof globalThis.clearTimeout === "undefined") {
      globalThis.clearTimeout = function (id) {
        delete pendingTimers[id];
      };
    }
    if (typeof globalThis.setInterval === "undefined") {
      globalThis.setInterval = function (handler, delay) {
        var args = Array.prototype.slice.call(arguments, 2);
        return scheduleTimer(handler, delay, args, false);
      };
    }
    if (typeof globalThis.clearInterval === "undefined") {
      globalThis.clearInterval = function (id) {
        delete pendingTimers[id];
      };
    }
    if (typeof globalThis.setImmediate === "undefined") {
      globalThis.setImmediate = function (handler) {
        var args = Array.prototype.slice.call(arguments, 1);
        return scheduleTimer(handler, 0, args, false);
      };
    }
    if (typeof globalThis.clearImmediate === "undefined") {
      globalThis.clearImmediate = function (id) {
        delete pendingTimers[id];
      };
    }
    if (typeof globalThis.queueMicrotask === "undefined") {
      globalThis.queueMicrotask = function (handler) {
        timerQueue = timerQueue.then(function () {
          return handler();
        });
      };
    }
    if (typeof globalThis.performance === "undefined") {
      var startedAt = Date.now();
      globalThis.performance = {
        now: function () {
          return Date.now() - startedAt;
        },
      };
    }
    globalThis.__neotalesDrain = function () {
      var pending = Object.keys(pendingTimers);
      if (pending.length === 0) return null;
      return timerQueue;
    };
  }

  // ---------------------------------------------------------------------------
  // environment
  // ---------------------------------------------------------------------------

  function installEnvironment() {
    if (!envHost) return {};
    return new Proxy({}, {
      get: function (store, key) {
        if (typeof key === "symbol") return undefined;
        if (key === "toString") return envHost.Get("PATH") || "";
        return envHost.Get(key);
      },
      set: function (store, key, value) {
        if (typeof key === "symbol") return false;
        envHost.Set(key, String(value));
        return true;
      },
      deleteProperty: function (store, key) {
        if (typeof key === "symbol") return false;
        envHost.Delete(key);
        return true;
      },
      has: function (store, key) {
        if (typeof key === "symbol") return false;
        return envHost.Has(key);
      },
      ownKeys: function () {
        return envHost.Keys();
      },
      getOwnPropertyDescriptor: function (store, key) {
        if (typeof key === "symbol" || !envHost.Has(key)) return undefined;
        return {
          value: envHost.Get(key),
          writable: true,
          enumerable: true,
          configurable: true,
        };
      },
    });
  }

  // ---------------------------------------------------------------------------
  // filesystem
  // ---------------------------------------------------------------------------

  function fsError(result, syscall) {
    var error = new Error(result.Message || result.Code || "fs error");
    error.code = result.Code || "UNKNOWN";
    error.errno = -1;
    error.syscall = result.Syscall || syscall;
    error.path = result.Path;
    return error;
  }

  function unwrap(result, syscall) {
    if (!result.Ok) throw fsError(result, syscall);
    return result;
  }

  function statObject(stat) {
    var isFile = stat.IsFile;
    var isDirectory = stat.IsDirectory;
    var isSymlink = stat.IsSymlink;
    return {
      dev: 0,
      ino: 0,
      mode: stat.Mode,
      nlink: 1,
      uid: -1,
      gid: -1,
      rdev: 0,
      size: stat.Size,
      blksize: 4096,
      blocks: Math.ceil(stat.Size / 512),
      atimeMs: stat.AtimeMs,
      mtimeMs: stat.MtimeMs,
      ctimeMs: stat.CtimeMs,
      birthtimeMs: stat.BirthtimeMs,
      atime: new Date(stat.AtimeMs),
      mtime: new Date(stat.MtimeMs),
      ctime: new Date(stat.CtimeMs),
      birthtime: new Date(stat.BirthtimeMs),
      isFile: function () {
        return isFile;
      },
      isDirectory: function () {
        return isDirectory;
      },
      isSymbolicLink: function () {
        return isSymlink;
      },
      isBlockDevice: function () {
        return stat.IsBlockDevice;
      },
      isCharacterDevice: function () {
        return stat.IsCharacterDevice;
      },
      isFIFO: function () {
        return stat.IsFifo;
      },
      isSocket: function () {
        return stat.IsSocket;
      },
    };
  }

  function toMilliseconds(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === "number") return value;
    var parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  function encodePayload(data) {
    if (typeof data === "string") return data;
    if (data instanceof Uint8Array) return decodeUtf8(data);
    if (data && data.buffer instanceof ArrayBuffer) return decodeUtf8(new Uint8Array(data.buffer));
    return String(data);
  }

  function rawPayload(data) {
    if (typeof data === "string") return encodeUtf8(data);
    if (data instanceof Uint8Array) return data;
    if (data && data.buffer instanceof ArrayBuffer) return new Uint8Array(data.buffer);
    return encodeUtf8(String(data));
  }

  function writeFlags(flag) {
    var append = (flag & 1024) !== 0;
    var create = (flag & 64) !== 0;
    return { append: append, create: create || !append };
  }

  function createFs() {
    var O_RDONLY = 0;
    var constants = {
      O_RDONLY: O_RDONLY,
      O_WRONLY: 1,
      O_RDWR: 2,
      O_CREAT: 64,
      O_EXCL: 128,
      O_NOCTTY: 256,
      O_TRUNC: 512,
      O_APPEND: 1024,
      O_DIRECTORY: 65536,
      O_NOATIME: 262144,
      O_NOFOLLOW: 131072,
      O_SYNC: 1052672,
      F_OK: 0,
      R_OK: 4,
      W_OK: 2,
      X_OK: 1,
    };

    var fs = {
      constants: constants,
      existsSync: function (path) {
        return fsHost.Exists(path);
      },
      accessSync: function (path, mode) {
        unwrap(fsHost.Access(path, (mode | 0) === constants.W_OK), "access");
      },
      exists: function (path, callback) {
        var value = fsHost.Exists(path);
        defer(callback, null, value);
      },
      access: function (path, mode, callback) {
        var result = fsHost.Access(path, (mode | 0) === constants.W_OK);
        var error = null;
        if (!result.Ok) error = fsError(result, "access");
        defer(callback, error, null);
      },
      readFileSync: function (path, options) {
        var encoding = typeof options === "string" ? options : options && options.encoding;
        if (encoding === null || encoding === "buffer" || encoding === undefined) {
          return base64ToBytes(unwrap(fsHost.ReadBytes(path), "readFile").Base64);
        }
        return unwrap(fsHost.ReadText(path), "readFile").Text;
      },
      readFile: function (path, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          defer(callback, null, fs.readFileSync(path, options));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      writeFileSync: function (path, data, options) {
        var settings = typeof options === "string" ? { encoding: options } : options || {};
        if (settings.signal && settings.signal.aborted) {
          var aborted = new Error("The operation was aborted");
          aborted.code = "ABORT_ERR";
          throw aborted;
        }
        if (
          typeof data === "string" || settings.encoding === "utf-8" || settings.encoding === "utf8"
        ) {
          unwrap(fsHost.WriteText(path, encodePayload(data), false), "writeFile");
          return;
        }
        unwrap(fsHost.WriteBytes(path, bytesToBase64(rawPayload(data)), false), "writeFile");
      },
      writeFile: function (path, data, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          fs.writeFileSync(path, data, options);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      appendFileSync: function (path, data, options) {
        var settings = typeof options === "string" ? { encoding: options } : options || {};
        if (
          typeof data === "string" || settings.encoding === "utf-8" || settings.encoding === "utf8"
        ) {
          unwrap(fsHost.WriteText(path, encodePayload(data), true), "appendFile");
          return;
        }
        unwrap(fsHost.WriteBytes(path, bytesToBase64(rawPayload(data)), true), "appendFile");
      },
      appendFile: function (path, data, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          fs.appendFileSync(path, data, options);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      readdirSync: function (path, options) {
        var withTypes = options === "string"
          ? options === "withFileTypes"
          : !!(options && options.withFileTypes);
        var result = unwrap(fsHost.ReadDirectory(path), "scandir");
        if (!withTypes) return toArray(result.Names);
        return toArray(result.Entries).map(function (entry) {
          return {
            name: entry.Name,
            isFile: function () {
              return entry.IsFile;
            },
            isDirectory: function () {
              return entry.IsDirectory;
            },
            isSymbolicLink: function () {
              return entry.IsSymlink;
            },
          };
        });
      },
      mkdirSync: function (path, options) {
        var recursive = typeof options === "string"
          ? options === "recursive"
          : !!(options && options.recursive);
        var result = unwrap(fsHost.MakeDirectory(path, true), "mkdir");
        if (!recursive && result.Existed) {
          var error = new Error("EEXIST: file already exists, mkdir '" + path + "'");
          error.code = "EEXIST";
          error.syscall = "mkdir";
          error.path = path;
          throw error;
        }
      },
      mkdtempSync: function (prefix) {
        return unwrap(fsHost.MakeTempDirectory(prefix), "mkdtemp").Text;
      },
      readdir: function (path, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          defer(callback, null, fs.readdirSync(path, options));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      truncateSync: function (path, length) {
        unwrap(
          fsHost.TruncateFile(path, length === undefined || length === null ? 0 : length | 0),
          "truncate",
        );
      },
      truncate: function (path, length, callback) {
        if (typeof length === "function") {
          callback = length;
          length = 0;
        }
        try {
          fs.truncateSync(path, length);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      chmodSync: function (path, mode) {
        unwrap(fsHost.ChangeMode(path, mode | 0), "chmod");
      },
      chmod: function (path, mode, callback) {
        try {
          fs.chmodSync(path, mode);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      chownSync: function (path, uid, gid) {
        unwrap(
          fsHost.ChangeOwner(
            path,
            uid === undefined ? -1 : uid | 0,
            gid === undefined ? -1 : gid | 0,
          ),
          "chown",
        );
      },
      chown: function (path, uid, gid, callback) {
        try {
          fs.chownSync(path, uid, gid);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      linkSync: function (from, to) {
        unwrap(fsHost.CreateHardLink(from, to), "link");
      },
      link: function (from, to, callback) {
        try {
          fs.linkSync(from, to);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      utimesSync: function (path, atime, mtime) {
        unwrap(fsHost.SetTimes(path, toMilliseconds(atime), toMilliseconds(mtime)), "utimes");
      },
      utimes: function (path, atime, mtime, callback) {
        try {
          fs.utimesSync(path, atime, mtime);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      rmSync: function (path, options) {
        var settings = options || {};
        unwrap(fsHost.Remove(path, !!settings.recursive, !!settings.force), "rm");
      },
      rm: function (path, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          fs.rmSync(path, options);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      rmdirSync: function (path, options) {
        fs.rmSync(path, options);
      },
      rmdir: function (path, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          fs.rmdirSync(path, options);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      unlinkSync: function (path) {
        unwrap(fsHost.RemoveFile(path), "unlink");
      },
      unlink: function (path, callback) {
        try {
          fs.unlinkSync(path);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      renameSync: function (from, to) {
        unwrap(fsHost.Rename(from, to), "rename");
      },
      rename: function (from, to, callback) {
        try {
          fs.renameSync(from, to);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      copyFileSync: function (from, to, mode) {
        unwrap(fsHost.CopyFile(from, to, (mode | 0) === 1), "copyFile");
      },
      copyFile: function (from, to, mode, callback) {
        if (typeof mode === "function") {
          callback = mode;
          mode = 0;
        }
        try {
          fs.copyFileSync(from, to, mode);
          defer(callback, null, null);
        } catch (error) {
          defer(callback, error, null);
        }
      },
      statSync: function (path, options) {
        var follow = !options || options.throwIfNoEntry === false;
        return statObject(unwrap(fsHost.Stat(path, follow), "stat").Stat);
      },
      stat: function (path, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          defer(callback, null, fs.statSync(path, options));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      lstatSync: function (path) {
        return statObject(unwrap(fsHost.Stat(path, false), "lstat").Stat);
      },
      lstat: function (path, callback) {
        try {
          defer(callback, null, fs.lstatSync(path));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      fstatSync: function (handle) {
        return statObject(unwrap(fsHost.StatHandle(handle), "fstat").Stat);
      },
      opendirSync: function (path) {
        return dirEntries(path);
      },
      opendir: function (path) {
        return Promise.resolve().then(function () {
          return dirEntries(path);
        });
      },
      fstat: function (handle, callback) {
        try {
          defer(callback, null, fs.fstatSync(handle));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      realpathSync: function (path) {
        return unwrap(fsHost.RealPath(path), "realpath").Text;
      },
      realpath: function (path, callback) {
        try {
          defer(callback, null, fs.realpathSync(path));
        } catch (error) {
          defer(callback, error, null);
        }
      },
      readlinkSync: function (path) {
        return unwrap(fsHost.ReadLink(path), "readlink").Text;
      },
      symlinkSync: function (target, path) {
        unwrap(fsHost.CreateSymlink(target, path), "symlink");
      },
      readSync: function (handle, buffer, offset, length, position) {
        var start = offset === undefined || offset === null ? 0 : offset;
        var size = length === undefined || length === null ? buffer.length - start : length;
        var at = position === undefined || position === null ? -1 : position;
        var result = unwrap(fsHost.Read(handle, size, at), "read");
        var bytes = base64ToBytes(result.Base64);
        var target = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer.buffer);
        target.set(bytes, start);
        return bytes.length;
      },
      read: function (handle, buffer, offset, length, position, callback) {
        try {
          var read = fs.readSync(handle, buffer, offset, length, position);
          defer(callback, null, read, buffer);
        } catch (error) {
          defer(callback, error, 0, buffer);
        }
      },
      writeSync: function (handle, data, offset, length, position) {
        var start = offset === undefined || offset === null ? 0 : offset;
        var source = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
        var size = length === undefined || length === null ? source.length - start : length;
        var at = position === undefined || position === null ? -1 : position;
        var slice = source.subarray(start, start + size);
        return unwrap(fsHost.Write(handle, bytesToBase64(slice), at), "write").Count;
      },
      write: function (handle, data, offset, length, position, callback) {
        try {
          var written = fs.writeSync(handle, data, offset, length, position);
          defer(callback, null, written, data);
        } catch (error) {
          defer(callback, error, 0, data);
        }
      },
      openSync: function (path, flags, mode) {
        return unwrap(fsHost.Open(path, flags | 0), "open").Handle;
      },
      open: function (path, flags, mode, callback) {
        try {
          defer(callback, null, fs.openSync(path, flags, mode));
        } catch (error) {
          defer(callback, error, 0);
        }
      },
      closeSync: function (handle) {
        unwrap(fsHost.Close(handle), "close");
      },
      close: function (handle, callback) {
        try {
          fs.closeSync(handle);
          defer(callback, null);
        } catch (error) {
          defer(callback, error);
        }
      },
      ftruncateSync: function (handle, length) {
        unwrap(fsHost.Truncate(handle, length | 0), "ftruncate");
      },
      ftruncate: function (handle, length, callback) {
        try {
          fs.ftruncateSync(handle, length);
          defer(callback, null);
        } catch (error) {
          defer(callback, error);
        }
      },
      fsyncSync: function (handle) {
        unwrap(fsHost.Sync(handle), "fsync");
      },
      fsync: function (handle, callback) {
        try {
          fs.syncSync(handle);
          defer(callback, null);
        } catch (error) {
          defer(callback, error);
        }
      },
      promises: null,
    };

    // `fs.opendir` returns a handle that is both awaitable and async-iterable. The Neotales
    // filesystem module uses the async-iterator form, so both shapes are provided.
    function dirEntries(path) {
      var entries = fs.readdirSync(path, { withFileTypes: true });
      var index = 0;
      var handle = {
        path: path,
        read: function () {
          return Promise.resolve(index < entries.length ? entries[index++] : null);
        },
        readSync: function () {
          return index < entries.length ? entries[index++] : null;
        },
        close: function () {
          return Promise.resolve();
        },
        closeSync: function () {},
        [Symbol.asyncIterator]: function () {
          return {
            next: function () {
              if (index >= entries.length) return Promise.resolve({ done: true, value: undefined });
              return Promise.resolve({ done: false, value: entries[index++] });
            },
            return: function () {
              return Promise.resolve({ done: true, value: undefined });
            },
          };
        },
      };
      return handle;
    }

    fs.promises = createFsPromises(fs);
    fs.read.neotalesPromisify = function (handle, buffer, offset, length, position) {
      return new Promise(function (resolve, reject) {
        try {
          var bytesRead = fs.readSync(handle, buffer, offset, length, position);
          resolve({ bytesRead: bytesRead, buffer: buffer });
        } catch (error) {
          reject(error);
        }
      });
    };
    fs.write.neotalesPromisify = function (handle, data, offset, length, position) {
      return new Promise(function (resolve, reject) {
        try {
          var bytesWritten = fs.writeSync(handle, data, offset, length, position);
          resolve({ bytesWritten: bytesWritten, buffer: data });
        } catch (error) {
          reject(error);
        }
      });
    };
    return fs;
  }

  function createFsPromises(fs) {
    var promises = {};
    var names = [
      "access",
      "appendFile",
      "copyFile",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "readFile",
      "readdir",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "writeFile",
    ];
    names.forEach(function (name) {
      var hasMethod = typeof fs[name] === "function" || typeof fs[name + "Sync"] === "function";
      if (!hasMethod) return;
      promises[name] = function () {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function (resolve, reject) {
          args.push(function (error, value) {
            if (error) reject(error);
            else resolve(value);
          });
          var target = typeof fs[name] === "function" ? fs[name] : fs[name + "Sync"];
          var result = target.apply(fs, args);
          if (typeof fs[name] !== "function") {
            args[args.length - 1](null, result);
          }
        });
      };
    });
    promises.rmdir = promises.rmdir || function (path, options) {
      return promises.rm(path, options);
    };
    if (typeof fs.opendir === "function") {
      promises.opendir = function (path) {
        return fs.opendir(path);
      };
    }
    return promises;
  }

  function defer(callback, error, value, buffer) {
    if (typeof callback !== "function") return;
    Promise.resolve().then(function () {
      if (error) {
        if (buffer) callback(error, 0, buffer);
        else callback(error);
        return;
      }
      if (buffer) callback(null, value, buffer);
      else callback(null, value);
    });
  }

  // ---------------------------------------------------------------------------
  // node builtins
  // ---------------------------------------------------------------------------

  function createBufferModule() {
    function Buffer(value) {
      return new Uint8Array(value);
    }
    Buffer.from = function (value, encoding) {
      if (typeof value === "string") {
        return (encoding === "base64" ? base64ToBytes(value) : encodeUtf8(value));
      }
      if (value instanceof Uint8Array) return new Uint8Array(value);
      if (value instanceof ArrayBuffer) return new Uint8Array(value);
      if (Array.isArray(value)) return new Uint8Array(value);
      return new Uint8Array(0);
    };
    Buffer.alloc = function (size, fill) {
      var bytes = new Uint8Array(size);
      if (fill) bytes.fill(fill);
      return bytes;
    };
    Buffer.concat = function (list) {
      var total = 0;
      for (var index = 0; index < list.length; index++) total += list[index].length;
      var result = new Uint8Array(total);
      var offset = 0;
      for (var item = 0; item < list.length; item++) {
        result.set(list[item], offset);
        offset += list[item].length;
      }
      return result;
    };
    Buffer.isBuffer = function (value) {
      return value instanceof Uint8Array;
    };
    Buffer.byteLength = function (value) {
      return typeof value === "string" ? encodeUtf8(value).length : value.length;
    };
    Buffer.fromString = function (value) {
      return encodeUtf8(value);
    };
    return { Buffer: Buffer, isBuffer: Buffer.isBuffer, kMaxLength: 2147483647 };
  }

  function createPathModule() {
    var windows = system.Platform === "win32";
    var separator = windows ? "\\" : "/";
    var delimiter = windows ? ";" : ":";
    var posix = {
      sep: "/",
      delimiter: ":",
      posix: true,
      win32: false,
      resolve: function () {
        var resolved = system.CurrentDirectory;
        for (var index = 0; index < arguments.length; index++) {
          var part = arguments[index];
          if (!part) continue;
          if (part.charAt(0) === "/") resolved = part;
          else resolved = resolved.replace(/\/+$/, "") + "/" + part;
        }
        return posix.normalize(resolved);
      },
      normalize: function (input) {
        var absolute = input.charAt(0) === "/";
        var parts = input.split("/");
        var stack = [];
        for (var index = 0; index < parts.length; index++) {
          var part = parts[index];
          if (part === "" || part === ".") continue;
          if (part === "..") {
            if (stack.length > 0) stack.pop();
            continue;
          }
          stack.push(part);
        }
        var joined = stack.join("/");
        if (absolute) return "/" + joined;
        return joined === "" ? "." : joined;
      },
      join: function () {
        var parts = [];
        for (var index = 0; index < arguments.length; index++) {
          if (arguments[index]) parts.push(arguments[index]);
        }
        return posix.normalize(parts.join("/"));
      },
      dirname: function (input) {
        var normalized = posix.normalize(input);
        var index = normalized.lastIndexOf("/");
        if (index < 0) return ".";
        if (index === 0) return "/";
        return normalized.slice(0, index);
      },
      basename: function (input, ext) {
        var normalized = posix.normalize(input);
        var index = normalized.lastIndexOf("/");
        var name = index < 0 ? normalized : normalized.slice(index + 1);
        if (ext && name.endsWith(ext)) return name.slice(0, name.length - ext.length);
        return name;
      },
      extname: function (input) {
        var name = posix.basename(input);
        var index = name.lastIndexOf(".");
        return index <= 0 ? "" : name.slice(index);
      },
      relative: function (from, to) {
        var fromParts = posix.normalize(from).split("/");
        var toParts = posix.normalize(to).split("/");
        while (fromParts.length > 0 && toParts.length > 0 && fromParts[0] === toParts[0]) {
          fromParts.shift();
          toParts.shift();
        }
        var up = [];
        for (var index = 0; index < fromParts.length; index++) up.push("..");
        return up.concat(toParts).join("/") || ".";
      },
      isAbsolute: function (input) {
        return input.charAt(0) === "/";
      },
      parse: function (input) {
        var normalized = posix.normalize(input);
        var dir = posix.dirname(normalized);
        var base = posix.basename(normalized);
        return {
          root: "/",
          dir: dir,
          base: base,
          ext: posix.extname(base),
          name: base.slice(0, base.length - posix.extname(base).length),
        };
      },
      format: function (parts) {
        return posix.join(parts.dir || "", parts.name || "") + (parts.ext || "");
      },
    };
    posix.toNamespacedPath = function (input) {
      return input;
    };
    var nodePath = windows
      ? Object.assign({}, posix, {
        sep: "\\",
        delimiter: ";",
        posix: posix,
        win32: posix,
        isAbsolute: function (input) {
          return /^[a-zA-Z]:[\\/]/.test(input) || input.charAt(0) === "\\";
        },
      })
      : posix;
    nodePath.default = nodePath;
    return nodePath;
  }

  function createOsModule() {
    return {
      EOL: system.NewLine,
      arch: function () {
        return system.Arch;
      },
      platform: function () {
        return system.Platform;
      },
      hostname: function () {
        return system.HostName;
      },
      tmpdir: function () {
        return system.TempDirectory;
      },
      homedir: function () {
        return system.HomeDirectory;
      },
      userInfo: function () {
        return { username: system.UserName, homedir: system.HomeDirectory };
      },
      cpus: function () {
        return [];
      },
      totalmem: function () {
        return 0;
      },
      freemem: function () {
        return 0;
      },
      uptime: function () {
        return system.Uptime;
      },
      release: function () {
        return system.Description;
      },
      networkInterfaces: function () {
        return {};
      },
      tmpdirSync: function () {
        return system.TempDirectory;
      },
    };
  }

  function createUtilModule() {
    function promisify(fn) {
      if (fn && typeof fn.neotalesPromisify === "function") return fn.neotalesPromisify;
      return function () {
        var args = Array.prototype.slice.call(arguments);
        return new Promise(function (resolve, reject) {
          args.push(function (error, value) {
            if (error) reject(error);
            else resolve(value);
          });
          fn.apply(null, args);
        });
      };
    }

    // `util.inspect` is intentionally not provided. A JSON-based approximation would report
    // different strings than Node for circular values, `[Circular]` markers, and `depth`
    // handling, so modules that inspect values keep using their own portable inspector
    // instead of silently receiving wrong output.
    return {
      promisify: promisify,
      callbackify: function (fn) {
        return fn;
      },
      format: format,
      isDeepStrictEqual: function (left, right) {
        return JSON.stringify(left) === JSON.stringify(right);
      },
      deprecate: function (fn) {
        return fn;
      },
      types: {},
    };
  }

  function createCryptoModule() {
    var nodeCrypto = {
      randomBytes: function (size) {
        var bytes = base64ToBytes(cryptoHost.GetRandomValues(size));
        return {
          length: bytes.length,
          buffer: bytes.buffer,
          byteOffset: bytes.byteOffset,
          toString: function (encoding) {
            return (encoding || "hex") === "hex" ? bytesToHex(bytes) : decodeUtf8(bytes);
          },
        };
      },
      randomUUID: function () {
        return cryptoHost.RandomUuid();
      },
      randomFillSync: function (buffer) {
        var bytes = base64ToBytes(cryptoHost.GetRandomValues(buffer.length));
        if (buffer instanceof Uint8Array) buffer.set(bytes);
        return buffer;
      },
      webcrypto: globalThis.crypto,
      constants: {},
    };
    nodeCrypto.web = { getRandomValues: globalThis.crypto.getRandomValues };
    return nodeCrypto;
  }

  function bytesToHex(bytes) {
    var result = "";
    for (var index = 0; index < bytes.length; index++) {
      var value = bytes[index].toString(16);
      result += value.length === 1 ? "0" + value : value;
    }
    return result;
  }

  function createChildProcessModule() {
    function normalize(args) {
      var fileName = args[0];
      var rest = Array.prototype.slice.call(args, 1);
      var options = {};
      if (
        rest.length > 0 && typeof rest[rest.length - 1] === "object" &&
        rest[rest.length - 1] !== null
      ) {
        options = rest.pop();
      }
      return { fileName: fileName, args: rest.map(String), options: options };
    }

    function run(args) {
      var normalized = normalize(args);
      var options = normalized.options || {};
      if (!childHost) {
        var error = new Error("Child processes are not available in this host");
        error.code = "ENOSYS";
        throw error;
      }
      var result = childHost.RunSync(
        normalized.fileName,
        normalized.args,
        options.input === undefined ? null : String(options.input),
        options.env === undefined,
        options.timeout === undefined ? 0 : options.timeout | 0,
      );
      if (result.Error) {
        var failure = new Error(result.Error);
        failure.code = "ENOENT";
        throw failure;
      }
      return result;
    }

    var childProcess = {
      spawnSync: function () {
        return run(arguments);
      },
      execSync: function (command, options) {
        return run([command]).Stdout;
      },
      execFileSync: function () {
        return run(arguments).Stdout;
      },
      exec: function (command, options, callback) {
        if (typeof options === "function") {
          callback = options;
          options = undefined;
        }
        try {
          var result = run([command]);
          defer(callback, null, result.Stdout, result.Stderr);
        } catch (error) {
          defer(callback, error, null, null);
        }
      },
      execFile: function (file, args, options, callback) {
        try {
          var result = run([file].concat(args || [], options || {}));
          defer(callback, null, result.Stdout, result.Stderr);
        } catch (error) {
          defer(callback, error, null, null);
        }
      },
    };
    return childProcess;
  }

  function createModuleModule(registry) {
    function require(specifier) {
      if (registry[specifier]) return registry[specifier];
      var error = new Error("Cannot find module '" + specifier + "'");
      error.code = "MODULE_NOT_FOUND";
      throw error;
    }
    function createRequire(base) {
      require.resolve = function (specifier) {
        if (registry[specifier]) return specifier;
        var error = new Error("Cannot find module '" + specifier + "'");
        error.code = "MODULE_NOT_FOUND";
        throw error;
      };
      require.cache = {};
      require.extensions = {};
      require.main = undefined;
      return require;
    }
    return {
      createRequire: createRequire,
      builtinModules: Object.keys(registry),
      isBuiltin: function (specifier) {
        return !!registry[specifier];
      },
      require: require,
    };
  }

  // ---------------------------------------------------------------------------
  // process
  // ---------------------------------------------------------------------------

  function buildProcess(registry) {
    var env = installEnvironment() || {};
    var process = {
      env: env,
      platform: system.Platform,
      arch: system.Arch,
      pid: system.Pid,
      ppid: system.Ppid,
      title: "neotales-clearscript",
      version: "v22.0.0-neotales",
      versions: {
        neotales: "1.0.0",
        v8: system.Description,
        clearscript: "7.5.1.1",
      },
      execArgv: [],
      argv: [system.ExecPath || "neotales-clearscript"].concat(
        Array.prototype.slice.call(hostArgs),
      ),
      execPath: system.ExecPath || "neotales-clearscript",
      exitCode: 0,
      stdout: streamFor(stdoutHost, "stdout"),
      stderr: streamFor(stderrHost, "stderr"),
      stdin: {
        isTTY: false,
        read: function () {
          return null;
        },
        readSync: function () {
          throw new Error("Standard input is not readable in this host");
        },
        setRawMode: function () {},
      },
      cwd: function () {
        return system.CurrentDirectory;
      },
      chdir: function (path) {
        system.ChangeDirectory(path);
      },
      uptime: function () {
        return system.Uptime;
      },
      hrtime: function () {
        var nanoseconds = Date.now() * 1000000;
        return [Math.floor(nanoseconds / 1000000000), nanoseconds % 1000000000];
      },
      uptime_: undefined,
      memoryUsage: function () {
        return { rss: 0, heapTotal: 0, heapUsed: 0, external: 0 };
      },
      getuid: function () {
        return system.Uid;
      },
      geteuid: function () {
        return system.Euid;
      },
      getgid: function () {
        return system.Gid;
      },
      getegid: function () {
        return system.Egid;
      },
      nextTick: function (handler) {
        var args = Array.prototype.slice.call(arguments, 1);
        if (typeof globalThis.queueMicrotask === "function") {
          globalThis.queueMicrotask(function () {
            handler.apply(null, args);
          });
        }
      },
      emitWarning: function (message) {
        if (stderrHost) stderrHost.Write("Warning: " + message + system.NewLine);
      },
      kill: function () {
        return false;
      },
      exit: function (code) {
        process.exitCode = code === undefined ? 0 : code | 0;
        globalThis.__neotalesExited = true;
        throw new Error("process.exit(" + process.exitCode + ")");
      },
      abort: function () {
        process.exit(1);
      },
      on: function () {
        return process;
      },
      once: function () {
        return process;
      },
      off: function () {
        return process;
      },
      addListener: function () {
        return process;
      },
      removeListener: function () {
        return process;
      },
      getBuiltinModule: function (name) {
        return registry[name];
      },
    };
    delete process.uptime_;
    return process;
  }

  function streamFor(host, name) {
    var stream = {
      name: name,
      isTTY: host ? host.IsTerm : false,
      columns: host ? host.Columns : 0,
      rows: host ? host.Rows : 0,
      write: function (text) {
        if (host) host.Write(typeof text === "string" ? text : decodeUtf8(text));
        return true;
      },
      writeSync: function (text) {
        if (host) host.Write(typeof text === "string" ? text : decodeUtf8(text));
        return true;
      },
      end: function () {},
      on: function () {
        return stream;
      },
      once: function () {
        return stream;
      },
      off: function () {
        return stream;
      },
      destroy: function () {},
      writable: true,
      readable: false,
    };
    return stream;
  }

  // ---------------------------------------------------------------------------
  // bootstrap
  // ---------------------------------------------------------------------------

  installEncoding();
  installConsole();
  installCrypto();
  installTimers();

  if (typeof globalThis.navigator === "undefined") {
    globalThis.navigator = { platform: system.Platform === "win32" ? "Win32" : system.Platform };
  }

  var registry = {};

  if (fsHost) {
    var fs = createFs();
    registry["node:fs"] = fs;
    registry.fs = fs;
    registry["fs/promises"] = fs.promises;
    registry["node:fs/promises"] = fs.promises;
  }

  if (childHost) {
    var childProcess = createChildProcessModule();
    registry["node:child_process"] = childProcess;
    registry.child_process = childProcess;
  }

  var pathModule = createPathModule();
  registry["node:path"] = pathModule;
  registry.path = pathModule;

  var osModule = createOsModule();
  registry["node:os"] = osModule;
  registry.os = osModule;

  var utilModule = createUtilModule();
  registry["node:util"] = utilModule;
  registry.util = utilModule;

  if (cryptoHost) {
    var nodeCrypto = createCryptoModule();
    registry["node:crypto"] = nodeCrypto;
    registry.crypto = nodeCrypto;
  }

  registry["node:tty"] = {
    isatty: function () {
      return false;
    },
  };
  registry.tty = registry["node:tty"];

  var processGlobal = buildProcess(registry);
  registry["node:process"] = processGlobal;
  registry.process = processGlobal;

  registry["node:stream"] = {
    Readable: { toWeb: unsupportedStream },
    Writable: { toWeb: unsupportedStream },
  };
  registry.stream = registry["node:stream"];

  registry["node:module"] = createModuleModule({});
  registry.module = registry["node:module"];

  registry["node:buffer"] = createBufferModule();
  registry.buffer = registry["node:buffer"];

  if (!globalThis.process) globalThis.process = processGlobal;
  globalThis.global = globalThis;

  function unsupportedStream() {
    throw new Error("Node stream adapters are not implemented by Neotales.ClearScript");
  }
})();
