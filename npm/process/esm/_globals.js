export const globals = globalThis;
export const isBrowser = globals.window !== undefined &&
    globals.Deno === undefined &&
    globals.Bun === undefined &&
    !globals.process?.versions.node;
