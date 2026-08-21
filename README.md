# Neotales JavaScript Standard Libraries

Cross-runtime TypeScript modules published to JSR and npm.

## Modules

| Module    | JSR                                                   | Description                                       |
| --------- | ----------------------------------------------------- | ------------------------------------------------- |
| `chars`   | [@neotales/chars](https://jsr.io/@neotales/chars)     | Character classification and code point utilities |
| `slices`  | [@neotales/slices](https://jsr.io/@neotales/slices)   | Array and typed array utilities                   |
| `strings` | [@neotales/strings](https://jsr.io/@neotales/strings) | String utilities                                  |
| `path`    | [@neotales/path](https://jsr.io/@neotales/path)       | Cross-platform path manipulation                  |
| `process` | [@neotales/process](https://jsr.io/@neotales/process) | Process and platform information                  |
| `fs`      | [@neotales/fs](https://jsr.io/@neotales/fs)           | Cross-runtime filesystem utilities                |
| `args`    | [@neotales/args](https://jsr.io/@neotales/args)       | Command-line argument parsing                     |
| `env`     | [@neotales/env](https://jsr.io/@neotales/env)         | Environment variable access and expansion         |
| `dotenv`  | [@neotales/dotenv](https://jsr.io/@neotales/dotenv)   | `.env` file loading                               |
| `exec`    | [@neotales/exec](https://jsr.io/@neotales/exec)       | Cross-runtime child process execution and `which` |
| `ansi`    | [@neotales/ansi](https://jsr.io/@neotales/ansi)       | ANSI escape sequences and styling                 |
| `secrets` | [@neotales/secrets](https://jsr.io/@neotales/secrets) | Protected secret handling                         |
| `fmt`     | [@neotales/fmt](https://jsr.io/@neotales/fmt)         | Formatting utilities                              |

OS-level packages that require extra CI/CD tooling live in a separate
repository: [github.com/neotales/js-os](https://github.com/neotales/js-os).

See [docs/ROADMAP.md](./docs/ROADMAP.md) for planned modules and milestones.

## Development

```sh
deno task build <module>
deno task test <module>
deno task test <module> --deno
deno task test <module> --node --bun
```

`build` transforms a module under `jsr/<module>` into `npm/<module>` with dnt.
npm packages are ESM-only, managed by pnpm, and test in Node and Bun; JSR
modules test in Deno. Tests use `node:test` and `node:assert/strict`; neither
an assertion nor a globals module is imported or published.

Run all module tests across runtimes with `deno task test`.

`test:e2e` runs browser integration tests and local Cloudflare Workers tests.
The latter use Wrangler's workerd harness without Cloudflare credentials; add a
`*.workerd.mjs` test and fixture under `e2e/` when checking Worker support for a
module or runtime feature. Run just those checks with `deno task test:workers`.

## Quality And Publishing

```sh
deno task lint
deno task fmt:check
deno task pack <module>
deno task publish:bootstrap <module> --dry-run
deno task publish:dry-run <module>
deno task publish <module>
```

Linting uses oxlint and formatting uses deno fmt (100 character line width).
`publish:bootstrap` is the one-time first npmjs.org publish: it verifies the
package is not already on npm, builds only when `npm/<module>` is missing,
checks lint and formatting, runs all module tests, creates a pnpm tarball,
reports its sizes, then publishes that tarball. Later releases should publish
through GitHub Actions with `publish`, which runs `deno publish` for JSR
followed by `pnpm publish` for npm. The one-time npm publish reads the npm
token from `NODE_AUTH_TOKEN`; when it is absent, the command prompts for it
and fails on an empty response. Do not add the token to repository files.

JSR publishing uses GitHub OIDC instead of a token: release workflows grant
`id-token: write`, and `deno publish` exchanges the workflow identity for
short-lived credentials automatically.

## Releases

Release tags use `vYYYY.MM.DD-rN`, for example `v2026.08.12-r1`. `-nightly.rN`
and `-beta.rN` are also accepted for future prereleases. A release tag runs the
complete quality gate, finds modules whose `jsr/<module>/deno.json` version
changed since the prior release tag, packages them as workflow artifacts, and
creates GitHub release notes listing shipped packages plus Conventional Commit
changes (`feat`, `fix`, `bug`, and related types). Existing npm and JSR packages
are published with GitHub OIDC; packages not yet registered with a registry are
reported and skipped.

The release workflow uses the GitHub `release` environment. In GitHub repository
settings, create that environment and configure required reviewers to pause a
tagged release before the job receives publishing permissions. Configure tag
protection rules as a separate safeguard against unauthorized release tags.

## License

[MIT](./LICENSE.md)
