import type { InspectOptions } from "./inspect.js";
/**
 * Browser-safe, Node-like inspection for environments without a native inspector.
 */
export declare function inspectBrowser(value: unknown, options?: InspectOptions): string;
