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

| Module    | Deno / Node / Bun | Browser                | Cloudflare workerd          | QuickJS-ng          | txiki.js            | JerryScript         | ClearScript / V8    |
| --------- | ----------------- | ---------------------- | --------------------------- | ------------------- | ------------------- | ------------------- | ------------------- |
| `args`    | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `chars`   | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `dotenv`  | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `env`     | Yes               | Yes (memory)           | Yes (memory)                | Yes (`std`)         | Yes (memory)        | Yes (memory)        | Yes (.NET process)  |
| `path`    | Yes               | Yes                    | Yes                         | Partial (strings)   | Yes                 | Partial (strings)   | Partial (strings)   |
| `results` | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `slices`  | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `strings` | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `ansi`    | Yes               | Yes                    | Yes                         | Yes                 | Yes                 | Yes                 | Yes                 |
| `fmt`     | Yes               | Partial (`inspect`)    | Planned (`inspect`)         | Partial (`inspect`) | Partial (`inspect`) | Partial (`inspect`) | Partial (`inspect`) |
| `secrets` | Yes               | Yes                    | Yes                         | No                  | Yes                 | No                  | Yes (host `subtle`) |
| `fs`      | Yes               | No                     | Partial (Node FS in `/tmp`) | Partial (host only) | Partial (host only) | Planned             | Yes (`System.IO`)   |
| `process` | Yes               | Partial (experimental) | Partial                     | Planned             | Partial (host only) | Planned             | Partial (.NET host) |
| `exec`    | Yes               | No                     | No                          | Partial (host only) | Partial (host only) | Planned             | Partial (.NET host) |

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
- **Environment:** QuickJS-ng's `std` module supplies `getenv`, `setenv`, `unsetenv`, and
  `getenviron`; the Deno orchestrator runs the module scenario with `--std` and verifies
  inherited, assigned, enumerated, and removed values. `Neotales.ClearScript` injects a live
  `process.env` backed by `System.Environment` and passes the same scenario. Browsers, workerd,
  and txiki.js use the module's in-memory fallback until their native providers are added. A
  workerd scenario already proves that `import { env } from "cloudflare:workers"` exposes a live
  string binding and that the existing `expand(..., { get })` override can consume it.
- **ANSI:** the complete `ansi` entry point now passes in QuickJS-ng, txiki.js, JerryScript, and
  ClearScript. The only load-time blocker was top-level `await import("node:fs")` and
  `await import("node:tty")` in `jsr/process/streams.ts`; those are now resolved synchronously
  through `process.getBuiltinModule`, so the module is a plain script again. Hosts without a Node
  filesystem accessor get an explicit error rather than an unresolved import.
- **Secrets:** the root entry point requires Web Crypto. txiki.js provides it and passes.
  `Neotales.ClearScript` adds `crypto.getRandomValues`, `crypto.randomUUID`, and an AES-GCM
  `crypto.subtle` backed by `System.Security.Cryptography`, which is enough for the root entry
  point. Bare QuickJS-ng and JerryScript do not provide Web Crypto, so a host crypto bridge
  would be required there.
- **Filesystem:** `@neotales/fs` now passes unmodified on ClearScript, because
  `Neotales.ClearScript` implements the Node filesystem surface over `System.IO` and
  `jsr/fs/globals.ts` already looks for `process.getBuiltinModule`. workerd passes basic
  mkdir/write/read/readdir/stat/remove operations with `nodejs_compat`. Browsers have no
  path-based filesystem API. QuickJS-ng's `std`/`os` modules and txiki.js's `tjs` filesystem
  still only pass separate host probes, so the module cannot use those hosts yet.
- **Process and exec:** `Neotales.ClearScript` injects `process.stdout`/`stderr` over
  `Console.Out`/`Console.Error` and a `node:child_process` module over
  `System.Diagnostics.Process`. The other embedded runtimes still have no installed adapter;
  `jsr/process/streams.ts` and `jsr/exec/globals.ts` are the extension points.
