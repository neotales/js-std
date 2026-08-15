# @neotales/args

## Overview

Cross-runtime command-line argument utilities for splitting shell-like strings, joining argument arrays, converting
objects to args, and parsing args into JSON-like objects.

![logo](https://raw.githubusercontent.com/neotales/js-std/refs/heads/master/eng/assets/logo.png)

[![JSR](https://jsr.io/badges/@neotales/args)](https://jsr.io/@neotales/args)
[![npm version](https://badge.fury.io/js/@neotales%2Fargs.svg)](https://badge.fury.io/js/@neotales%2Fargs)
[![GitHub version](https://badge.fury.io/gh/neotales%2Fjs-std.svg)](https://badge.fury.io/gh/neotales%2Fjs-std)

## Documentation

Documentation is available on [jsr.io](https://jsr.io/@neotales/args/doc)

A list of other modules can be found at [github.com/neotales/js-std](https://github.com/neotales/js-std)

## Installation

```bash
# Deno
deno add jsr:@neotales/args

# npm from jsr
npx jsr add @neotales/args

# from npmjs.org
npm install @neotales/args
```

## Usage

```typescript
import { join, parse, splat, split } from "@neotales/args";

console.log(split("echo hello world --test")); // ["echo", "hello", "world", "--test"]

console.log(join(["echo", "hello", "world"])); // "echo hello world"

console.log(join(["echo", "hello world"])); // "echo \"hello world\""

const args = splat({
  foo: "bar",
  splat: {
    command: ["git", "clone"],
  } as SplatOptions,
});

console.log(args); // ["git", "clone", "--foo", "bar"]

console.log(parse(["--name", "neo", "--count=2", "-v", "input.txt"], { boolean: ["v"] }));
// { _: ["input.txt"], name: "neo", count: 2, v: true }
```

## Functions

- `split` - splits a string into an array of arguments/args.
- `join` - joins an array of arguments/args into a string.
- `splat` - converts an object with args into an array of arguments/args.
- `parse` - parses arguments into an object with positional values in `_`.

## Parsing

`parse` supports long and short options, repeated values, aliases, defaults, boolean flags, and preserving values after
`--`.

```ts
import { parse } from "@neotales/args/parse";

parse(["-n", "neo"], { alias: { name: "n" }, default: { color: "blue" } });
// { _: [], name: "neo", n: "neo", color: "blue" }

parse(["--id", "001", "--", "--not-parsed"], { string: ["id"], "--": true });
// { _: [], id: "001", "--": ["--not-parsed"] }
```

## License

[MIT License](./LICENSE.md)
