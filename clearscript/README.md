# Neotales.ClearScript

A .NET compatibility layer that runs Neotales TypeScript and JavaScript modules, and the
[js-os](https://github.com/neotales/js-os) modules that ship alongside them, on ClearScript's V8
engine.

The packages are plain .NET libraries with no JavaScript build step of their own. They inject the
host primitives the Neotales modules probe for at runtime, so a bundle that runs under Deno, Node.js,
or Bun runs unchanged on ClearScript.

## Projects

| Project                        | Purpose                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- |
| `src/Neotales.ClearScript`     | The library: engine configuration, host objects, and the embedded JavaScript shim. |
| `src/Neotales.ClearScript.Cli` | A small console runner used by the runtime lab and for local checks.               |

## Quick start

```sh
dotnet build clearscript/src/Neotales.ClearScript.Cli/Neotales.ClearScript.Cli.csproj \
  --configuration=Release

dotnet --roll-forward Major \
  clearscript/src/Neotales.ClearScript.Cli/bin/Release/net8.0/neotales-clearscript.dll \
  bundle.js
```

Embed the library in a host application instead:

```csharp
using Neotales.ClearScript;

await using var engine = NeotalesScriptEngine.Create(new NeotalesEngineOptions
{
    Args = args,
    WorkingDirectory = bundleDirectory,
});

await engine.RunFileAsync(bundlePath);
var report = engine.ReadReport();
```

## How a bundle runs

ClearScript evaluates a classic script, not a module, so a bundle cannot use top-level `await`.
The layer solves this without a module loader:

1. The host objects are added to the engine.
2. An embedded JavaScript shim builds `process`, `node:*` shims, `console`, encoding, and `crypto`.
3. The bundle is executed as a script.
4. If the bundle assigned a promise to `globalThis.__neotalesPromise`, the host awaits it as a .NET
   task before reading the report.

That is the contract the runtime-lab fixtures use, so the same bundle also runs on runtimes with
real top-level `await`. The host also drains cooperative timers, which the shim implements over the
promise queue, so `setTimeout` callbacks scheduled by a bundle complete before the report is read.

## Injected primitives

| Global                                            | Backed by                               | Notes                                                                                                      |
| ------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `process`                                         | `NeotalesSystem`, `NeotalesEnvironment` | `platform`, `pid`, `argv`, `env`, `cwd`, `getuid`, `getBuiltinModule`, and the rest.                       |
| `process.env`                                     | `System.Environment`                    | Live process environment, not a snapshot.                                                                  |
| `process.stdout` / `stderr`                       | `Console.Out` / `Console.Error`         | `write`, `writeSync`, `isTTY`, `columns`, `rows`.                                                          |
| `node:fs`                                         | `System.IO` and `stat(2)`               | A **subset**, not the full module. `stat` is real on Unix. See the gaps below.                             |
| `node:os`                                         | `System` and `Environment`              | A **subset**. `platform`, `arch`, `tmpdir`, `homedir`, `hostname`, `userInfo`, `release`, `uptime`, `EOL`. |
| `node:path`                                       | JavaScript                              | `posix` and `win32` flavors. A **subset**; no `matchesGlob`.                                               |
| `node:util`                                       | JavaScript                              | `promisify`, `format`, `isDeepStrictEqual`. `inspect` is intentionally absent.                             |
| `node:child_process`                              | `System.Diagnostics.Process`            | `spawnSync`, `execSync`, `execFileSync`, `exec`, `execFile`.                                               |
| `node:crypto`                                     | `System.Security.Cryptography`          | `randomBytes`, `randomUUID`, `randomFillSync`, `web`.                                                      |
| `node:module`                                     | —                                       | `createRequire` over the shim registry, so `require("koffi")` fails cleanly.                               |
| `node:stream`                                     | —                                       | `Readable.toWeb` / `Writable.toWeb` throw a clear unsupported error.                                       |
| `console`                                         | `Console.Out` / `Console.Error`         | Replaces ClearScript's native console, which does not reach the host streams.                              |
| `TextEncoder` / `TextDecoder`                     | JavaScript                              | UTF-8 in both directions plus UTF-16LE decoding.                                                           |
| `crypto.getRandomValues` / `randomUUID`           | `RandomNumberGenerator`                 | Real cryptographic randomness.                                                                             |
| `crypto.subtle`                                   | `System.Security.Cryptography`          | `importKey`, `encrypt`, `decrypt` for AES-GCM, and `digest`.                                               |
| `setTimeout`, `queueMicrotask`, `performance.now` | JavaScript                              | Cooperative, drained by the host.                                                                          |

Anything the engine already provides is left in place.

## Deliberate gaps

### `node:*` modules are subsets, not reimplementations

The shim implements the entry points `@neotales/fs` and the other Neotales modules actually
resolve. It is not a full Node compatibility layer. Measured against Node 26.10.0 on
Linux x64:

| Module             | Node exports | Shim provides |
| ------------------ | ------------ | ------------- |
| `node:fs`          | 106          | 60            |
| `node:fs/promises` | 34           | 23            |
| `node:os`          | 24           | 14            |
| `node:path`        | 18           | 16            |
| `fs.constants`     | 60           | 42            |

Not implemented in `node:fs`: `watch`/`watchFile`/`unwatchFile`, `glob`/`globSync`,
`cp`/`cpSync`, `createReadStream`/`createWriteStream`, the `ReadStream`/`WriteStream`/`Dir`/
`Dirent`/`Stats`/`Utf8Stream` classes, `statfs`/`statfsSync`, `fchmod`, `fchown`, `futimes`,
`lchmod`, `lchown`, `lutimes` and their `Sync` forms, `readv`/`writev` and their `Sync` forms,
`openAsBlob`/`openAsBlobSync`, `fdatasync`, `mkdtempDisposableSync`, and `openAsBlob`.

Not implemented in `node:fs/promises`: `constants`, `cp`, `glob`, `lchmod`, `lchown`,
`lutimes`, `mkdtempDisposable`, `statfs`, `utimes`, and `watch`.

Not implemented in `node:os`: `availableParallelism`, `devNull`, `endianness`, `loadavg`,
`machine`, `setPriority`/`getPriority`, `type`, `version`, and `constants`.

Not implemented in `node:path`: `matchesGlob`.

Not implemented in `fs.constants`: the 18 `UV_*` aliases (`UV_FS_*`, `UV_DIRENT_*`), which are
Windows-specific legacy spellings of constants that are already present under their modern names.

`Stat` on Unix is backed by a real `stat(2)` call through .NET's own `libSystem.Native`
shim, which ships inside the runtime, so no extra native dependency is needed. `mode`, `uid`,
`gid`, `ino`, `dev`, and the nanosecond timestamps are all real values, and `ino` is what makes
hard-link identity work. The 120-byte struct layout is documented in
`NativeFileStatus.cs`; it is easy to get wrong, and a wrong layout returns zero inodes without
failing. `blksize` and `blocks` are not part of that record and stay `-1` rather than being
guessed. On Windows the Unix fields stay `-1` and only size and timestamps are reported.

Anything missing fails loudly rather than silently, except where a module probes for an
optional entry point, which is the pattern the Neotales modules use.

### Keeping the counts honest

The `host_globals` scenario records the number of names each shim exposes alongside the count
Node exposes, and compares the pair against a checked-in expectation. Adding or removing coverage
therefore shows up as a failing report rather than as a claim in this file quietly going stale.
Functional behavior is checked the same way: every call is wrapped so a failure is collected into
`errors`, and the expectation requires that array to be empty.

Re-measure after any shim change with:

```sh
node -e 'const k=m=>Object.keys(m).sort();console.log(k(require("node:fs")).length, k(require("node:fs/promises")).length, k(require("node:os")).length, k(require("node:path")).length, k(require("node:fs").constants).length)'
```

### Other gaps

- **No foreign function interface.** The js-os vault modules (`win-cred`, `win-dpapi`,
  `darwin-keychain`, `linux-libsecret`, `win-registry`) need `Deno.dlopen`, `bun:ffi`, `node:ffi`, or
  `koffi`. They load and report themselves unavailable, which is what their `isAvailable()`
  predicates promise. Elevation detection works because its POSIX path only needs
  `process.geteuid`.
- **No `util.inspect`.** A JSON-based approximation would print different strings than Node for
  circular values and `depth` limits, so modules keep using their own portable inspector.
- **No `URL`.** `@neotales/path` already works without it; URL conversion needs a host implementation.
- **Timers are cooperative, not wall-clock.** `setTimeout` callbacks run in registration order as
  the promise queue drains. `setInterval` fires once.
- **`node:stream` file streams are not adapted.** `FsFile.readable` and `FsFile.writable` throw.
- **`.NET 8` is the target framework.** Add a `Directory.Build.props` if the package ships.

## How the runtime lab uses it

`runtime-tests/main.ts` builds the CLI, bundles the scenarios, and runs them:

- `core`, `fmtInspect`, `ansi`, `env`, `moduleFs`, and `secrets` exercise the Neotales modules.
- `jsOs` bundles the sibling js-os repository's JSR modules through an ESM-to-async-IIFE wrapper and
  records how each module behaves.

`docs/RUNTIME_MATRIX.md` records the resulting support matrix and the remaining backlog.
