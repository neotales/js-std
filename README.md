# Neotales JavaScript Libraries

Cross-runtime TypeScript modules published to JSR and npm.

This repository holds several groups of related packages. Each group is a top-level
folder with its own copy of `jsr/` and `npm/`, so a change to one group cannot break
another.

## Groups

| Group                              | What it holds                                                          |
| ---------------------------------- | ---------------------------------------------------------------------- |
| [`std`](./std)                     | General purpose libraries: strings, paths, env, fs, ansi, formatting    |
| [`crypto`](./crypto)               | Keys, ciphers, and credential stores. Being filled from `pvtlab`        |
| [`os`](./os)                       | Platform bindings: keychain, DPAPI, registry. Being filled from `js-os` |

`crypto` and `os` are empty placeholders for now. The structure and the automation are
being proved on `std` first.

## Layout

```text
eng/            shared build, test, and release tooling. Not published.
std/            group
  deno.json     tasks for this group
  package.json  pnpm and npm view of this group
  jsr/<module>  Deno source, published to JSR
  npm/<module>  generated npm build, published to npm
  e2e/          browser and Cloudflare Workers tests, where a group needs them
crypto/         group
os/             group
docs/           repository-wide notes
```

A folder counts as a group when it has both a `deno.json` and a `jsr/` folder. Adding a
fourth group needs no change to the tooling, only a new folder.

`npm/` is generated. Edit `jsr/<module>` and rebuild; never edit `npm/<module>` by hand.

## Commands

Every command that touches packages takes a group, so you always know what you are
affecting.

```sh
deno task groups                 # list every group and what is in it
deno task test std               # test every module in std, on Deno, Node, and Bun
deno task test std fs            # test one module
deno task test std --deno        # one runtime only
deno task test:all               # every group
deno task build std              # build a whole group for npm
deno task lint std
deno task fmt:check std
deno task check std              # lint, format, audit, and test one group
deno task check:all              # the full gate across every group
```

`lint`, `fmt`, and `test:all` take an optional group. With no group they cover everything,
`lint` also covering `eng/`.

The same commands work from inside a group folder, where the group is implied:

```sh
cd std
deno task test fs
deno task check
```

`std/e2e` holds the browser and Cloudflare Workers tests. `deno task test:workers` runs
just the workerd harness, which needs no Cloudflare credentials. Add a `*.workerd.mjs` test
and a fixture there when checking Worker support for a module or a runtime feature.

## How CI decides what to run

CI looks at which folders a change touched and runs only the groups that could be
affected. A change to `std/` runs the `std` tests. A change to `eng/` or to the top-level
config runs every group, because the shared tooling can affect any of them. A
documentation-only change runs nothing expensive.

Groups are separate jobs so they run in parallel, and a group that did not change writes a
visible skip to the run summary rather than a green check that never ran anything. The
logic lives in [`eng/changed-groups.sh`](./eng/changed-groups.sh).

## Quality and publishing

```sh
deno task lint
deno task fmt:check
deno task pack std fs
deno task publish:bootstrap std fs --dry-run
deno task publish:dry-run std fs
deno task publish std fs
```

Linting uses oxlint and formatting uses deno fmt at a 100 character line width.
`pnpm-lock.yaml` is excluded from formatting so it keeps the form pnpm writes.

`publish:bootstrap` is the one-time first npmjs.org publish. Later releases publish through
GitHub Actions, which runs `deno publish` for JSR followed by `pnpm publish` for npm. The
one-time npm publish reads the token from `NODE_AUTH_TOKEN`; when it is absent, the command
prompts for it. Do not add a token to a repository file.

JSR publishing uses GitHub OIDC instead of a token: the release workflow grants
`id-token: write` and `deno publish` exchanges the workflow identity for short-lived
credentials automatically.

## Releases

Release tags use `vYYYY.MM.DD-rN`, for example `v2026.08.12-r1`. `-nightly.rN` and
`-beta.rN` are also accepted for prereleases.

A release tag runs the full quality gate, finds the modules whose version changed since
the previous release tag in any group, builds their npm directories, and writes release
metadata as a workflow artifact. Each entry records its group, so a release can span more
than one. Existing npm and JSR packages are published with GitHub OIDC. A package that has
never been published is skipped until it is published once with `publish:bootstrap`.

The release workflow uses the GitHub `release` environment. Create that environment and
configure required reviewers before the first release from this repository.

## Contributing

Issues, labels, commit messages, and pull request size follow
[`.agents/CONTRIBUTING.md`](./.agents/CONTRIBUTING.md). Every issue carries an acceptance
criteria checklist.

## License

[MIT](./LICENSE.md)
