import { mkdir, readTextFile, readdir, rm, stat, writeTextFile } from "../jsr/fs/mod.ts";

export default {
  async fetch(): Promise<Response> {
    const root = `/tmp/neotales-fs-${crypto.randomUUID()}`;
    await mkdir(root);
    try {
      const file = `${root}/value.txt`;
      await writeTextFile(file, "worker");
      const names: string[] = [];
      for await (const entry of readdir(root)) names.push(entry.name);
      return Response.json({
        names,
        size: (await stat(file)).size,
        value: await readTextFile(file),
      });
    } finally {
      await rm(root, { recursive: true });
    }
  },
};
