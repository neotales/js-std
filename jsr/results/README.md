# @neotales/results

## Overview

`@neotales/results` provides explicit `Result<T, E>` success and failure values
for code that should not use exceptions as normal control flow. It has no runtime
dependencies and works in Deno, Node.js, Bun, browsers, and Cloudflare Workers.

## Installation

```sh
deno add jsr:@neotales/results
npm install @neotales/results
```

## Usage

```ts
import { all, fail, fromNullable, ok, tryCatch, tryCatchAsync } from "@neotales/results";

const count = ok(42).map((value) => value + 1);
const fallback = fail<number>(new Error("missing")).orDefault(0);

const parsed = tryCatch(() => JSON.parse('{"name":"neo"}') as { name: string });
const loaded = await tryCatchAsync(async () => ({ id: 1 }));
const requiredId = fromNullable(loaded.value?.id, new Error("missing id"));
const ids = all([ok(1), ok(2)]);

parsed.match(
  (value) => value.name,
  (error) => error.message,
);
```

## Composition

```ts
import { fail, ok } from "@neotales/results";

const value = ok(2)
  .andThen((number) => ok(number + 1))
  .map((number) => number * 2);
// Result containing 6

const recovered = fail<number, Error>(new Error("offline")).orElse((error) => ok(error.message));
// Result containing "offline"
```

`and`, `andThen`, `or`, `orElse`, and `map` preserve both success and failure
types. `match` converts either branch into one output type. `fromNullable` and
`fromPredicate` create results from common validation branches. `all` and
`allAsync` collect success values, stopping at the first failure. `orThrow`,
`expect`, and `expectError` are boundary helpers for APIs that require exceptions.
Use `ok()` and `failed()` when TypeScript should narrow `value` or `error`.

## Async Boundaries

`tryCatch` and `tryCatchAsync` convert arbitrary thrown or rejected values into
`Error` failures. `resolve()` converts a result into a regular promise, while
`toPromise(onFulfilled, onRejected)` follows promise recovery semantics: a
provided rejection handler resolves with its return value; without one, the
failure remains rejected.

## API

| Export                                   | Description                                    |
| ---------------------------------------- | ---------------------------------------------- |
| `Result`, `Ok`, `Failure`, `EmptyResult` | Result classes.                                |
| `ok`, `fail`, `empty`, `failAsError`     | Result factories.                              |
| `fromNullable`, `fromPredicate`          | Result factories for validation.               |
| `all`, `allAsync`                        | Collect success values or the first failure.   |
| `match`                                  | Top-level result matcher.                      |
| `tryCatch`, `tryCatchAsync`              | Exception and rejection capture helpers.       |
| `ResultError`                            | Error thrown by invalid unwrapping operations. |

## License

[MIT](./LICENSE.md)
