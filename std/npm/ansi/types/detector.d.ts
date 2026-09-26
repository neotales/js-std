/** Terminal ANSI capability detection. @module */
import { type AnsiMode } from "./enums.js";
export type DetectOptions = {
    args?: readonly string[];
    env?: Readonly<Record<string, string | undefined>>;
    windows?: boolean;
};
/**
 * Detects terminal color support from flags, environment variables, and CI
 * metadata. Optional values make integration tests and embedders deterministic.
 */
export declare function detectMode(options?: DetectOptions): AnsiMode;
