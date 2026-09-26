import "./_dnt.polyfills.js";
import { globals } from "./_globals.js";
let stdinValue = {
    /**
     * Reads a chunk of data from the stream.
     * @param data The chunk to read data into.
     */
    read(_data) {
        return Promise.resolve(null);
    },
    /**
     * Reads a chunk of data from the stream synchronously.
     * @param data The chunk to read data into.
     */
    readSync(_data) {
        return null;
    },
    isTerm() {
        return false;
    },
    /**
     * Closes the stream, if applicable.
     */
    close() { },
};
/**
 * A standard output writer, which represents the standard
 * output for the current process.
 */
let stdoutValue = {
    buffer: "",
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk) {
        return new Promise((resolve) => {
            let msg = new TextDecoder().decode(chunk);
            let buffer = this.buffer;
            if (msg.includes("\n")) {
                const messages = msg.split("\n");
                for (let i = 0; i < messages.length - 1; i++) {
                    if (buffer.length > 0) {
                        console.log(buffer + messages[i]);
                        this.buffer = buffer = "";
                        continue;
                    }
                    console.log(messages[i]);
                }
                msg = messages[messages.length - 1];
            }
            if (!msg.endsWith("\n")) {
                this.buffer += msg;
                resolve(chunk.length);
            }
            else {
                this.buffer = "";
                const lines = buffer + msg;
                console.log(lines);
                resolve(chunk.length);
            }
        });
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     */
    writeSync(chunk) {
        let msg = new TextDecoder().decode(chunk);
        let buffer = this.buffer;
        if (msg.includes("\n")) {
            const messages = msg.split("\n");
            for (let i = 0; i < messages.length - 1; i++) {
                if (buffer.length > 0) {
                    console.log(buffer + messages[i]);
                    this.buffer = buffer = "";
                    continue;
                }
                console.log(messages[i]);
            }
            msg = messages[messages.length - 1];
        }
        if (!msg.endsWith("\n")) {
            this.buffer += msg;
        }
        else {
            this.buffer = "";
            const lines = buffer + msg;
            console.log(lines);
        }
        return chunk.length;
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm() {
        return false;
    },
    close() { },
};
/**
 * A standard error writer, which represents the standard error
 * stream of the process.
 */
let stderrValue = {
    buffer: "",
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk) {
        return new Promise((resolve) => {
            const msg = new TextDecoder().decode(chunk);
            const buffer = this.buffer;
            if (!msg.endsWith("\n")) {
                this.buffer += msg;
                resolve(chunk.length);
            }
            else {
                this.buffer = "";
                const lines = buffer + msg;
                console.error(lines);
                resolve(chunk.length);
            }
        });
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     */
    writeSync(chunk) {
        const msg = new TextDecoder().decode(chunk);
        const buffer = this.buffer;
        if (!msg.endsWith("\n")) {
            this.buffer += msg;
        }
        else {
            this.buffer = "";
            const lines = buffer + msg;
            console.error(lines);
        }
        return chunk.length;
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm() {
        return false;
    },
    close() { },
};
const deno = globals.Deno;
if (deno) {
    stdoutValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return deno.stdout.write(chunk);
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        writeSync(chunk) {
            return deno.stdout.writeSync(chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return deno.stdout.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stdout.close();
        },
    };
    stderrValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return deno.stderr.write(chunk);
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        writeSync(chunk) {
            return deno.stderr.writeSync(chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return deno.stderr.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stderr.close();
        },
    };
    stdinValue = {
        /**
         * Reads a chunk of data from the stream.
         * @param data The chunk to read data into.
         */
        read(data) {
            return deno.stdin.read(data);
        },
        /**
         * Reads a chunk of data from the stream synchronously.
         * @param data The chunk to read data into.
         */
        readSync(data) {
            return deno.stdin.readSync(data);
        },
        isTerm() {
            return deno.stdin.isTerminal();
        },
        /**
         * Closes the stream, if applicable.
         */
        close() {
            deno.stdin.close();
        },
    };
}
else if (globals.process) {
    // @ts-types="npm:@types/node@^22.17.0"
    const process = globals.process;
    // @ts-types="npm:@types/node@^22.17.0"
    const fs = await import("node:fs");
    // @ts-types="npm:@types/node@^22.17.0"
    const tty = await import("node:tty");
    // deno-lint-ignore no-inner-declarations
    function readAsync(buffer, offet, length) {
        return new Promise((resolve, reject) => {
            fs.read(process.stdin.fd, buffer, offet, length, null, (err, bytesRead) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(bytesRead);
            });
        });
    }
    stdoutValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        write(chunk) {
            return new Promise((resolve, reject) => {
                process.stdout.write(chunk, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(chunk.length);
                    }
                });
            });
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         * @returns The number of bytes written.
         */
        writeSync(chunk) {
            return fs.writeSync(process.stdout.fd, chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return tty.isatty(process.stdout.fd);
        },
        close() { },
    };
    stderrValue = {
        /**
         * Writes the specified chunk of data to the stream.
         * @param chunk The data to write.
         */
        write(chunk) {
            return new Promise((resolve, reject) => {
                process.stderr.write(chunk, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(chunk.length);
                    }
                });
            });
        },
        /**
         * Writes the specified chunk of data to the stream synchronously.
         * @param chunk The data to write.
         */
        writeSync(chunk) {
            return fs.writeSync(process.stderr.fd, chunk);
        },
        /**
         * Checks if stream is TTY (terminal).
         *
         * @returns True if the stream is a terminal; otherwise, false.
         */
        isTerm() {
            return tty.isatty(process.stderr.fd);
        },
        close() { },
    };
    stdinValue = {
        /**
         * Reads a chunk of data from the stream.
         * @param data The chunk to read data into.
         */
        async read(data) {
            try {
                const count = await readAsync(data, 0, data.length);
                return count === 0 ? null : count;
            }
            catch (error) {
                const e = error;
                if (e.code === "EAGAIN" || e.code === "EOF") {
                    return null;
                }
                throw e;
            }
        },
        /**
         * Reads a chunk of data from the stream synchronously.
         * @param data The chunk to read data into.
         */
        readSync(data) {
            try {
                const count = fs.readSync(process.stdin.fd, data, 0, data.length, null);
                return count === 0 ? null : count;
            }
            catch (error) {
                const e = error;
                if (e.code === "EAGAIN" || e.code === "EOF") {
                    return null;
                }
                throw e;
            }
        },
        isTerm() {
            return tty.isatty(process.stdin.fd);
        },
        /**
         * Closes the stream, if applicable.
         */
        close() { },
    };
}
/**
 * The standard input stream of the process. The input
 * stream is a reader that can be used to read data for
 * a process. The file descriptor for the standard input
 * on Unix is 0, and on Windows it is CONIN$.
 */
export const stdin = stdinValue;
/**
 * The standard output stream of the process. The output
 * stream is a writer that can be used to write data. The
 * file descriptor for the standard output on Unix is 1,
 * and on Windows it is CONOUT$.
 */
export const stdout = stdoutValue;
/**
 * The standard error stream of the process. The error
 * stream is a writer that can be used to write error
 * data. The file descriptor for the standard error on
 * Unix is 2, and on Windows it is CONOUT$.
 *
 * The standard error stream is used to write most than
 * just error messages. It is also used to write
 * diagnostic messages, warnings, progress messages, and
 * other information that is not part of the normal
 * output of the program.
 */
export const stderr = stderrValue;
