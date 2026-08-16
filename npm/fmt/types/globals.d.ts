export declare const globals: typeof globalThis & Record<string, unknown> & {
    Deno?: {
        noColor: boolean;
        build: {
            os: string;
        };
        inspect(value: unknown, options?: unknown): string;
    };
    process?: unknown;
    Bun?: unknown;
};
