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
deno task publish:dry-run <module>
deno task publish <module>
```

Linting uses oxlint and formatting uses oxfmt. Publishing runs `deno publish`
for JSR followed by `pnpm publish` for npm; use the dry run first.

## License

[MIT](./LICENSE.md)
