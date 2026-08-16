/** Explicit success and failure values for synchronous and asynchronous flows. @module */

type State = "ok" | "error";

/**
 * Options for a {@link ResultError}, including an optional causal value.
 *
 * @example
 * ```ts
 * import type { ResultErrorOptions } from "@neotales/results";
 *
 * const options: ResultErrorOptions = { cause: new Error("offline") };
 * ```
 */
export type ResultErrorOptions = {
  cause?: unknown;
};

/**
 * A result refined to the successful state by {@link Result.ok}.
 *
 * @example
 * ```ts
 * import { ok } from "@neotales/results";
 *
 * const result = ok(2);
 * if (result.ok()) result.value.toFixed();
 * ```
 */
export type OkResult<T, E = Error> = Result<T, E> & {
  readonly ok: true;
  readonly failed: false;
  readonly value: T;
  readonly error: undefined;
};

/**
 * A result refined to the failed state by {@link Result.failed}.
 *
 * @example
 * ```ts
 * import { fail } from "@neotales/results";
 *
 * const result = fail<number, string>("offline");
 * if (result.failed()) result.error.toUpperCase();
 * ```
 */
export type FailureResult<T, E = Error> = Result<T, E> & {
  readonly ok: false;
  readonly failed: true;
  readonly value: undefined;
  readonly error: E;
};

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  try {
    return String(value);
  } catch {
    return "Unknown error";
  }
}

/**
 * Thrown when callers require a success value or failure that is absent.
 *
 * @example
 * ```ts
 * import { ResultError, fail } from "@neotales/results";
 *
 * try {
 *   fail(new Error("offline")).orThrow();
 * } catch (error) {
 *   error instanceof ResultError; // true
 * }
 * ```
 */
