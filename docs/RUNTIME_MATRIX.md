# Runtime support matrix

This matrix tracks the runtimes that the modules can target in addition to the
fully tested Deno, Node.js, and Bun baseline. It is an evidence matrix, not a claim that
every exported function has passed every runtime.

Last experiment: **2026-09-25**.

## Legend

- **Yes** — a representative automated scenario passes for the documented surface.
- **Partial** — a useful subset or host capability exists, but the module entry point is
  incomplete or the scenario covers only a subpath.
- **No** — the current module has no usable implementation for that runtime.
- **Planned** — technically suitable, but no current scenario or module adapter exists.

The Deno/Node/Bun column is intentionally combined. Those runtimes execute the full
per-module test suites on Linux, macOS, and Windows. New-runtime cells describe only the
scenarios currently automated in `runtime-tests/` and `e2e/`. “Browser” currently means
headless Chromium; Firefox and WebKit remain backlog items.

## Module matrix

| Module    | Deno / Node / Bun | Browser                | Cloudflare workerd          | QuickJS-ng          | txiki.js            | JerryScript         | ClearScript / V8         |
| --------- | ----------------- | ---------------------- | --------------------------- | ------------------- | ------------------- | ------------------- | ------------------------ |
| `args`    | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `chars`   | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `dotenv`  | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `env`     | Yes               | Yes (memory)           | Yes (memory)                | Yes (memory)        | Yes (memory)        | Yes (memory)        | Yes (memory)             |
| `path`    | Yes               | Yes                    | Yes                         | Partial (strings)   | Yes                 | Partial (strings)   | Partial (strings)        |
| `results` | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `slices`  | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `strings` | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                      |
| `ansi`    | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | No                  | Partial                  |
| `fmt`     | Yes               | Partial (`inspect`)    | Planned (`inspect`)         | Partial (`inspect`) | Partial (`inspect`) | Partial (`inspect`) | Partial (`inspect`)      |
| `secrets` | Yes               | Yes                    | Yes                         | No                  | Yes                 | No                  | No                       |
| `fs`      | Yes               | No                     | Partial (Node FS in `/tmp`) | Partial (host only) | Partial (host only) | Planned             | Partial (.NET host only) |
| `process` | Yes               | Partial (experimental) | Partial                     | Planned             | Partial (host only) | Planned             | Partial (.NET host only) |
| `exec`    | Yes               | No                     | No                          | Partial (host only) | Partial (host only) | Planned             | Partial (.NET host only) |

### What the partial cells mean

- **Portable core scenario:** `runtime-tests/scenarios/core.ts` exercises `args`, `chars`,
  `dotenv`, `env`, string-based `path`, `results`, `slices`, and `strings`. It is bundled
  to an ES2020 IIFE and run in QuickJS-ng, JerryScript, and ClearScript. The same scenario
  runs in Chromium and in a workerd configuration with Node compatibility explicitly
  disabled.
- **Path on bare engines:** QuickJS-ng, JerryScript, and a default ClearScript host do not
  provide the browser `URL` global. String path functions work because the implementation
  now guards `URL` before using `instanceof`. URL conversion and current-working-directory
  operations still require a host implementation.
- **ANSI:** the complete `ansi` entry point passes in QuickJS-ng and txiki.js. Its process
  settings currently contain top-level dynamic imports and top-level `await`; JerryScript
  3.0 rejects that module and the simple ClearScript host intentionally does not enable
  module top-level await. The style algorithm itself is portable.
- **Secrets:** the root entry point requires Web Crypto and Web Streams. txiki.js provides
  both and passes. Bare QuickJS-ng, JerryScript, and ClearScript do not provide them by
  default; a host crypto bridge would be required.
- **Filesystem:** workerd passes basic mkdir/write/read/readdir/stat/remove operations with
  `nodejs_compat`. Browsers have no path-based filesystem API. QuickJS-ng's `std`/`os`
  modules and txiki.js's `tjs` filesystem pass separate host probes, but `jsr/fs/globals.ts`
  only recognizes Deno and `process.getBuiltinModule`, so the module cannot use those hosts
  yet. ClearScript can expose `System.IO` through the .NET host, but no bridge exists.
- **Process and exec:** the additional runtimes have useful host APIs, but the current
  modules do not install adapters for them. `jsr/process/streams.ts` and
  `jsr/exec/globals.ts` are the main extension points.

## Automated scenarios

