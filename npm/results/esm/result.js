var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Result_state, _Result_value, _Result_error;
/** Explicit success and failure values for synchronous and asynchronous flows. @module */
import "./_dnt.polyfills.js";
function errorMessage(value) {
    if (value instanceof Error)
        return value.message;
    try {
        return String(value);
    }
    catch {
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
    constructor(message = "Result error.", options) {
        super(message);
        this.name = "ResultError";
        if (options?.cause !== undefined) {
            this.cause = options.cause;
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
export class Result {
    /** Creates a result. Prefer {@link ok} and {@link fail} for normal use. */
    constructor(value, error, state = error === undefined ? "ok" : "error") {
        _Result_state.set(this, void 0);
        _Result_value.set(this, void 0);
        _Result_error.set(this, void 0);
        if (state === "ok" && error !== undefined)
            throw new ResultError("Result cannot have both value and error");
        if (state === "error" && value !== undefined)
            throw new ResultError("Result cannot have both value and error");
        __classPrivateFieldSet(this, _Result_state, state, "f");
        __classPrivateFieldSet(this, _Result_value, value, "f");
        __classPrivateFieldSet(this, _Result_error, error, "f");
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
    ok() {
        return __classPrivateFieldGet(this, _Result_state, "f") === "ok";
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
    failed() {
        return __classPrivateFieldGet(this, _Result_state, "f") === "error";
    }
    /** Returns the successful value when present.
     * @returns The successful value, or `undefined` for a failure.
     */
    get value() {
        return __classPrivateFieldGet(this, _Result_value, "f");
    }
    /** Returns the failure value when present.
     * @returns The failure value, or `undefined` for a success.
     */
    get error() {
        return __classPrivateFieldGet(this, _Result_error, "f");
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
    and(other) {
        if (this.failed())
            return fail(this.error);
        return other instanceof Result ? other : ok(other);
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
    andThen(fn) {
        return this.failed() ? fail(this.error) : fn(__classPrivateFieldGet(this, _Result_value, "f"));
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
    or(other) {
        if (this.ok())
            return this;
        return other instanceof Result ? other : ok(other);
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
    orElse(fn) {
        return this.ok() ? ok(this.value) : fn(__classPrivateFieldGet(this, _Result_error, "f"));
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
    test(fn) {
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
    testError(fn) {
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
    match(onOk, onError) {
        return this.ok() ? onOk(this.value) : onError(__classPrivateFieldGet(this, _Result_error, "f"));
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
    toArray() {
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
    toIterable() {
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
    resolve() {
        return this.ok() ? Promise.resolve(this.value) : Promise.reject(__classPrivateFieldGet(this, _Result_error, "f"));
    }
    toPromise(onFulfilled, onRejected) {
        if (this.ok()) {
            return Promise.resolve(onFulfilled ? onFulfilled(this.value) : this.value);
        }
        return onRejected
            ? Promise.resolve(onRejected(__classPrivateFieldGet(this, _Result_error, "f")))
            : Promise.reject(__classPrivateFieldGet(this, _Result_error, "f"));
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
    orThrow() {
        if (this.ok())
            return this.value;
        const error = __classPrivateFieldGet(this, _Result_error, "f");
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
    orDefault(defaultValue) {
        return this.ok()
            ? this.value
            : typeof defaultValue === "function"
                ? defaultValue()
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
    orRequireError() {
        if (this.failed())
            return this.error;
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
    orDefaultError(defaultValue) {
        return this.failed()
            ? this.error
            : typeof defaultValue === "function"
                ? defaultValue()
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
    inspect(fn) {
        if (this.ok())
            fn(this.value);
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
    expect(message) {
        if (this.ok())
            return this.value;
        throw new ResultError(message, { cause: __classPrivateFieldGet(this, _Result_error, "f") });
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
    expectError(message) {
        if (this.failed())
            return this.error;
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
    mapValue(fn, fallback) {
        return this.ok()
            ? fn(this.value)
            : typeof fallback === "function"
                ? fallback()
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
    map(fn, mapError) {
        if (this.ok())
            return ok(fn(this.value));
        return fail(mapError ? mapError(__classPrivateFieldGet(this, _Result_error, "f")) : __classPrivateFieldGet(this, _Result_error, "f"));
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
    mapError(fn, fallback) {
        return this.failed()
            ? fn(this.error)
            : typeof fallback === "function"
                ? fallback()
                : fallback;
    }
}
_Result_state = new WeakMap(), _Result_value = new WeakMap(), _Result_error = new WeakMap();
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
export class Ok extends Result {
    /** Creates a successful result containing `value`. */
    constructor(value) {
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
export class EmptyResult extends Result {
    /** Creates an empty success or a failure containing `error`. */
    constructor(error) {
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
    static tryCatch(fn) {
        const result = tryCatch(fn);
        return result.ok() ? empty() : new EmptyResult(result.error);
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
    static async tryCatchAsync(fn) {
        const result = await tryCatchAsync(fn);
        return result.ok() ? empty() : new EmptyResult(result.error);
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
export class Failure extends Result {
    /** Creates a failed result containing `error`. */
    constructor(error) {
        super(undefined, error, "error");
    }
}
const emptyResult = new EmptyResult();
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
export function ok(value) {
    return new Ok(value);
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
export function empty() {
    return emptyResult;
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
export function fail(error) {
    return new Failure(error);
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
export function fromNullable(value, error) {
    if (value !== null && value !== undefined)
        return ok(value);
    return fail(typeof error === "function" ? error() : error);
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
export function fromPredicate(value, predicate, error) {
    if (predicate(value))
        return ok(value);
    return fail(typeof error === "function" ? error() : error);
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
export function all(results) {
    const values = [];
    for (const result of results) {
        if (result.ok()) {
            values.push(result.value);
            continue;
        }
        return fail(result.error);
    }
    return ok(values);
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
export async function allAsync(results) {
    const values = [];
    for (const pending of results) {
        const result = await pending;
        if (result.ok()) {
            values.push(result.value);
            continue;
        }
        return fail(result.error);
    }
    return ok(values);
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
export function failAsError(error) {
    return fail(error instanceof Error
        ? error
        : new Error(typeof error === "string" ? error : `Unexpected error: ${errorMessage(error)}`));
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
export function match(result, onOk, onError) {
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
export function tryCatch(fn, onRejected) {
    try {
        return ok(fn());
    }
    catch (error) {
        return fail(onRejected
            ? onRejected(error)
            : error instanceof Error
                ? error
                : new Error(errorMessage(error)));
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
export async function tryCatchAsync(fn, onRejected) {
    try {
        return ok(await fn());
    }
    catch (error) {
        return fail(onRejected
            ? onRejected(error)
            : error instanceof Error
                ? error
                : new Error(errorMessage(error)));
    }
}
