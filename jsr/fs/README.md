# @neotales/fs

## Overview

A cross-runtime filesystem module for Deno, Node.js, and Bun. The API is influenced by
`@std/fs`, while also exposing lower-level file, metadata, and POSIX helpers.

## Documentation

Documentation is available on [JSR](https://jsr.io/@neotales/fs/doc).

## Installation

```bash
# Deno
deno add jsr:@neotales/fs

# npm from jsr
npx jsr add @neotales/fs

# from npmjs.org
npm install @neotales/fs
```

## Usage

```typescript
import { mkdir, rm, writeTextFile } from "@neotales/fs";

await mkdir("/home/my_user/test");
await writeTextFile("/home/my_user/test/log.txt", "ello");
await rm("/home/my_user/test", { recursive: true });
```

## API Reference

### Classes

| Class                | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `AlreadyExistsError` | An error thrown when a file already exists             |
| `FsFile`             | The file handle type returned by `open` and `openSync` |
| `NotFoundError`      | An error thrown when a file or directory is not found  |

### File Operations

| Function                                  | Description                                                   |
| ----------------------------------------- | ------------------------------------------------------------- |
| `open(path, options?)`                    | Opens a file and returns an `FsFile` for streaming operations |
| `openSync(path, options?)`                | Synchronous version of `open`                                 |
| `readFile(path)`                          | Reads file contents as `Uint8Array` (binary)                  |
| `readFileSync(path)`                      | Synchronous version of `readFile`                             |
| `readTextFile(path)`                      | Reads file contents as UTF-8 string                           |
| `readTextFileSync(path)`                  | Synchronous version of `readTextFile`                         |
| `writeFile(path, data, options?)`         | Writes `Uint8Array` (binary) to a file                        |
| `writeFileSync(path, data, options?)`     | Synchronous version of `writeFile`                            |
| `writeTextFile(path, data, options?)`     | Writes string to a file as UTF-8                              |
| `writeTextFileSync(path, data, options?)` | Synchronous version of `writeTextFile`                        |
| `copyFile(src, dest)`                     | Copies a file from source to destination                      |
| `copyFileSync(src, dest)`                 | Synchronous version of `copyFile`                             |
| `copy(src, dest, options?)`               | Copies a file, directory, or symlink                          |
| `copySync(src, dest, options?)`           | Synchronous version of `copy`                                 |
| `move(src, dest, options?)`               | Moves a file, directory, or symlink                           |
| `moveSync(src, dest, options?)`           | Synchronous version of `move`                                 |
| `rename(oldPath, newPath)`                | Renames a file, directory, or symlink                         |
| `renameSync(oldPath, newPath)`            | Synchronous version of `rename`                               |
| `rm(path, options?)`                      | Deletes a file, directory, or symlink                         |
| `rmSync(path, options?)`                  | Synchronous version of `rm`                                   |

```typescript
import { copy, readTextFile, rm, writeTextFile } from "@neotales/fs";

// Read and write text files
const content = await readTextFile("./config.json");
await writeTextFile("./backup.json", content);

// Copy files or directories
await copy("./src", "./dist", { overwrite: true });

// rm with recursive option for directories
await rm("./temp", { recursive: true });
```

### Directory Operations

| Function                    | Description                                    |
| --------------------------- | ---------------------------------------------- |
| `mkdir(path, options?)`     | Creates a new directory                        |
| `mkdirSync(path, options?)` | Synchronous version of `mkdir`                 |
| `mkdtemp(options?)`         | Creates a temporary directory                  |
| `mkdtempSync(options?)`     | Synchronous version of `mkdtemp`               |
| `mktemp(options?)`          | Creates a temporary file                       |
| `mktempSync(options?)`      | Synchronous version of `mktemp`                |
| `readdir(path)`             | Returns an async iterator of directory entries |
| `readdirSync(path)`         | Returns a sync iterator of directory entries   |
| `emptyDir(path)`            | rms all contents of a directory                |
| `emptyDirSync(path)`        | Synchronous version of `emptyDir`              |
| `cwd()`                     | Gets the current working directory             |

```typescript
import { emptyDir, mkdir, mkdtemp, readdir } from "@neotales/fs";

// Create directories
await mkdir("./data/logs", { recursive: true });

// Iterate directory contents
for await (const entry of readdir("./src")) {
  console.log(entry.name, entry.isDirectory ? "📁" : "📄");
}

// Create and clean temp directories
const tmpDir = await mkdtemp({ prefix: "my-app-" });
await emptyDir(tmpDir);
```

### Ensure Operations

| Function                       | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `ensureDir(path)`              | Ensures a directory exists, creating it if needed |
| `ensureDirSync(path)`          | Synchronous version of `ensureDir`                |
| `ensureFile(path)`             | Ensures a file exists, creating it if needed      |
| `ensureFileSync(path)`         | Synchronous version of `ensureFile`               |
| `ensureSymlink(src, dest)`     | Ensures a symlink exists, creating it if needed   |
| `ensureSymlinkSync(src, dest)` | Synchronous version of `ensureSymlink`            |

```typescript
import { ensureDir, ensureFile } from "@neotales/fs";

// Create directory and all parents if they don't exist
await ensureDir("./data/cache/images");

// Create file and parent directories if needed
await ensureFile("./logs/app.log");
```

### Existence & Type Checks

| Function           | Description                              |
| ------------------ | ---------------------------------------- |
| `exists(path)`     | Checks if a file or directory exists     |
| `existsSync(path)` | Synchronous version of `exists`          |
| `isDir(path)`      | Checks if path exists and is a directory |
| `isDirSync(path)`  | Synchronous version of `isDir`           |
| `isFile(path)`     | Checks if path exists and is a file      |
| `isFileSync(path)` | Synchronous version of `isFile`          |

```typescript
import { exists, isDir, isFile } from "@neotales/fs";

if (await exists("./config.json")) {
  console.log("Config found");
}

if (await isDir("./src")) {
  console.log("Source directory exists");
}
```

### File System Info

| Function          | Description                               |
| ----------------- | ----------------------------------------- |
| `stat(path)`      | Gets file system information for a path   |
| `statSync(path)`  | Synchronous version of `stat`             |
| `lstat(path)`     | Gets file info without following symlinks |
| `lstatSync(path)` | Synchronous version of `lstat`            |

```typescript
import { stat } from "@neotales/fs";

const info = await stat("./package.json");
console.log(`Size: ${info.size} bytes`);
console.log(`Modified: ${info.mtime}`);
console.log(`Is file: ${info.isFile}`);
```

### Links

| Function                 | Description                        |
| ------------------------ | ---------------------------------- |
| `link(src, dest)`        | Creates a hard link                |
| `linkSync(src, dest)`    | Synchronous version of `link`      |
| `symlink(src, dest)`     | Creates a symbolic (soft) link     |
| `symlinkSync(src, dest)` | Synchronous version of `symlink`   |
| `readlink(path)`         | Reads the target path of a symlink |
| `readlinkSync(path)`     | Synchronous version of `readlink`  |

```typescript
import { readlink, symlink } from "@neotales/fs";

await symlink("./config.json", "./config-link.json");
const target = await readlink("./config-link.json");
console.log(`Links to: ${target}`);
```

### Permissions & Ownership (POSIX)

| Function                        | Description                           |
| ------------------------------- | ------------------------------------- |
| `chmod(path, mode)`             | Changes file/directory permissions    |
| `chmodSync(path, mode)`         | Synchronous version of `chmod`        |
| `chown(path, uid, gid)`         | Changes file/directory owner          |
| `chownSync(path, uid, gid)`     | Synchronous version of `chown`        |
| `utime(path, atime, mtime)`     | Changes access and modification times |
| `utimeSync(path, atime, mtime)` | Synchronous version of `utime`        |
| `uid()`                         | Gets the current user's user ID       |
| `gid()`                         | Gets the current user's group ID      |

```typescript
import { chmod, chown, gid, uid } from "@neotales/fs";

// Change permissions (owner: rwx, group: rx, others: rx)
await chmod("./script.sh", 0o755);

// Change ownership to current user
await chown("./data", uid(), gid());
```

### Glob & Walking

| Function                         | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `expandGlob(glob, options?)`     | Async iterator for files matching glob pattern |
| `expandGlobSync(glob, options?)` | Synchronous version of `expandGlob`            |
| `walk(path, options?)`           | Recursively walks a directory tree             |
| `walkSync(path, options?)`       | Synchronous version of `walk`                  |

```typescript
import { expandGlob, walk } from "@neotales/fs";

// Find all TypeScript files
for await (const file of expandGlob("**/*.ts")) {
  console.log(file.path);
}

// Walk directory with filters
for await (const entry of walk("./src", { exts: [".ts"], skip: [/node_modules/] })) {
  console.log(entry.path);
}
```

### Error Handling

| Function                      | Description                                  |
| ----------------------------- | -------------------------------------------- |
| `isNotFoundError(error)`      | Checks if error is a "not found" error       |
| `isAlreadyExistsError(error)` | Checks if error is an "already exists" error |

```typescript
import { isAlreadyExistsError, isNotFoundError, readFile } from "@neotales/fs";

try {
  await readFile("./missing.txt");
} catch (error) {
  if (isNotFoundError(error)) {
    console.log("File does not exist");
  }
}
```

## Runtime Notes

On Bun, this package uses Node-compatible filesystem behavior for consistent semantics.
`Bun.file` and `Bun.write` are suitable future fast paths only for default asynchronous
reads, writes, and copies; operations with append, exclusive creation, modes, abort
signals, and all directory operations must retain the compatibility path.

Cloudflare Workers can use this package only with Node.js filesystem compatibility
enabled. Workers exposes an in-memory virtual filesystem: `/bundle` is read-only and
`/tmp` is writable but request-scoped, ephemeral, and nonpersistent. Use R2, KV, D1,
or Durable Objects for durable data. Do not rely on ownership, permissions, timestamps,
TTYs, hard links, or filesystem durability in Workers.

Browsers and runtimes without Deno or Node-compatible filesystem support can import the
module, but filesystem operations throw when called.

## License

[MIT License](./LICENSE.md)

[Deno MIT License](https://jsr.io/@std/fs/1.0.14/LICENSE)
