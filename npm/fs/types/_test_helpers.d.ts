export declare const isWindows: boolean;
export declare function withTestRoot(run: (root: string) => Promise<void>): Promise<void>;
export declare function withTestRootSync(run: (root: string) => void): void;
