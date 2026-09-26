import { globals } from "./_globals.ts";

/**
 * A standard output writer, which represents the standard
 * output or error stream of the process.
 */
export interface StdWriter extends Record<string, unknown> {
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   * @returns The number of bytes written.
   */
  write(chunk: Uint8Array): Promise<number>;
  /**
   * Writes the specified chunk of data to the stream synchronously.
   * @param chunk The data to write.
   * @returns The number of bytes written.
   */
  writeSync(chunk: Uint8Array): number;
  /**
   * Checks if stream is TTY (terminal).
   *
   * @returns True if the stream is a terminal; otherwise, false.
   */
  isTerm(): boolean;
  /**
   * Closes the stream, if applicable.
   */
  close(): void;
}

/**
 * A standard input reader, which represents the standard input
 * stream of the process.
 */
export interface StdReader extends Record<string, unknown> {
  /**
   * Reads a chunk of data from the stream.
   * @param data The chunk to read data into.
   */
  read(data: Uint8Array): Promise<number | null>;
  /**
   * Reads a chunk of data from the stream synchronously.
   * @param data The chunk to read data into.
   */
  readSync(data: Uint8Array): number | null;

  isTerm(): boolean;

  /**
   * Closes the stream, if applicable.
   */
  close(): void;
}

let stdinValue: StdReader = {
  /**
   * Reads a chunk of data from the stream.
   * @param data The chunk to read data into.
   */
  read(_data: Uint8Array): Promise<number | null> {
    return Promise.resolve(null);
  },

  /**
   * Reads a chunk of data from the stream synchronously.
   * @param data The chunk to read data into.
   */
  readSync(_data: Uint8Array): number | null {
    return null;
  },
  isTerm(): boolean {
    return false;
  },

  /**
   * Closes the stream, if applicable.
   */
  close(): void {},
};

/**
 * A standard output writer, which represents the standard
 * output for the current process.
 */
let stdoutValue: StdWriter = {
  buffer: "",
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   */
  write(chunk: Uint8Array): Promise<number> {
    return new Promise((resolve) => {
      let msg = new TextDecoder().decode(chunk);
      let buffer = this.buffer as string;
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
      } else {
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
  writeSync(chunk: Uint8Array): number {
    let msg = new TextDecoder().decode(chunk);
    let buffer = this.buffer as string;
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
    } else {
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
  isTerm(): boolean {
    return false;
  },
  close(): void {},
};

/**
 * A standard error writer, which represents the standard error
 * stream of the process.
 */
let stderrValue: StdWriter = {
  buffer: "",
  /**
   * Writes the specified chunk of data to the stream.
   * @param chunk The data to write.
   */
  write(chunk: Uint8Array): Promise<number> {
    return new Promise((resolve) => {
      const msg = new TextDecoder().decode(chunk);
      const buffer = this.buffer as string;

      if (!msg.endsWith("\n")) {
        this.buffer += msg;
        resolve(chunk.length);
      } else {
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
  writeSync(chunk: Uint8Array): number {
    const msg = new TextDecoder().decode(chunk);
    const buffer = this.buffer as string;

    if (!msg.endsWith("\n")) {
      this.buffer += msg;
    } else {
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
  isTerm(): boolean {
    return false;
  },
  close(): void {},
};

const deno = globals.Deno;
if (deno) {
  stdoutValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    write(chunk: Uint8Array): Promise<number> {
      return deno.stdout.write(chunk);
    },

    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    writeSync(chunk: Uint8Array): number {
      return deno.stdout.writeSync(chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return deno.stdout.isTerminal();
    },
    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stdout.close();
    },
  };

  stderrValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    write(chunk: Uint8Array): Promise<number> {
      return deno.stderr.write(chunk);
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     * @returns The number of bytes written.
     */
    writeSync(chunk: Uint8Array): number {
      return deno.stderr.writeSync(chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return deno.stderr.isTerminal();
    },
    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stderr.close();
    },
  };

  stdinValue = {
    /**
     * Reads a chunk of data from the stream.
     * @param data The chunk to read data into.
     */
    read(data: Uint8Array): Promise<number | null> {
      return deno.stdin.read(data);
    },
    /**
     * Reads a chunk of data from the stream synchronously.
     * @param data The chunk to read data into.
     */
    readSync(data: Uint8Array): number | null {
      return deno.stdin.readSync(data);
    },
    isTerm(): boolean {
      return deno.stdin.isTerminal();
    },

    /**
     * Closes the stream, if applicable.
     */
    close(): void {
      deno.stdin.close();
    },
  };
} else if (globals.process) {
  // @ts-types="npm:@types/node@^22.17.0"
  const process = globals.process as NodeJS.Process;
  // @ts-types="npm:@types/node@^22.17.0"
  const fs = await import("node:fs");
  // @ts-types="npm:@types/node@^22.17.0"
  const tty = await import("node:tty");

  // deno-lint-ignore no-inner-declarations
  function readAsync(buffer: Uint8Array, offet: number, length: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
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
    write(chunk: Uint8Array): Promise<number> {
      return new Promise<number>((resolve, reject) => {
        process.stdout.write(chunk, (err) => {
          if (err) {
            reject(err);
          } else {
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
    writeSync(chunk: Uint8Array): number {
      return fs.writeSync(process.stdout.fd, chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return tty.isatty(process.stdout.fd);
    },
    close(): void {},
  };

  stderrValue = {
    /**
     * Writes the specified chunk of data to the stream.
     * @param chunk The data to write.
     */
    write(chunk: Uint8Array): Promise<number> {
      return new Promise<number>((resolve, reject) => {
        process.stderr.write(chunk, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(chunk.length);
          }
        });
      });
    },
    /**
     * Writes the specified chunk of data to the stream synchronously.
     * @param chunk The data to write.
     */
    writeSync(chunk: Uint8Array): number {
      return fs.writeSync(process.stderr.fd, chunk);
    },
    /**
     * Checks if stream is TTY (terminal).
     *
     * @returns True if the stream is a terminal; otherwise, false.
     */
    isTerm(): boolean {
      return tty.isatty(process.stderr.fd);
    },
    close(): void {},
  };

  stdinValue = {
    /**
     * Reads a chunk of data from the stream.
     * @param data The chunk to read data into.
     */
    async read(data: Uint8Array): Promise<number | null> {
      try {
        const count = await readAsync(data, 0, data.length);
        return count === 0 ? null : count;
      } catch (error) {
        const e = error as NodeJS.ErrnoException;
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
    readSync(data: Uint8Array): number | null {
      try {
        const count = fs.readSync(process.stdin.fd, data, 0, data.length, null);
        return count === 0 ? null : count;
      } catch (error) {
        const e = error as NodeJS.ErrnoException;
        if (e.code === "EAGAIN" || e.code === "EOF") {
          return null;
        }
        throw e;
      }
    },
    isTerm(): boolean {
      return tty.isatty(process.stdin.fd);
    },

    /**
     * Closes the stream, if applicable.
     */
    close(): void {},
  };
}

/**
 * The standard input stream of the process. The input
 * stream is a reader that can be used to read data for
 * a process. The file descriptor for the standard input
 * on Unix is 0, and on Windows it is CONIN$.
 */
export const stdin: StdReader = stdinValue;
/**
 * The standard output stream of the process. The output
 * stream is a writer that can be used to write data. The
 * file descriptor for the standard output on Unix is 1,
 * and on Windows it is CONOUT$.
 */
export const stdout: StdWriter = stdoutValue;
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
export const stderr: StdWriter = stderrValue;