- **js-os:** the sibling repository's modules load on ClearScript. `is-elevated` answers
  correctly because its POSIX path only needs `process.geteuid`. The vault modules need a
  foreign function interface, which ClearScript does not provide, so they load and report
  themselves unavailable through their `isAvailable()` predicates.

## Automated scenarios

| Scenario                | QuickJS-ng        | txiki.js    | JerryScript | ClearScript               | Browser     | workerd                     |
| ----------------------- | ----------------- | ----------- | ----------- | ------------------------- | ----------- | --------------------------- |
| Portable core modules   | Yes               | Yes         | Yes         | Yes (ES2020)              | Yes         | Yes (no Node compatibility) |
| `fmt/inspect`           | Yes               | Yes         | Yes         | Yes                       | Yes         | Not covered                 |
| Environment provider    | Yes (`std`)       | Memory      | Memory      | Yes (`.NET` process)      | Memory      | Binding override            |
| Full `ansi` entry point | Yes               | Yes         | Yes         | Yes                       | Yes         | Yes                         |
| Web Crypto `secrets`    | Missing host APIs | Yes         | Missing     | Yes (host `subtle`)       | Yes         | Yes                         |
| `fs` module             | Planned           | Planned     | Planned     | Yes (`System.IO`)         | No          | Partial                     |
| js-os module load       | Not covered       | Not covered | Not covered | Yes (elevation; FFI gaps) | Not covered | Not covered                 |
| Native FS host probe    | `std` + `os`      | `tjs`       | Port API    | Not needed                | No path FS  | Node FS                     |

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

Run a bundle directly on the .NET host:

```sh
dotnet build clearscript/src/Neotales.ClearScript.Cli/Neotales.ClearScript.Cli.csproj \
  --configuration=Release
dotnet --roll-forward Major \
  clearscript/src/Neotales.ClearScript.Cli/bin/Release/net8.0/neotales-clearscript.dll \
  bundle.js
```

Run browser and workerd coverage after installing Chromium:

```sh
pnpm exec playwright install chromium
deno task test:e2e
```

Set `NEOTALES_RUNTIME_<NAME>` to use an existing executable. Names are `QUICKJS`, `TXIKI`,
`JERRY`, and `CLEARSCRIPT`; the ClearScript override must point to a built
`neotales-clearscript.dll`. Without that override, the orchestrator builds
`clearscript/src/Neotales.ClearScript.Cli`. Set `NEOTALES_RUNTIME_CACHE` to relocate downloaded
engines and native build trees, and `NEOTALES_JS_OS` to point at the sibling js-os repository,
which defaults to `../js-os`.

The Deno orchestrator uses `Deno.Command` rather than shell strings, parses one stable JSON
result marker, compares exact reports, and keeps build/startup errors distinct from
capability mismatches. esbuild lowers syntax for JerryScript and ClearScript; it does not
polyfill URL, encoding, Web Crypto, streams, Intl, or Node built-ins.

Two bundling shapes are used. Most scenarios are IIFE bundles, which run as classic scripts
everywhere. Bundles that contain top-level `await`, which esbuild cannot emit as an IIFE, are
emitted as ESM and rewritten by the harness into an async IIFE that publishes
`globalThis.__neotalesPromise`; the ClearScript host awaits that promise. The rewrite also
binds static `node:` imports through `process.getBuiltinModule` and defines `import.meta.url`.
The wrapper fails loudly when a bundle needs a module statement it cannot express.

### Testing strategy per runtime

