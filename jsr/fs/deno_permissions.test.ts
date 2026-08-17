import { strictEqual } from "node:assert/strict";
import { test } from "node:test";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { withTestRoot } from "./_test_helpers.ts";

type DenoRuntime = {
  Command: new (
    command: string,
    options: { args: string[]; cwd: string },
  ) => { output(): Promise<{ code: number; stderr: Uint8Array; stdout: Uint8Array }> };
  execPath(): string;
  remove(path: string): Promise<void>;
  writeTextFile(path: string, data: string): Promise<void>;
};

const deno = (globalThis as { Deno?: DenoRuntime }).Deno;
const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
async function deniesRead(
  root: string,
  module: string,
  functionName: string,
  invocation: string,
): Promise<void> {
  const script = join(
    fileURLToPath(new URL("./", import.meta.url)),
    `.permission-${crypto.randomUUID()}.ts`,
  );
  const target = join(root, "denied");
  try {
    await deno!.writeTextFile(
      script,
      `import { ${functionName} } from ${JSON.stringify(new URL(module, import.meta.url).href)};
try { ${invocation.replaceAll("$TARGET", JSON.stringify(target))}; } catch (error) { if (error?.name === "NotCapable" || error?.name === "PermissionDenied") Deno.exit(0); }
Deno.exit(1);`,
    );
    const output = await new deno!.Command(deno!.execPath(), {
      args: ["run", "--allow-read", "--allow-write", `--deny-read=${target}`, script],
      cwd: workspaceRoot,
    }).output();
    const decoder = new TextDecoder();
    strictEqual(output.code, 0, decoder.decode(output.stdout) + decoder.decode(output.stderr));
  } finally {
    await deno!.remove(script).catch(() => undefined);
  }
}

test(
  "fs::Deno permission boundaries reject denied ensure and glob reads",
  { skip: !deno },
  async () => {
    await withTestRoot(async (root) => {
      await deniesRead(root, "./ensure_dir.ts", "ensureDir", "await ensureDir($TARGET)");
      await deniesRead(root, "./ensure_file.ts", "ensureFile", "await ensureFile($TARGET)");
      await deniesRead(
        root,
        "./expand_glob.ts",
        "expandGlob",
        "for await (const _ of expandGlob($TARGET)) {} ",
      );
    });
  },
);
