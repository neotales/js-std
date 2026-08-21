# Roadmap

Planned and in-progress work for the Neotales JavaScript Standard Libraries.
Modules follow the upstream Frosty Yeti workspace order (`deno task modules`).

## Imported Modules

These modules are imported from upstream, adapted for `@neotales`, tested
across Deno, Node, and Bun, and published to JSR and npm.

| Module | Status | Description |
|--------|--------|-------------|
| `chars` | Imported | Character classification and code point utilities |
| `slices` | Imported | Array and typed array utilities |
| `strings` | Imported | String utilities |
| `path` | Imported | Cross-platform path manipulation |
| `process` | Imported | Process and platform information |
| `fs` | Imported | Cross-runtime filesystem utilities |
| `args` | Imported | Command-line argument parsing |
| `env` | Imported | Environment variable access and expansion |
| `dotenv` | Imported | `.env` file loading |
| `exec` | Imported | Cross-runtime child process execution and `which` |
| `ansi` | Imported | ANSI escape sequences and styling |
| `secrets` | Imported | Protected secret handling |
| `fmt` | Imported | Formatting utilities |

## Pending Upstream Imports

| Module | Status | Description |
|--------|--------|-------------|
| `ci-env` | Pending | CI provider environment detection |

`is-process-elevated` was renamed upstream to `is-elevated` and moved to the
[js-os](https://github.com/frostyeti/js-os) repository because privilege
elevation requires extra CI/CD tooling that does not fit this workspace. It is
no longer planned for import here.

## Planned Modules

### `exec-script`

A cross-runtime module for executing shell scripts, modeled on
[@bearz/shells](https://github.com/bearz-io/js/tree/main/%40bearz/shells) and
the per-language runners in
[cast's scriptx](https://github.com/frostyeti/cast/tree/master/internal/scriptx).

The module exists to run inline scripts or script files through a registry of
shell and language handlers built on top of `@neotales/exec`, so callers use
one API regardless of the target interpreter.

Target handlers:

- `bash`
- `sh`
- `cmd`
- `powershell`
- `pwsh`
- `python`
- `ruby` (experimental)
- `node`
- `bun`
- `deno`
- `tsx`

Key capabilities:

- `script(source, options?)` runs an inline script with a default shell chosen
  by platform (PowerShell on Windows, bash/sh elsewhere).
- Per-shell helpers such as `bashScript`, `pwshScript`, and `pythonScript`.
- Script files executed with the matching interpreter, including argument
  forwarding.
- Extensible handler registry so additional shells and languages can be added
  by consumers.
- Full integration with `Command` output modes: piped capture, inherited
  stdio, `text()`, `lines()`, `json()`, piping, and validation.

See [PLAN.md](./PLAN.md) for the implementation plan.

### `log`

A high-performance structured logging module with pluggable sinks. Core
principles: structured events over string interpolation, minimal allocations
on the hot path, and no required configuration to get started.

Built-in sinks:

- `console` - human-readable console output.
- `memory` - in-process ring buffer that keeps a configurable maximum number
  of log events, useful for tests and diagnostics.
- `null` - discards all events; the default when logging is disabled.

Community/plugin sinks (separate entry points so unused sinks tree-shake):

- `file` - append-only file sink with rotation hooks.
- `json` - one JSON object per event for machine consumption.
- `otel` - OpenTelemetry Logs export bridge.

Core features:

- Structured logging: message plus arbitrary key/value attributes.
- Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.
- Categories/namespaces attached to each logger for scoping.
- Filtering by level and category, including per-category overrides.
- Formatting: built-in text formatter plus custom formatter support.
- Sinks implement a small interface so community packages can add targets
  without touching core.
- Cross-runtime (Deno, Node, Bun) like every other module; no dependencies on
  runtime-specific logging APIs.

### `di`

A reflection-free dependency injection module. TypeScript runtimes lack
reliable runtime type metadata (no equivalent of C# attribute reflection that
works uniformly across Deno, Node, and Bun), so wiring is done with explicit
typed factories instead of reflective containers - the same direction as
compile-time DI in .NET such as
[Pure.DI](https://github.com/amis92/csharp-source-generators) and Jab from the
[source generator DI list](https://github.com/amis92/csharp-source-generators),
but simpler: no compiler plugin required.

Core ideas:

- A `Container`/`Scope` built from plain factory functions:
  `register(name, factory)` where factories receive already-resolved
  dependencies as a typed object.
- Lifetimes: singleton, scoped, transient.
- Composition roots are ordinary functions, hand-written or generated.
- Optional codegen (an `eng/` build step, not a runtime mechanism): scan a
  manifest or JSDoc annotations and emit a typed composition root module -
  analogous to C# source generators but far less complex, since it runs at
  build time over plain TS sources.
- No decorators, no `Reflect.metadata`, no Proxy-based property injection;
  errors surface at compile time in generated code wherever possible.

### `plugin`

A plugin architecture for composing applications from swappable components,
where services, adapters, and features are all plugins. Informed by
[Cordis](https://github.com/cordiverse/cordis), the meta-framework behind
Koishi (4 years, 4,000+ community plugins) and DeepSeek Harness, whose design
is formalized in _A Programming Paradigm for Spatiotemporal Composability_
([paper](https://github.com/cordiverse/paper)).

What we adopt from Cordis:

- **Revertible effects** (temporal composability): every registration returns
  a disposer; unloading a plugin composes disposers in reverse order so
  teardown is complete by construction. This matches the disposal patterns
  already used in `exec` (`await using` child processes).
- **Declared dependencies** (spatial composability): plugins declare what
  they `provide` and `require` by key; a plugin only starts when its
  requirements are satisfied and is stopped when a requirement disappears,
  with dependents torn down first.
- Lifecycle events (`setup`, `ready`, `dispose`) and hierarchical scopes.

What we deliberately do not adopt:

- Cordis's Proxy-based context access and reactive service interception -
  too much hidden runtime behavior for a std library, and its v4 API is
  explicitly unstable.
- Runtime service-location as the primary resolution path; instead, plugin
  services resolve through the `di` module's typed factories, keeping the
  graph visible and debuggable. Cordis demonstrates the concepts compose;
  this pairing shows they mesh without reflection.

The core stays reflection-free, but the module exposes a plugin interface for
DI itself so a reflective or decorator-based resolver can be added later as an
opt-in package once runtime metadata support across Deno, Node, and Bun makes
it worthwhile.

### `metrics`

A metrics module paired with `log`: counters, gauges, and histograms with
minimal allocation on the recording path. Exports follow OpenTelemetry
naming so instruments map cleanly when bridged. Includes in-memory
aggregation plus reader/exporter interfaces; the `otel` package below is the
primary exporter.

### `otel`

First-party OpenTelemetry support instead of depending on the heavyweight
`@opentelemetry/sdk-node`, which pulls far more than most applications need.
Split into small packages by target so unused pieces tree-shake:

- `@neotales/otel-cli` - minimal tracing/metrics bootstrap for CLIs and short
  lived processes; low startup cost, OTLP export over HTTP.
- `@neotales/otel-web` - middleware/integration helpers for web servers:
  request tracing spans, standard HTTP attributes, graceful shutdown flush.
- `@neotales/otel-workers` - Cloudflare Workers-compatible build using fetch-
  based exporters only, no Node APIs, validated through the `e2e/` workerd
  harness like other modules.

All three consume the shared `log` sink and `metrics` reader interfaces, so
traces, logs, and metrics flow through one configuration surface and can be
exported together via OTLP.

### `uuid`

UUID generation based on [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562)
with UUIDv7 (time-ordered) as the primary generator, plus v4 where
unguessability matters more than sortability. Cross-runtime randomness via
Web Crypto; parsing/formatting implemented with direct character arithmetic
rather than regex.

### `semver`

Semantic Versioning parse, compare, increment, and range utilities that avoid
regex: version strings are parsed with index-based scanning and character
checks, which is faster than regex engines, easier to profile, and produces
precise error positions. Range matching supports common comparator sets
(`^`, `~`, `>=`, `<`, wildcards) with the same parser primitives.

### `iterator`

A custom iterator module extending `Iterator` with chainable operations -
map/filter/take/drop/flatten, zipping, grouping, windowing, and sorting -
so pipelines stay lazy until terminal calls. Sorting integrates with the
lower-level algorithms from `collections`.

### `collections`

Lower-level collection types and algorithms that `iterator` builds on,
plus general-purpose helpers informed by
[@std/collections](https://jsr.io/@std/collections) (chunk, distinct, groupBy,
slidingWindows, zip, and friends):

- Case-insensitive `Map` and `Set`.
- Red-black tree (ordered map/set with O(log n) insert, remove, lookup).
- Explicit sort implementations including dual-pivot quicksort, merge sort,
  and insertion sort for small ranges, exposed for direct use and used by
  `iterator.sort`.
- Binary heap/priority queue.
- Pure functions for arrays, records, and iterables following the
  `@std/collections` API shape where it fits.
