# std

General purpose libraries that run anywhere: Deno, Node, and Bun, in the terminal and
in the browser.

Nothing in this group talks to a native library or to an operating system
facility. That is what separates it from the [`os`](../os) and
[`crypto`](../crypto) groups. If a module here starts needing FFI, it probably
belongs in one of those instead.

## Packages

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
| `results` | [@neotales/results](https://jsr.io/@neotales/results) | Result and error helpers                          |

## Layout

```text
std/
  deno.json     tasks for this group
  package.json  pnpm and npm view of this group
  jsr/<module>  Deno source, published to JSR
  npm/<module>  generated npm build, published to npm
  e2e/          browser and Cloudflare Workers tests for this group
```

`npm/` is generated. Edit `jsr/<module>` and run `deno task build <module>`; never
edit `npm/<module>` by hand.

## Development

Run these from the repository root, or from this folder if you only care about `std`:

```sh
deno task test std              # every module in this group, on Deno, Node, and Bun
deno task test std fs           # one module
deno task test std --deno       # one runtime only
deno task build std             # build every module for npm
deno task lint std
deno task check std
```

`deno task test:e2e` in this folder runs the browser and Cloudflare Workers tests.
`deno task test:workers` runs just the workerd harness, which needs no Cloudflare
credentials.

## License

[MIT](./LICENSE.md)
