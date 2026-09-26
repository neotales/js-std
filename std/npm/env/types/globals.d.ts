type DenoCommandOutput = {
    code: number;
    stdout: Uint8Array;
    stderr: Uint8Array;
};
type DenoRuntime = {
    args: string[];
    build: {
        os: string;
    };
    Command: new (command: string, options?: {
        args?: string[];
        stdout?: "piped";
        stderr?: "piped";
    }) => {
        outputSync(): DenoCommandOutput;
    };
    env: {
        get(name: string): string | undefined;
        set(name: string, value: string): void;
        delete(name: string): void;
        toObject(): Record<string, string>;
    };
};
type RuntimeProcess = NodeJS.Process & {
    getBuiltinModule?(module: string): unknown;
};
type BunRuntime = {
    spawnSync(command: string[], options: {
        stderr: "pipe";
        stdout: "pipe";
    }): {
        error?: Error;
        exitCode?: number;
        stderr?: Uint8Array | string;
        stdout?: Uint8Array | string;
    };
};
type RuntimeGlobals = {
    Bun?: BunRuntime;
    Deno?: DenoRuntime;
    navigator?: {
        platform?: string;
    };
    process?: RuntimeProcess;
};
export declare const globals: typeof globalThis & RuntimeGlobals;
export declare const BROWSER: boolean;
export declare const WINDOWS: boolean;
export declare function getRuntimeArgs(): string[];
export declare function loadChildProcess(): typeof import("node:child_process") | undefined;
export {};
