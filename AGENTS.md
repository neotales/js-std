# Neotales JavaScript Libraries

Cross-runtime TypeScript modules published to JSR and npm. Several groups of related
packages share this repository, each in its own top-level folder with its own `jsr/` and
`npm/`.

## Groups

- [`std`](./std) - general purpose libraries: strings, paths, env, fs, ansi, formatting
- [`crypto`](./crypto) - keys, ciphers, and credential stores
- [`os`](./os) - platform bindings: keychain, DPAPI, registry

A folder counts as a group when it has both a `deno.json` and a `jsr/` folder. Adding a
new group needs a new folder, not a change to the tooling.

## Commands

Every command that touches packages names a group, so it is always clear what a command
is about to affect.

```sh
deno task groups                 # list every group and what is in it
deno task test std               # test a whole group on Deno, Node, and Bun
deno task test std fs            # test one module
deno task test std --deno        # one runtime only
deno task build std              # build a group for npm
deno task check std              # lint, format, audit, and test one group
deno task check:all              # the full gate across every group
```

The same commands work from inside a group folder, where the group is implied.

## Read next

- [README](./README.md) - layout, CI behaviour, releases, publishing
- [docs/ROADMAP.md](./docs/ROADMAP.md) - planned modules and milestones
- [.agents/CONTRIBUTING.md](./.agents/CONTRIBUTING.md) - how issues, labels, and commits
  are written here

## License

[MIT](./LICENSE.md)
