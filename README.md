# Neotales JavaScript Standard Libraries

Cross-runtime TypeScript modules published to JSR and npm.

## Module Workflow

Import one module at a time from the Frosty Yeti source workspace:

```sh
deno task modules
deno task import <module>
deno task build <module>
deno task test <module>
deno task test <module> --deno
deno task test <module> --node --bun
```

`modules` displays the upstream `jsr/deno.json` workspace order. `import` only
accepts the next pending module in that order, excluding `assert` and `globals`.
It copies `~/foss/frostyeti/js/jsr/<module>` into `jsr/<module>`, updates
the package scope to `@neotales`, rewrites repository links to
`github.com/neotales/js-std`, converts test assertions to `node:assert/strict`,
and registers the module through the `jsr/*` Deno workspace glob. Set
`FROSTYETI_JSR` to use a different upstream source directory.

`build` transforms the selected JSR module into `npm/<module>` with dnt. Import
any listed `@neotales/*` dependencies before building a module. npm packages are
ESM-only, managed by pnpm, and test in Node and Bun; JSR modules test in Deno. Tests use
`node:test` and `node:assert/strict`; neither an assertion nor a globals module
is imported or published.

## Quality And Publishing

```sh
deno task lint
deno task fmt:check
deno task pack <module>
deno task publish:bootstrap <module> --dry-run
deno task publish:dry-run <module>
deno task publish <module>
```

Linting uses oxlint and formatting uses oxfmt. `publish:bootstrap` is the
one-time first npmjs.org publish: it verifies the package is not already on npm,
builds only when `npm/<module>` is missing, checks lint and formatting, runs all
module tests, creates a pnpm tarball, reports its sizes, then publishes that
tarball. Later releases should publish through GitHub Actions with
`publish`, which runs `deno publish` for JSR followed by `pnpm publish` for npm.
The one-time npm publish reads the npm token from `NODE_AUTH_TOKEN`; when it is
absent, the command prompts for it and fails on an empty response. Do not add
the token to repository files.

## Releases

Release tags use `vYYYY.MM.DD-rN`, for example `v2026.08.12-r1`. `-nightly.rN`
and `-beta.rN` are also accepted for future prereleases. A release tag runs the
complete quality gate, finds modules whose `jsr/<module>/deno.json` version
changed since the prior release tag, packages them as workflow artifacts, and
creates GitHub release notes listing shipped packages plus Conventional Commit
changes (`feat`, `fix`, `bug`, and related types). Existing npm and JSR packages
are published with GitHub OIDC; packages not yet registered with a registry are
reported and skipped.

The release workflow requires a `JSR_TOKEN` repository secret to publish existing
JSR packages. Configure npm trusted publishing for `release.yml` and the
`release` environment so npm publishing uses GitHub OIDC without a token.

The release workflow uses the GitHub `release` environment. In GitHub repository
settings, create that environment and configure required reviewers to pause a
tagged release before the job receives publishing permissions. Configure tag
protection rules as a separate safeguard against unauthorized release tags.

## License

[MIT](./LICENSE.md)
