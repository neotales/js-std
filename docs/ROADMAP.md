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
