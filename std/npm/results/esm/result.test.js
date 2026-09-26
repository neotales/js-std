import { equal, rejects, strictEqual, throws } from "node:assert/strict";
import { test } from "node:test";
import { all, allAsync, EmptyResult, fail, failAsError, fromNullable, fromPredicate, match, ok, Result, ResultError, tryCatch, tryCatchAsync, } from "./result.js";
test("results::ok and fail expose their state", () => {
    strictEqual(ok(42).orThrow(), 42);
    strictEqual(fail("bad").orRequireError(), "bad");
    strictEqual(ok(undefined).ok(), true);
    throws(() => fail(new Error("boom")).orThrow(), ResultError);
    const success = ok(2);
    if (success.ok())
        strictEqual(success.value.toFixed(), "2");
    const failure = fail("bad");
    if (failure.failed())
        strictEqual(failure.error.toUpperCase(), "BAD");
});
test("results::composition preserves success and failure paths", () => {
    strictEqual(ok(2).andThen((value) => ok(value + 1)).value, 3);
    strictEqual(fail("bad").and(3).error, "bad");
    strictEqual(fail("bad").orElse((error) => ok(error.length)).value, 3);
    strictEqual(ok(2).map((value) => value + 1).value, 3);
    strictEqual(fail("bad").map((value) => value + 1).error, "bad");
});
test("results::fallback, match, and inspect helpers are lazy", () => {
    let calls = 0;
    equal(fail("bad").orDefault(() => ++calls), 1);
    equal(ok(2).orDefault(() => ++calls), 2);
    equal(match(ok(2), (value) => value + 1, () => 0), 3);
    equal(fail("bad").mapError((error) => error.length, 0), 3);
    equal(calls, 1);
});
test("results::try helpers capture arbitrary thrown values", async () => {
    strictEqual(tryCatch(() => 2).value, 2);
    strictEqual(tryCatch(() => {
        throw "boom";
    }).error?.message, "boom");
    strictEqual((await tryCatchAsync(async () => {
        throw "boom";
    })).error?.message, "boom");
    strictEqual(failAsError({ code: 500 }).error?.message, "Unexpected error: [object Object]");
    strictEqual(failAsError(Object.create(null)).error?.message, "Unexpected error: Unknown error");
    await rejects(() => fail(new Error("boom")).resolve());
});
test("results::toPromise recovers only when a rejection handler is provided", async () => {
    strictEqual(await ok(2).toPromise((value) => value + 1), 3);
    strictEqual(await ok(2).toPromise((value) => value.toString()), "2");
    strictEqual(await fail("bad").toPromise(undefined, (error) => error.length), 3);
    await rejects(() => fail("bad").toPromise());
});
test("results::constructors and aggregators retain values and errors", async () => {
    strictEqual(fromNullable("id", "missing").value, "id");
    strictEqual(fromNullable(undefined, "missing").error, "missing");
    strictEqual(fromPredicate(2, (value) => value > 0, "invalid").value, 2);
    strictEqual(fromPredicate(0, (value) => value > 0, "invalid").error, "invalid");
    strictEqual(all([ok(1), ok(2)]).value?.join(","), "1,2");
    strictEqual(all([ok(1), fail("bad")]).error, "bad");
    strictEqual((await allAsync([Promise.resolve(ok(1)), Promise.resolve(ok(2))])).value?.join(","), "1,2");
    strictEqual((await tryCatchAsync(() => 2)).value, 2);
});
test("results::empty is shared and static helpers retain state", async () => {
    strictEqual(EmptyResult.tryCatch(() => { }) instanceof EmptyResult, true);
    strictEqual(EmptyResult.tryCatch(() => {
        throw new Error("boom");
    }) instanceof EmptyResult, true);
    strictEqual((await EmptyResult.tryCatchAsync(async () => { })) instanceof EmptyResult, true);
    throws(() => new Result(1, new Error("boom")), ResultError);
});