| Scenario                | QuickJS-ng        | txiki.js | JerryScript                | ClearScript          | Browser    | workerd                     |
| ----------------------- | ----------------- | -------- | -------------------------- | -------------------- | ---------- | --------------------------- |
| Portable core modules   | Yes               | Yes      | Yes (ES2020)               | Yes (ES2020)         | Yes        | Yes (no Node compatibility) |
| `fmt/inspect`           | Yes               | Yes      | Yes                        | Yes                  | Yes        | Not covered                 |
| Full `ansi` entry point | Yes               | Yes      | Blocked by top-level await | Not in simple host   | Yes        | Yes                         |
| Web Crypto `secrets`    | Missing host APIs | Yes      | Missing host APIs          | Missing host APIs    | Yes        | Yes                         |
| Native FS host probe    | `std` + `os`      | `tjs`    | Port API possible          | `System.IO` possible | No path FS | Node FS                     |

The host FS probes intentionally test the runtime facility, not `@neotales/fs`. Passing a
host probe therefore does not upgrade the module's matrix cell by itself.

## Commands

The native-engine automation currently targets Linux x64. Prepare pinned alternate runtimes
under `.runtime-lab/`:

```sh
deno task runtime-lab:setup
# Prepare only selected engines:
deno task runtime-lab:setup quickjs
deno task runtime-lab:setup txiki jerry
```

Run all available alternate-runtime scenarios:

```sh
deno task test:runtime-lab
deno task test:runtime-lab quickjs
deno task test:runtime-lab txiki jerry clearscript
```

Run browser and workerd coverage after installing Chromium:

```sh
pnpm exec playwright install chromium
deno task test:e2e
```

Set `NEOTALES_RUNTIME_<NAME>` to use an existing executable. Names are `QUICKJS`, `TXIKI`,
`JERRY`, and `CLEARSCRIPT`; the ClearScript override must point to a built host DLL. Without
that override, the orchestrator builds the checked-in .NET host project. Set
`NEOTALES_RUNTIME_CACHE` to relocate downloaded engines and native build trees.

The Deno orchestrator uses `Deno.Command` rather than shell strings, parses one stable JSON
result marker, compares exact reports, and keeps build/startup errors distinct from
capability mismatches. esbuild lowers syntax for JerryScript and ClearScript; it does not
polyfill URL, encoding, Web Crypto, streams, Intl, or Node built-ins.

## Experimented versions

| Runtime     | Version used                            | Acquisition                         |
| ----------- | --------------------------------------- | ----------------------------------- |
| Deno        | 2.9.7                                   | Existing development tool           |
| Node.js     | 26.10.0 locally; project baseline is 22 | Existing development tool           |
| Bun         | 1.4.2                                   | Existing development tool           |
| QuickJS-ng  | 0.17.0                                  | Checksum-verified Linux x64 release |
| txiki.js    | 26.6.0                                  | Pinned recursive source build       |
| JerryScript | 3.0.0, `es.next` profile                | Pinned source build                 |
| ClearScript | 7.5.1.1                                 | NuGet Linux x64 package             |
| Chromium    | Playwright-managed browser              | Playwright                          |
| workerd     | 1.20260915.1 through Wrangler           | pnpm lockfile                       |

QuickJS-ng, txiki.js, and JerryScript are useful representatives of the bare QuickJS,
modern QuickJS runtime, and highly constrained embedded-engine directions. Original
Bellard QuickJS remains a separate future compatibility target.

## Native integration policy

Deno should orchestrate alternate engines as subprocesses. Directly loading a JavaScript
engine's C API through Deno FFI would expose runtime/context ownership, garbage collection,
callbacks, and module-loader state that are better hidden behind a small native wrapper.

- **QuickJS-ng:** use `std`/`os` first. Add a focused native ES module, or a narrow C wrapper
  behind Deno FFI, only for filesystem, crypto, encoding, or process operations that the
  built-ins do not cover.
- **txiki.js:** use its `tjs` runtime APIs and `tjs:ffi`; keep engine-specific imports out
  of portable bundles.
- **JerryScript:** implement required services through its C port API or a small native
  module. Keep the conformance fixture bundle self-contained.
- **ClearScript:** expose selected .NET capabilities from the checked-in C# host and let
  Deno run that host as a subprocess.
- **All engines:** treat FFI and native modules as trusted host code, validate pointers and
  resource ownership, and keep filesystem/process access capability-gated.

## Implementation backlog

### Completed on this branch

- [x] Add a Deno/TypeScript alternate-runtime orchestrator and pinned setup task.
- [x] Add ES2020 portable-core scenarios for QuickJS-ng, txiki.js, JerryScript, and
      ClearScript.
