import {
  exists,
  type FileInfo,
  mkdir,
  readdir,
  readTextFile,
  rm,
  stat,
  writeTextFile,
} from "../../jsr/fs/mod.ts";

export type FsScenarioReport = {
  entries: string[];
  exists: boolean;
  info: Pick<FileInfo, "isDirectory" | "isFile" | "size">;
  text: string;
};

/** Exercises the `@neotales/fs` module against the host filesystem. */
export async function runFsScenario(directory: string): Promise<FsScenarioReport> {
  const file = `${directory}/value.txt`;
  try {
    await mkdir(directory, { recursive: true });
    await writeTextFile(file, "clearscript-fs");
    const [text, info, listed] = await Promise.all([
      readTextFile(file),
      stat(file),
      collect(readdir(directory)),
    ]);
    return {
      entries: listed.sort(),
      exists: await exists(file),
      info: { isDirectory: info.isDirectory, isFile: info.isFile, size: info.size },
      text,
    };
  } finally {
    await rm(directory, { recursive: true });
  }
}

async function collect(entries: AsyncIterable<{ name: string }>): Promise<string[]> {
  const names: string[] = [];
  for await (const entry of entries) names.push(entry.name);
  return names;
}
