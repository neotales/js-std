const RESULT_PREFIX = "__NEOTALES_RUNTIME_RESULT__";

/** Publishes a JSON report to an embedding host and, when available, stdout. */
export function emitRuntimeReport(report: unknown): void {
  Object.defineProperty(globalThis, "__NEOTALES_RUNTIME_REPORT__", {
    configurable: true,
    value: report,
  });

  const output = `${RESULT_PREFIX}${JSON.stringify(report)}`;
  const print = Reflect.get(globalThis, "print");
  if (typeof print === "function") {
    print(output);
  } else if (typeof console !== "undefined") {
    console.log(output);
  }
}