export class ResultError extends Error {
  /** Creates a result-specific error with an optional causal value. */
  constructor(message = "Result error.", options?: ResultErrorOptions) {
    super(message);
    this.name = "ResultError";
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * A value that is either successful (`ok`) or failed (`failed`).
 *
 * @example
 * ```ts
 * import { Result, ok } from "@neotales/results";
 *
 * const result: Result<number, Error> = ok(2);
 * const doubled = result.map((value) => value * 2);
 * ```
 */
export class Result<T, E = Error> {
  #state: State;
  #value: T | undefined;
  #error: E | undefined;

  /** Creates a result. Prefer {@link ok} and {@link fail} for normal use. */
  constructor(value?: T, error?: E, state: State = error === undefined ? "ok" : "error") {
    if (state === "ok" && error !== undefined)
      throw new ResultError("Result cannot have both value and error");
    if (state === "error" && value !== undefined)
      throw new ResultError("Result cannot have both value and error");
    this.#state = state;
    this.#value = value;
    this.#error = error;
  }

  /** Returns whether this result is successful and narrows its type when true.
   * @returns `true` when this result is successful.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const result = ok(2);
   * if (result.ok()) result.value.toFixed();
   * ```
   */
  ok(): this is OkResult<T, E> {
    return this.#state === "ok";
  }

  /** Returns whether this result is failed and narrows its type when true.
   * @returns `true` when this result is failed.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const result = fail<number, string>("offline");
   * if (result.failed()) result.error.toUpperCase();
   * ```
   */
  failed(): this is FailureResult<T, E> {
    return this.#state === "error";
  }

  /** Returns the successful value when present.
   * @returns The successful value, or `undefined` for a failure.
   */
  get value(): T | undefined {
    return this.#value;
  }

  /** Returns the failure value when present.
   * @returns The failure value, or `undefined` for a success.
   */
  get error(): E | undefined {
    return this.#error;
  }

  /**
   * Continues with `other` when successful.
   * @returns `other` when successful, retaining this failure otherwise.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const next = ok(2).and(3);
   * next.value; // 3
   * ```
   */
  and<U, F = E>(other: Result<U, F> | U): Result<U, E | F> {
    if (this.failed()) return fail<U, E>(this.error);
    return other instanceof Result ? other : ok<U, F>(other);
  }

  /**
   * Chains a result-producing function when successful.
   * @returns The result returned by `fn`, or this failure.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const next = ok(2).andThen((value) => ok(value + 1));
   * next.value; // 3
   * ```
   */
  andThen<U, F = E>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
    return this.failed() ? fail<U, E>(this.error) : fn(this.#value!);
  }

  /**
   * Returns this success or a fallback when failed.
   * @returns This success or a fallback result/value when failed.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const recovered = fail<number, string>("offline").or(0);
   * recovered.value; // 0
   * ```
   */
  or<U>(other: Result<U, E> | U): Result<T | U, E> {
    if (this.ok()) return this;
    return other instanceof Result ? other : ok<U, E>(other);
  }

  /**
   * Recovers from a failure with `fn`.
   * @returns This success or the recovery result from `fn`.
   * @example
   * ```ts
   * import { fail, ok } from "@neotales/results";
   * const recovered = fail<number, string>("offline").orElse(() => ok(0));
   * recovered.value; // 0
   * ```
   */
  orElse<U, F = E>(fn: (error: E) => Result<U, F>): Result<T | U, F> {
    return this.ok() ? ok<T, F>(this.value) : fn(this.#error!);
  }

  /**
   * Tests the value when successful.
   * @returns `true` only when successful and `fn` returns `true`.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const isPositive = ok(2).test((value) => value > 0);
   * ```
   */
  test(fn: (value: T) => boolean): boolean {
    return this.ok() && fn(this.value);
  }

  /**
   * Tests the error when failed.
   * @returns `true` only when failed and `fn` returns `true`.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const isOffline = fail<number, string>("offline").testError(Boolean);
   * ```
   */
  testError(fn: (error: E) => boolean): boolean {
    return this.failed() && fn(this.error);
  }

  /**
   * Maps either state to one output value.
   * @returns The value returned by the callback for this result's state.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = ok(2).match((number) => number + 1, () => 0);
   * ```
   */
  match<U>(onOk: (value: T) => U, onError: (error: E) => U): U {
    return this.ok() ? onOk(this.value) : onError(this.#error!);
  }

  /**
   * Converts a success to a one-item array.
   * @returns A one-item array for a success, otherwise an empty array.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const values = ok(2).toArray(); // [2]
   * ```
   */
  toArray(): T[] {
    return this.ok() ? [this.value] : [];
  }

  /**
   * Converts a success to an iterable.
   * @returns An iterable containing the value for a success.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const values = [...ok(2).toIterable()]; // [2]
   * ```
   */
  toIterable(): Iterable<T> {
    return this.toArray();
  }

  /**
   * Converts this result to a standard promise.
   * @returns A resolving promise for success or rejecting promise for failure.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = await ok(2).resolve(); // 2
   * ```
   */
  resolve(): Promise<T> {
    return this.ok() ? Promise.resolve(this.value) : Promise.reject(this.#error!);
  }

  /**
   * Converts this result to a promise without handlers.
   * @returns A promise for the successful value or a rejected failure.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = await ok(2).toPromise(); // 2
   * ```
   */
  toPromise(): Promise<T>;
  /**
   * Converts this result with handlers that map either state.
   * @returns A promise for the mapped callback result.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = await ok(2).toPromise((number) => number.toString()); // "2"
   * ```
   */
  toPromise<U>(
    onFulfilled: (value: T) => U | PromiseLike<U>,
    onRejected?: (error: E) => U | PromiseLike<U>,
  ): Promise<U>;
  /**
   * Recovers failures while preserving the original success type.
   * @returns A promise for the original success or recovered failure value.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const value = await fail<number, string>("offline").toPromise(undefined, () => 0);
   * ```
   */
  toPromise<U>(
    onFulfilled: undefined,
    onRejected: (error: E) => U | PromiseLike<U>,
  ): Promise<T | U>;
  toPromise<U>(
    onFulfilled?: (value: T) => U | PromiseLike<U>,
    onRejected?: (error: E) => U | PromiseLike<U>,
  ): Promise<T | U> {
    if (this.ok()) {
      return Promise.resolve<T | U>(onFulfilled ? onFulfilled(this.value) : this.value);
    }
    return onRejected
      ? Promise.resolve<T | U>(onRejected(this.#error!))
      : Promise.reject(this.#error!);
  }

  /**
   * Returns the value or throws for a failure.
   * @returns The successful value.
   * @throws {ResultError} When this result is failed.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = ok(2).orThrow(); // 2
   * ```
   */
  orThrow(): T {
    if (this.ok()) return this.value;
    const error = this.#error;
    throw error instanceof Error
      ? new ResultError(`Result is error ${error.message}`, { cause: error })
      : new ResultError(`Result is error ${errorMessage(error)}`);
  }

  /**
   * Returns the value or an eager/lazy fallback.
   * @returns The successful value or the evaluated fallback.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const value = fail<number>(new Error("missing")).orDefault(0); // 0
   * ```
   */
  orDefault(defaultValue: T | (() => T)): T {
    return this.ok()
      ? this.value
      : typeof defaultValue === "function"
        ? (defaultValue as () => T)()
        : defaultValue;
  }

  /**
   * Returns the error or throws for a success.
   * @returns The failure value.
   * @throws {ResultError} When this result is successful.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const error = fail<number, string>("offline").orRequireError();
   * ```
   */
  orRequireError(): E {
    if (this.failed()) return this.error;
    throw new ResultError("Result expected to be error, but had a value");
  }

  /**
   * Returns the error or an eager/lazy fallback.
   * @returns The failure value or the evaluated fallback.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const error = ok<number, string>(2).orDefaultError("offline");
   * ```
   */
  orDefaultError(defaultValue: E | (() => E)): E {
    return this.failed()
      ? this.error
      : typeof defaultValue === "function"
        ? (defaultValue as () => E)()
        : defaultValue;
  }

  /**
   * Runs a side effect for a success.
   * @returns This result.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const result = ok(2).inspect((value) => console.log(value));
   * ```
   */
  inspect(fn: (value: T) => void): Result<T, E> {
    if (this.ok()) fn(this.value);
    return this;
  }

  /**
   * Returns the value or throws with a custom message.
   * @returns The successful value.
   * @throws {ResultError} When this result is failed.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = ok(2).expect("expected a number");
   * ```
   */
  expect(message: string): T {
    if (this.ok()) return this.value;
    throw new ResultError(message, { cause: this.#error });
  }

  /**
   * Returns the error or throws with a custom message.
   * @returns The failure value.
   * @throws {ResultError} When this result is successful.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const error = fail<number, string>("offline").expectError("expected failure");
   * ```
   */
  expectError(message: string): E {
    if (this.failed()) return this.error;
    throw new ResultError(message);
  }

  /**
   * Maps the value or returns a fallback.
   * @returns The mapped value or the evaluated fallback.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const value = ok(2).mapValue((number) => number * 2, 0); // 4
   * ```
   */
  mapValue<U>(fn: (value: T) => U, fallback: U | (() => U)): U {
    return this.ok()
      ? fn(this.value)
      : typeof fallback === "function"
        ? (fallback as () => U)()
        : fallback;
  }

  /**
   * Maps the success value and optionally the error.
   * @returns A result containing the mapped success or failure value.
   * @example
   * ```ts
   * import { ok } from "@neotales/results";
   * const result = ok(2).map((number) => number.toString());
   * ```
   */
  map<U, F = E>(fn: (value: T) => U, mapError?: (error: E) => F): Result<U, F> {
    if (this.ok()) return ok<U, F>(fn(this.value));
    return fail<U, F>(mapError ? mapError(this.#error!) : (this.#error as unknown as F));
  }

  /**
   * Maps the error or returns a fallback.
   * @returns The mapped error or the evaluated fallback.
   * @example
   * ```ts
   * import { fail } from "@neotales/results";
   * const length = fail<number, string>("offline").mapError((error) => error.length, 0);
   * ```
   */
  mapError<F>(fn: (error: E) => F, fallback: F | (() => F)): F {
    return this.failed()
      ? fn(this.error)
      : typeof fallback === "function"
        ? (fallback as () => F)()
        : fallback;
  }
}

/**
 * A successful `Result`.
 *
 * @example
 * ```ts
 * import { Ok } from "@neotales/results";
 *
 * new Ok("ready").value; // "ready"
 * ```
 */
export class Ok<T> extends Result<T, never> {
  /** Creates a successful result containing `value`. */
  constructor(value: T) {
    super(value, undefined, "ok");
  }
}

/**
 * An empty successful `Result`, useful for operations without a value.
 *
 * @example
 * ```ts
 * import { EmptyResult } from "@neotales/results";
 *
 * EmptyResult.tryCatch(() => {}).ok(); // true
 * ```
 */
export class EmptyResult<E = Error> extends Result<void, E> {
  /** Creates an empty success or a failure containing `error`. */
  constructor(error?: E) {
    super(undefined, error, error === undefined ? "ok" : "error");
  }

  /**
   * Captures a thrown value from `fn`.
   * @returns An empty success or an empty failure containing a captured error.
   * @example
   * ```ts
   * import { EmptyResult } from "@neotales/results";
   * const result = EmptyResult.tryCatch(() => {});
   * result.ok(); // true
   * ```
   */
  static tryCatch(fn: () => void): EmptyResult<Error> {
    const result = tryCatch(fn);
    return result.ok() ? empty<Error>() : new EmptyResult(result.error!);
  }

  /**
   * Captures a rejection from async `fn`.
   * @returns A promise for an empty success or failure containing a captured error.
   * @example
   * ```ts
   * import { EmptyResult } from "@neotales/results";
   * const result = await EmptyResult.tryCatchAsync(async () => {});
   * result.ok(); // true
   * ```
   */
  static async tryCatchAsync(fn: () => Promise<void>): Promise<EmptyResult<Error>> {
    const result = await tryCatchAsync(fn);
    return result.ok() ? empty<Error>() : new EmptyResult(result.error!);
  }
}

/**
 * A failed `Result`.
 *
 * @example
 * ```ts
 * import { Failure } from "@neotales/results";
 *
 * new Failure("missing").failed(); // true
 * ```
 */
export class Failure<E = Error> extends Result<never, E> {
  /** Creates a failed result containing `error`. */
  constructor(error: E) {
    super(undefined, error, "error");
  }
}

const emptyResult: EmptyResult<never> = new EmptyResult<never>();

/**
 * Creates a successful result.
 *
 * @returns A successful result containing `value`.
 * @example
 * ```ts
 * import { ok } from "@neotales/results";
 *
 * ok(42).orThrow(); // 42
 * ```
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value) as Result<T, E>;
}

/**
 * Returns a shared empty successful result.
 *
 * @returns A reusable empty successful result.
 * @example
 * ```ts
 * import { empty } from "@neotales/results";
 *
 * empty().ok(); // true
 * ```
 */
export function empty<E = never>(): EmptyResult<E> {
  return emptyResult as EmptyResult<E>;
}

/**
 * Creates a failed result.
 *
 * @returns A failed result containing `error`.
 * @example
 * ```ts
 * import { fail } from "@neotales/results";
 *
 * fail(new Error("offline")).failed(); // true
 * ```
 */
export function fail<T = never, E = Error>(error: E): Result<T, E> {
  return new Failure(error) as Result<T, E>;
}

/**
 * Creates a result from a nullable value and an eager or lazy failure value.
 *
 * @returns A success for a non-nullish value, otherwise a failure containing `error`.
 * @example
 * ```ts
 * import { fromNullable } from "@neotales/results";
 *
 * fromNullable("id", new Error("missing")).value; // "id"
 * ```
 */
export function fromNullable<T, E>(value: T, error: E | (() => E)): Result<NonNullable<T>, E> {
  if (value !== null && value !== undefined) return ok<NonNullable<T>, E>(value);
  return fail<NonNullable<T>, E>(typeof error === "function" ? (error as () => E)() : error);
}

/**
 * Creates a result by testing `value` against `predicate`.
 *
 * @returns A success when the predicate passes, otherwise a failure containing `error`.
 * @example
 * ```ts
 * import { fromPredicate } from "@neotales/results";
 *
 * fromPredicate(2, (value) => value > 0, "not positive").ok(); // true
 * ```
 */
export function fromPredicate<T, E>(
  value: T,
  predicate: (value: T) => boolean,
  error: E | (() => E),
): Result<T, E> {
  if (predicate(value)) return ok<T, E>(value);
  return fail<T, E>(typeof error === "function" ? (error as () => E)() : error);
}

/**
 * Collects all success values or returns the first failure.
 *
 * @returns A success array or the first failure encountered.
 * @example
 * ```ts
 * import { all, ok } from "@neotales/results";
 *
 * all([ok(1), ok(2)]).value; // [1, 2]
 * ```
 */
export function all<T, E>(results: Iterable<Result<T, E>>): Result<T[], E> {
  const values: T[] = [];
  for (const result of results) {
    if (result.ok()) {
      values.push(result.value);
      continue;
    }
    return fail<T[], E>(result.error!);
  }
  return ok<T[], E>(values);
}

/**
 * Asynchronously collects all success values or returns the first failure.
 *
 * @returns A promise for a success array or the first failure encountered.
 * @example
 * ```ts
 * import { allAsync, ok } from "@neotales/results";
 *
 * (await allAsync([Promise.resolve(ok(1))])).value; // [1]
 * ```
 */
export async function allAsync<T, E>(
  results: Iterable<PromiseLike<Result<T, E>>>,
): Promise<Result<T[], E>> {
  const values: T[] = [];
  for (const pending of results) {
    const result = await pending;
    if (result.ok()) {
      values.push(result.value);
      continue;
    }
    return fail<T[], E>(result.error!);
  }
  return ok<T[], E>(values);
}

/**
 * Converts an unknown thrown value into an `Error` failure.
 *
 * @returns A failed result containing an `Error`.
 * @example
 * ```ts
 * import { failAsError } from "@neotales/results";
 *
 * failAsError("offline").error?.message; // "offline"
 * ```
 */
export function failAsError<T = never>(error: unknown): Result<T, Error> {
  return fail(
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : `Unexpected error: ${errorMessage(error)}`),
  );
}

/**
 * Matches a result into a single value.
 *
 * @returns The value returned by the callback for this result's state.
 * @example
 * ```ts
 * import { match, ok } from "@neotales/results";
 *
 * match(ok(2), (value) => value + 1, () => 0); // 3
 * ```
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onOk: (value: T) => U,
  onError: (error: E) => U,
): U {
  return result.match(onOk, onError);
}

/**
 * Executes a function and captures thrown values as an `Error` failure.
 *
 * @returns A success containing the return value or a failure containing an `Error`.
 * @example
 * ```ts
 * import { tryCatch } from "@neotales/results";
 *
 * tryCatch(() => JSON.parse("invalid")).failed(); // true
 * ```
 */
export function tryCatch<T>(fn: () => T, onRejected?: (error: unknown) => Error): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return fail(
      onRejected
        ? onRejected(error)
        : error instanceof Error
          ? error
          : new Error(errorMessage(error)),
    );
  }
}

/**
 * Executes a sync or async function and captures rejected values as an `Error` failure.
 *
 * @returns A promise for a success containing the return value or a captured failure.
 * @example
 * ```ts
 * import { tryCatchAsync } from "@neotales/results";
 *
 * const result = await tryCatchAsync(() => 42);
 * result.value; // 42
 * ```
 */
export async function tryCatchAsync<T>(
  fn: () => T | PromiseLike<T>,
  onRejected?: (error: unknown) => Error,
): Promise<Result<Awaited<T>, Error>> {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(
      onRejected
        ? onRejected(error)
        : error instanceof Error
          ? error
          : new Error(errorMessage(error)),
    );
  }
}