| Runtime     | How it is tested                                                         | What a pass means                                                                                                                          |
| ----------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| QuickJS-ng  | Pinned release binary, es2020 IIFE bundles, `--std` for the env provider | The portable core, `fmt/inspect`, `ansi`, env, and a raw `std`/`os` filesystem probe pass.                                                 |
| txiki.js    | Pinned source build, es2020 IIFE bundles, an es2022 bundle for `secrets` | The portable core, `fmt/inspect`, `ansi`, `secrets`, and a raw `tjs` filesystem probe pass.                                                |
| JerryScript | Pinned source build, es2020 IIFE bundles                                 | The portable core, `fmt/inspect`, and the full `ansi` entry point pass, so the module graph has no top-level `await`.                      |
| ClearScript | `neotales-clearscript` CLI, es2020 IIFE plus an es2022 bundle            | The portable core, `fmt/inspect`, `ansi`, `env`, the `fs` module, `secrets`, and the js-os module load all pass against .NET host objects. |
| js-os       | Sibling repository modules bundled into the ClearScript run              | Elevation detection answers correctly; every vault module loads and reports itself unavailable.                                            |
| Browser     | Playwright Chromium, module scripts                                      | Portable core, `fmt/inspect`, `ansi`, and `secrets` pass in a real browser.                                                                |
| workerd     | Wrangler with and without `nodejs_compat`                                | Portable core and env bindings pass with Node compatibility disabled; `ansi`, `fs`, and `secrets` pass with it enabled.                    |

Every scenario is a shared module under `runtime-tests/scenarios/`, bundled per runtime, and
compared against a single expected report. Host capability probes are labeled separately from
module support so a passing host probe never upgrades a matrix cell on its own.

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
- **ClearScript:** use the `Neotales.ClearScript` package under `clearscript/`. It configures
  V8 with task-promise conversion and dynamic module imports, injects .NET-backed host
  objects, and awaits promises published by classic-script bundles. Deno orchestrates the CLI
  as a subprocess. See `clearscript/README.md`.
- **All engines:** treat FFI and native modules as trusted host code, validate pointers and
  resource ownership, and keep filesystem/process access capability-gated.

## Implementation backlog

### Completed on this branch

- [x] Add a Deno/TypeScript alternate-runtime orchestrator and pinned setup task.
- [x] Add ES2020 portable-core scenarios for QuickJS-ng, txiki.js, JerryScript, and
      ClearScript.
- [x] Add ANSI, `fmt/inspect`, secrets, QuickJS `std`/`os`, and txiki `tjs` probes.
- [x] Connect `@neotales/env` to QuickJS-ng's `std` environment primitives and verify them.
- [x] Verify Cloudflare `env` binding access through the existing expansion override.
- [x] Add shared portable-core browser and no-Node-compat workerd coverage.
- [x] Make string path operations safe when the host has no `URL` global.
- [x] Add a CI workflow with native build dependencies, engine caching, ClearScript, and
      browser/workerd execution.
- [x] Keep the matrix and this backlog with the source.
- [x] Build `Neotales.ClearScript`, a .NET compatibility package that injects `process`,
      `process.env`, `node:fs`, `node:os`, `node:path`, `node:util`, `node:child_process`,
      `node:crypto`, `console`, encoding, and a Web Crypto subset, and that awaits promises
      published by classic-script bundles.
- [x] Load the js-os modules on ClearScript: elevation detection works through
      `process.geteuid`, and the vault modules load and report themselves unavailable.
- [x] Remove top-level `await` from `jsr/process/streams.ts` so the full `ansi` entry point
      loads in JerryScript, and keep it working on Node.js, Bun, and Deno.
- [x] Cover the full `ansi` entry point in JerryScript and ClearScript.

### P1 — replace runtime detection with capability adapters

- [ ] Define internal `FileSystem`, `Process`, and `Environment` provider interfaces rather
      than adding more `Deno`/`process` branches to every function.
- [ ] Keep Deno, Node, and Bun adapters and make selection explicit and testable.
- [ ] Add a txiki.js adapter for `tjs` filesystem, process, environment, and stdio APIs.
- [ ] Add a QuickJS-ng adapter over `std`/`os`; where higher-level filesystem behavior is
      needed, evaluate a small native module or Deno FFI wrapper.
- [x] Add a ClearScript host bridge backed by `System.IO`, `System.Diagnostics`, and
      `Environment` through the `Neotales.ClearScript` package.
- [ ] Express those bridges as provider interfaces the shared algorithms can consume, so the
      ClearScript, txiki.js, and QuickJS-ng adapters are selectable rather than ambient.
- [ ] Define unsupported-operation errors and a capabilities API so applications can
      choose async, sync, POSIX, path-based, or storage-backed behavior.

