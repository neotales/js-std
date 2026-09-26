import { mkdtemp, rm } from "node:fs/promises";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
export const isWindows = process.platform === "win32";
export async function withTestRoot(run) {
    const root = await mkdtemp(join(tmpdir(), "neotales-fs-"));
    try {
        await run(root);
    }
    finally {
        await rm(root, { force: true, recursive: true });
    }
}
export function withTestRootSync(run) {
    const root = mkdtempSync(join(tmpdir(), "neotales-fs-"));
    try {
        run(root);
    }
    finally {
        rmSync(root, { force: true, recursive: true });
    }
}
