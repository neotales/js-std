export interface InspectOptions {
    colors?: boolean;
    compact?: boolean;
    depth?: number;
    breakLength?: number;
    escapeSequences?: boolean;
    iterableLimit?: number;
    showProxy?: boolean;
    sorted?: boolean;
    trailingComma?: boolean;
    getters?: boolean;
    showHidden?: boolean;
    strAbbreviateSize?: number;
}
/**
 * Returns a runtime-native representation when available, otherwise a browser-safe,
 * Node-like representation of the value.
 */
export declare function inspect(value: unknown, options?: InspectOptions): string;