### P1 — add explicit environment providers

- [x] Add a QuickJS-ng provider backed by `std.getenv`, `std.setenv`, `std.unsetenv`, and
      `std.getenviron`.
- [ ] Add a workerd adapter for bindings from `import { env } from "cloudflare:workers"`.
      This is a live binding object, not a mutable process environment; model it as read-only
      and define explicit behavior for `set` and `remove`. Keep that import out of the
      portable module graph; use a worker-specific entry point or
      an injected environment provider so browser bundles do not acquire a Node/Worker-only
      dependency.
- [ ] Add a txiki.js provider for its runtime environment API, and a JerryScript provider
      backed by its port/native layer.
- [x] Build `Neotales.ClearScript`, which injects `Environment`, `System.IO`, process, crypto,
      and encoding primitives so vanilla ClearScript has a real environment.
- [ ] Expose environment capability and read-only/writeable semantics so Worker bindings and
      browser memory are not mistaken for a mutable process environment.

### P1 — remove engine-hostile process stream initialization

- [x] Resolve `node:fs` and `node:tty` in `jsr/process/streams.ts` through
      `process.getBuiltinModule` instead of top-level `await import`, with an explicit error
      when the host cannot provide them. The full `ansi` entry point now loads in JerryScript
      and in an IIFE bundle, and still works on Node.js, Bun, and Deno.
- [ ] Introduce injectable stdout/stderr/stdin providers and lazy Node initialization.
- [ ] Add a JerryScript provider using its port layer or a tiny C module.
- [ ] Add a QuickJS-ng provider using `std.out`, `std.err`, and `os` handles.
- [ ] Add a JerryScript port provider for stdio. ANSI already passes on a host with no stdio
      because `stdout.isTerm()` returns false; writing output still needs a provider.
- [x] Add a ClearScript provider. `Neotales.ClearScript` injects `process.stdout`/`stderr`
      over `Console.Out`/`Console.Error` with a working `tty.isatty`.
- [ ] Add a txiki.js provider, then rerun the full root `fmt` scenario there.

### P1 — make `fs` capability-aware

- [ ] Separate portable path/stat/walk algorithms from runtime I/O.
- [x] Prove the `node:fs`-shaped provider shape. `Neotales.ClearScript` implements the Node
      filesystem surface over `System.IO` and the unmodified `jsr/fs` module passes, which
      gives the shared provider a concrete target signature.
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
- [x] Add a ClearScript bridge over `System.Diagnostics.Process` in `Neotales.ClearScript`,
      covering `spawnSync`, `execSync`, `execFileSync`, `exec`, and `execFile`.
- [ ] Gate that bridge behind an explicit host option so embedding untrusted scripts is a
      deliberate choice rather than a default.
- [ ] Keep browser/workerd execution explicitly unsupported.

### P2 — supply missing Web primitives to embedded hosts

- [ ] Document whether URL, TextEncoder/TextDecoder, Web Crypto, and streams belong in the
      root API or runtime-specific subpaths.
- [ ] Add host implementations for QuickJS-ng and JerryScript, or provide tested polyfills
      as optional host setup rather than silently changing module semantics.
- [x] Add an optional ClearScript Web Crypto/encoding bridge. `Neotales.ClearScript` supplies
      `TextEncoder`, `TextDecoder`, `crypto.getRandomValues`, `crypto.randomUUID`, and an
      AES-GCM `crypto.subtle` backed by `System.Security.Cryptography`, which is enough for the
      root `secrets` entry point.
- [ ] Keep `secrets` free of Node-only imports outside its explicit `node` subpath.

### P2 — test publishable artifacts, not only JSR source

- [x] Bundle the generated npm ESM packages through the same core scenario. The runtime lab
      resolves `@neotales/*` subpaths to the generated `npm/` output, so the `ansi` scenario
      that now loads without top-level `await` also exercises the published `streams.js`.
- [x] Exercise the js-os modules from the sibling repository rather than a copy, through an
      ESM-to-async-IIFE wrapper that also covers `import.meta` and static `node:` imports.
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