- [x] Add ANSI, `fmt/inspect`, secrets, QuickJS `std`/`os`, and txiki `tjs` probes.
- [x] Add shared portable-core browser and no-Node-compat workerd coverage.
- [x] Make string path operations safe when the host has no `URL` global.
- [x] Add a CI workflow with native build dependencies, engine caching, ClearScript, and
      browser/workerd execution.
- [x] Keep the matrix and this backlog with the source.

### P1 — replace runtime detection with capability adapters

- [ ] Define internal `FileSystem`, `Process`, and `Environment` provider interfaces rather
      than adding more `Deno`/`process` branches to every function.
- [ ] Keep Deno, Node, and Bun adapters and make selection explicit and testable.
- [ ] Add a txiki.js adapter for `tjs` filesystem, process, environment, and stdio APIs.
- [ ] Add a QuickJS-ng adapter over `std`/`os`; where higher-level filesystem behavior is
      needed, evaluate a small native module or Deno FFI wrapper.
- [ ] Add a ClearScript host bridge backed by `System.IO`, `System.Diagnostics`, and
      `Environment`; expose only the capabilities selected by the host.
- [ ] Define unsupported-operation errors and a capabilities API so applications can
      choose async, sync, POSIX, path-based, or storage-backed behavior.

### P1 — remove engine-hostile process stream initialization

- [ ] Refactor `jsr/process/streams.ts` so importing it does not use top-level `await` or
      unconditional dynamic `node:` imports.
- [ ] Introduce injectable stdout/stderr/stdin providers and lazy Node initialization.
- [ ] Add a JerryScript provider using its port layer or a tiny C module.
- [ ] Add a QuickJS-ng provider using `std.out`, `std.err`, and `os` handles.
- [ ] Add a txiki.js and ClearScript provider, then rerun the full `ansi` and root `fmt`
      scenarios.

### P1 — make `fs` capability-aware

- [ ] Separate portable path/stat/walk algorithms from runtime I/O.
- [ ] Implement the shared async provider for txiki.js and QuickJS-ng first.
- [ ] Add a workerd provider that uses Node compatibility when enabled and a documented
      in-memory/ephemeral implementation when it is not.
- [ ] Add browser adapters for OPFS and the File System Access API behind capability
      checks; do not present path-based POSIX semantics where they do not exist.
- [ ] Gate chmod/chown/uid/gid/umask/symlink operations by host capability.
- [ ] Implement missing `FsFile` operations such as `lock`, `unlock`, and `setRaw` where
      the host can support them.

### P1 — support `exec` only where a real process API exists

- [ ] Add txiki.js child-process support through its runtime APIs.
- [ ] Add QuickJS-ng support through `os.exec` plus the filesystem adapter.
- [ ] Add a controlled ClearScript bridge only if hosting untrusted scripts is an accepted
      threat model.
- [ ] Keep browser/workerd execution explicitly unsupported.

### P2 — supply missing Web primitives to embedded hosts

- [ ] Document whether URL, TextEncoder/TextDecoder, Web Crypto, and streams belong in the
      root API or runtime-specific subpaths.
- [ ] Add host implementations for QuickJS-ng and JerryScript, or provide tested polyfills
      as optional host setup rather than silently changing module semantics.
- [ ] Add an optional ClearScript Web Crypto/encoding bridge.
- [ ] Keep `secrets` free of Node-only imports outside its explicit `node` subpath.

### P2 — test publishable artifacts, not only JSR source

- [ ] Bundle the generated npm ESM packages through the same core scenario.
- [ ] Smoke-build every JSR and npm export, including host-only subpaths.
- [ ] Add Firefox and WebKit through Playwright.
- [ ] Test original Bellard QuickJS separately from QuickJS-ng.
- [ ] Add capability probes for `Intl`, resource limits, workers, and async iteration.

### P3 — release policy

- [x] Run fast browser/workerd conformance on pull requests.
- [ ] Run the native-engine workflow weekly and before releases.
- [ ] Require all currently promoted cells to pass before publishing a new module version.
- [ ] Promote a partial cell only after its documented public surface, not just a host
      probe, passes in that runtime.

## References

- [QuickJS-ng](https://github.com/quickjs-ng/quickjs)
- [Original QuickJS](https://bellard.org/quickjs/)
- [txiki.js](https://github.com/saghul/txiki.js)
- [JerryScript](https://github.com/jerryscript-project/jerryscript)
- [ClearScript](https://github.com/ClearFoundry/ClearScript)
- [Cloudflare Workers Node compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
