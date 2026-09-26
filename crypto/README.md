# crypto

Keys, ciphers, and credential stores.

This group is being filled from the `deno/lib/crypto` libraries in
[neotales/pvtlab](https://github.com/neotales/pvtlab). The migration is tracked in
[issue #7](https://github.com/neotales/js-std/issues/7) and is being done one package
at a time, not in a single change.

## Status

No packages yet. `jsr/` and `npm/` are empty placeholders so the structure and the
automation can be proved on `std` and `os` first.

`deno task test crypto` reports that this group is empty and exits successfully. It
does not fail.

## Layout

```text
crypto/
  deno.json     tasks for this group
  package.json  pnpm and npm view of this group
  jsr/<module>  Deno source, published to JSR
  npm/<module>  generated npm build, published to npm
```

## Before adding the first package

Four things are undecided and are listed in issue #7. Two of them change the shape of
this folder, so they are worth settling first:

- whether a package's generated npm output is committed or built on demand
- what proves a moved package is unchanged rather than merely still passing its tests

## License

[MIT](./LICENSE.md)
