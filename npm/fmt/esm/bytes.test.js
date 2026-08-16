import { deepStrictEqual as equal, throws } from "node:assert/strict";
import { test } from "node:test";
import { format } from "./bytes.js";
const decimal = new Intl.NumberFormat()
    .formatToParts(10_000.1)
    .find(({ type }) => type === "decimal").value;
test("fmt::bytes rejects invalid input", () => {
    throws(() => format(""), TypeError);
    throws(() => format("1"), TypeError);
    throws(() => format(true), TypeError);
    throws(() => format(null), TypeError);
    throws(() => format(NaN), TypeError);
    throws(() => format(Infinity), TypeError);
    throws(() => format(-Infinity), TypeError);
});
test("fmt::bytes formats decimal values", () => {
    equal(format(0), "0 B");
    equal(format(0.4), "0.4 B");
    equal(format(999), "999 B");
    equal(format(1_001), "1 kB");
    equal(format(1e16), "10 PB");
    equal(format(1e30), "1000000 YB");
    equal(format(-0.4), "-0.4 B");
    equal(format(-1_001), "-1 kB");
});
test("fmt::bytes supports locales and grouping", () => {
    equal(format(-0.4, { locale: "de" }), "-0,4 B");
    equal(format(10.1, { locale: "en" }), "10.1 B");
    equal(format(1e30, { locale: ["unknown", "de", "en"] }), "1.000.000 YB");
    equal(format(0.4, { locale: true }), `0${decimal}4 B`);
    equal(format(1e30, { locale: false }), "1000000 YB");
    equal(format(1e30, { locale: "en-US" }), "1,000,000 YB");
    equal(format(1e30, { locale: "es-ES" }), "1.000.000 YB");
    equal(format(1e30, { locale: "fr-FR" }), "1\u202f000\u202f000 YB");
    equal(format(1e30, { locale: "pl-PL" }), "1\u00a0000\u00a0000 YB");
    equal(format(1e30, { locale: "hi-IN" }), "10,00,000 YB");
    equal(format(1e30, { locale: "gu-IN" }), "10,00,000 YB");
});
test("fmt::bytes supports signs, bits, and binary units", () => {
    equal(format(42, { signed: true }), "+42 B");
    equal(format(-13, { signed: true }), "-13 B");
    equal(format(0, { signed: true }), " 0 B");
    equal(format(1_001, { bits: true }), "1 kbit");
    equal(format(1e16, { bits: true }), "10 Pbit");
    equal(format(1_025, { binary: true }), "1 kiB");
    equal(format(1e16, { binary: true }), "8.88 PiB");
    equal(format(1_025, { bits: true, binary: true }), "1 kibit");
    equal(format(1e6, { bits: true, binary: true }), "977 kibit");
});
test("fmt::bytes supports fractional digit options", () => {
    equal(format(1_900, { maximumFractionDigits: 1 }), `1${decimal}9 kB`);
    equal(format(1_900, { minimumFractionDigits: 3 }), `1${decimal}900 kB`);
    equal(format(1_111, { maximumFractionDigits: 2 }), `1${decimal}11 kB`);
    equal(format(1_001, { maximumFractionDigits: 3 }), `1${decimal}001 kB`);
    equal(format(4_001, { maximumFractionDigits: 3, binary: true }), `3${decimal}907 kiB`);
    equal(format(18_717, { maximumFractionDigits: 4, binary: true }), `18${decimal}2783 kiB`);
    equal(format(32_768, { minimumFractionDigits: 2, maximumFractionDigits: 3, binary: true }), `32${decimal}00 kiB`);
});
