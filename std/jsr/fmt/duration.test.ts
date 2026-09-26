import { deepStrictEqual as equal, throws } from "node:assert/strict";
import { test } from "node:test";
import { format } from "./duration.ts";

test("fmt::duration formats narrow, full, and digital output", () => {
  equal(format(99_674), "0d 0h 1m 39s 674ms 0µs 0ns");
  equal(format(99_674, { ignoreZero: true }), "1m 39s 674ms");
  equal(
    format(99_674, { style: "full", ignoreZero: true }),
    "1 minute, 39 seconds, 674 milliseconds",
  );
  equal(format(99_674, { style: "digital" }), "00:00:01:39:674:000:000");
});

test("fmt::duration handles fractions and absolute values", () => {
  equal(format(-99_674, { style: "digital" }), "00:00:01:39:674:000:000");
  equal(format(16.342, { ignoreZero: true }), "16ms 342µs");
});

test("fmt::duration rejects an invalid style", () => {
  throws(
    () => format(1, { style: "invalid" as never }),
    TypeError,
    'style must be "narrow", "full", or "digital"!',
  );
});
