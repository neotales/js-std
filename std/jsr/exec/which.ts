/**
 * The `which` module provides a way to find the full path of an executable file
 * given its name.
 *
 * @module
 */

import { expand, get, getPath, splitPath } from "@neotales/env";
import { basename, extname, globToRegExp, isAbsolute, isGlob, join, resolve } from "@neotales/path";
import {
  expandGlob,
  expandGlobSync,
  isdir,
  isdirSync,
  isfile,
  isfileSync,
  readdir,
  readdirSync,
} from "@neotales/fs";
import { WIN } from "./globals.ts";
import { isNullOrSpace } from "@neotales/strings/is-space";
import { isNullOrEmpty } from "@neotales/strings/is-empty";
import { endsWithFold } from "@neotales/strings/ends-with";

const executableCache: { [key: string]: string | undefined } = {};

/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 * @example
 * ```ts
 * import { whichSync } from "@neotales/exec";
 *
 * // Find an executable on the PATH
 * const gitPath = whichSync("git");
 * console.log(gitPath); // "/usr/bin/git" or undefined
 *
 * // Search with additional paths
 * const customPath = whichSync("my-tool", ["/opt/tools/bin"]);
 *
 * // Disable caching for fresh lookup
 * const freshPath = whichSync("node", undefined, false);
 * ```
 */
export function whichSync(
  fileName: string,
  prependPath?: string[],
  useCache = true,
  debug = false,
): string | undefined {
  if (isNullOrSpace(fileName)) {
    throw new Error("Argument 'fileName' cannot be null or empty.");
  }

  const rootName = basename(fileName, extname(fileName));
  let location = executableCache[rootName];
  if (useCache && location !== undefined) {
    return location;
  }

  if (isAbsolute(fileName) && isfileSync(fileName)) {
    location = fileName;
    if (useCache) {
      executableCache[rootName] = location;
      executableCache[fileName] = location;
    }

    return location;
  }

  prependPath = prependPath?.map<string>((o) => {
    if (isAbsolute(o)) {
      return o;
    }

    return resolve(o);
  });

  const baseName = basename(fileName);
  const baseNameLowered = baseName.toLowerCase();

  const systemPaths = splitPath(getPath())
    .filter((segment) => segment.length > 0)
    .map((segment) => expand(segment));

  const pathSegments = prependPath !== undefined ? prependPath.concat(systemPaths) : systemPaths;
  let pathExtSegments: string[] = [];

  if (WIN) {
    const pe = get("PATHEXT") || "";
    const pathExtensions = !isNullOrSpace(pe)
      ? pe?.toLowerCase()
      : ".com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh";

    pathExtSegments = pathExtensions.split(";").filter((segment) => !isNullOrSpace(segment));
  }

  for (const pathSegment of pathSegments) {
    if (isNullOrEmpty(pathSegment) || !isdirSync(pathSegment)) {
      continue;
    }

    if (WIN) {
      const hasPathExt = pathExtSegments.find((segment) =>
        endsWithFold(fileName, segment)
      ) !== undefined;

      if (!hasPathExt) {
        try {
          let first: { name: string | undefined } | undefined;

          for (const entry of readdirSync(pathSegment)) {
            if (entry.isFile) {
              for (const ext of pathExtSegments) {
                if (entry.name?.toLowerCase() === baseNameLowered + ext) {
                  first = entry;
                  break;
                }
              }

              if (first) {
                break;
              }
            }
          }

          if (first?.name) {
            location = join(pathSegment, first.name);
            executableCache[rootName] = location;
            executableCache[fileName] = location;

            return location;
          }
        } catch (e) {
          if (debug) {
            console.debug(e);
          }
        }
      } else {
        try {
          let first: { name: string | undefined } | undefined;
          for (const entry of readdirSync(pathSegment)) {
            if (entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
              first = entry;
              break;
            }
          }

          if (first?.name) {
            location = join(pathSegment, first.name);
            executableCache[rootName] = location;
            executableCache[fileName] = location;

            return location;
          }
        } catch (e) {
          if (debug) {
            console.debug(e);
          }
        }
      }
    } else {
      try {
        let first: { name: string | undefined } | undefined;
        for (const entry of readdirSync(pathSegment)) {
          if (entry.isFile && entry.name?.toLowerCase() === baseNameLowered) {
            first = entry;
            break;
          }
        }

        if (first?.name) {
          location = join(pathSegment, first.name);
          executableCache[rootName] = location;
          executableCache[fileName] = location;

          return location;
        }
      } catch (e) {
        if (debug) {
          console.debug(e);
        }
      }
    }
  }

  return undefined;
}

/**
 * which - Returns the full path of the executable file of the given program;
 * otherwise, returns undefined.
 *
 * @remarks The returned path is the full path of the executable file of the given program
 * if the program can be found in the system PATH environment variable or
 * using any of the paths from `prependedPaths` if specified.
 *
 * By default, `which` will cache the first lookup and then use the cache
 * for subsequent lookups unless `useCache` is set to false.
 *
 * @param {string} fileName The program file name.
 * @param {(string[] | undefined)} prependPath The paths to prepend to the PATH environment variable.
 * @param {IEnvironment} env The environment class to use to lookup environment variables. Defaults to `envDefault`.
 * @param {boolean} useCache
 * @returns {string | undefined}
 * @example
 * ```ts
 * import { which } from "@neotales/exec";
 *
 * // Find an executable on the PATH
 * const gitPath = await which("git");
 * console.log(gitPath); // "/usr/bin/git" or undefined
 *
 * // Check if an executable exists
 * const hasDocker = await which("docker") !== undefined;
 * console.log("Docker installed:", hasDocker);
 *
 * // Search with additional paths
 * const toolPath = await which("my-tool", ["/opt/custom/bin"]);
 * ```
 */
export async function which(
  fileName: string,
  prependPath?: string[],
  useCache = true,
  debug = false,
): Promise<string | undefined> {
  if (isNullOrSpace(fileName)) {
    throw new Error("Argument 'fileName' cannot be null or empty.");
  }

  const rootName = basename(fileName, extname(fileName));
  let location = executableCache[rootName];
  if (useCache && location !== undefined) {
    return location;
  }

  if (isAbsolute(fileName) && (await isfile(fileName))) {
    location = fileName;
    if (useCache) {
      executableCache[rootName] = location;
      executableCache[fileName] = location;
    }

    return location;
  }

  prependPath = prependPath?.map<string>((o) => {
    if (isAbsolute(o)) {
      return o;
    }

    return resolve(o);
  });

  const baseName = basename(fileName);
  const baseNameLowered = baseName.toLowerCase();

  const systemPaths = splitPath()
    .filter((segment) => segment.length)
    .map((segment) => expand(segment));

  const pathSegments = prependPath !== undefined ? prependPath.concat(systemPaths) : systemPaths;
  let pathExtSegments: string[] = [];

  if (WIN) {
    const pe = get("PATHEXT") || "";
    const pathExtensions = !isNullOrSpace(pe)
      ? pe?.toLowerCase()
      : ".com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh";

    pathExtSegments = pathExtensions.split(";").filter((segment) => !isNullOrSpace(segment));
  }

  for (const pathSegment of pathSegments) {
    if (isNullOrEmpty(pathSegment)) {
      continue;
    }

    const isDirectory = await isdir(pathSegment);
    if (!isDirectory) {
      continue;
    }

    if (WIN) {
      const hasPathExt = pathExtSegments.find((segment) =>
        endsWithFold(fileName, segment)
      ) !== undefined;

      if (!hasPathExt) {
        try {
          let first: { name: undefined | string } | undefined;
          for await (const entry of readdir(pathSegment)) {
            if (!entry.isDirectory) {
              for (const ext of pathExtSegments) {
                if (entry.name?.toLowerCase() === baseNameLowered + ext) {
                  first = entry;
                  break;
                }
              }

              if (first) {
                break;
              }
            }
          }

          if (first?.name) {
            location = join(pathSegment, first.name);
            executableCache[rootName] = location;
            executableCache[fileName] = location;

            return location;
          }
        } catch (e) {
          if (debug) {
            console.debug(e);
          }
        }
      } else {
        try {
          let first: { name: undefined | string } | undefined;
          for await (const entry of readdir(pathSegment)) {
            if (!entry.isDirectory && entry.name?.toLowerCase() === baseNameLowered) {
              first = entry;
              break;
            }
          }

          if (first?.name) {
            location = join(pathSegment, first.name);
            executableCache[rootName] = location;
            executableCache[fileName] = location;

            return location;
          }
        } catch (e) {
          if (debug) {
            console.debug(e);
          }
        }
      }
    } else {
      try {
        let first: { name: undefined | string } | undefined;
        for await (const entry of readdir(pathSegment)) {
          if (!entry.isDirectory && entry.name?.toLowerCase() === baseNameLowered) {
            first = entry;
            break;
          }
        }

        if (first?.name) {
          location = join(pathSegment, first.name);
          executableCache[rootName] = location;
          executableCache[fileName] = location;

          return location;
        }
      } catch (e) {
        if (debug) {
          console.debug(e);
        }
      }
    }
  }

  return undefined;
}

/**
 * Finds every executable file matching a name or glob pattern.
 *
 * Searches `prependPath` before the system `PATH`. A simple executable name
 * uses Windows `PATHEXT` matching when applicable. An absolute glob is expanded
 * directly, while a name-only glob is matched against each `PATH` entry.
 *
 * @param fileName The executable name or glob pattern to find.
 * @param prependPath Paths to search before the system `PATH`.
 * @param debug Whether to log filesystem errors encountered while searching.
 * @returns Every matching executable path, in search order.
 * @example
 * ```ts
 * import { whichAll } from "@neotales/exec";
 *
 * const nodeExecutables = await whichAll("node*");
 * console.log(nodeExecutables);
 * ```
 */
export async function whichAll(
  fileName: string,
  prependPath?: string[],
  debug = false,
): Promise<string[]> {
  if (isNullOrSpace(fileName)) {
    throw new Error("Argument 'fileName' cannot be null or empty.");
  }

  if (isAbsolute(fileName)) {
    if (!isGlob(fileName)) return (await isfile(fileName)) ? [fileName] : [];
    const paths: string[] = [];
    for await (const entry of expandGlob(fileName, { includeDirs: false })) {
      if (entry.isFile) paths.push(entry.path);
    }
    return paths;
  }

  const baseName = basename(fileName);
  const pattern = isGlob(baseName)
    ? globToRegExp(baseName, { caseInsensitive: WIN, globstar: false })
    : undefined;
  const extensions = WIN
    ? (get("PATHEXT") || ".com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh")
      .toLowerCase()
      .split(";")
      .filter((extension) => !isNullOrSpace(extension))
    : [];
  const hasExtension = extensions.some((extension) => endsWithFold(fileName, extension));
  const expectedName = baseName.toLowerCase();
  const pathSegments = [
    ...(prependPath ?? []).map((path) => (isAbsolute(path) ? path : resolve(path))),
    ...splitPath(getPath())
      .filter((path) => path.length > 0)
      .map((path) => expand(path)),
  ];
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const pathSegment of pathSegments) {
    if (isNullOrEmpty(pathSegment) || !(await isdir(pathSegment))) continue;
    try {
      for await (const entry of readdir(pathSegment)) {
        if (!entry.isFile || !entry.name) continue;
        const name = entry.name.toLowerCase();
        const matches = pattern
          ? pattern.test(entry.name)
          : WIN && !hasExtension
          ? extensions.some((extension) => name === expectedName + extension)
          : name === expectedName;
        if (!matches) continue;
        const path = join(pathSegment, entry.name);
        if (!seen.has(path)) {
          seen.add(path);
          paths.push(path);
        }
      }
    } catch (error) {
      if (debug) console.debug(error);
    }
  }

  return paths;
}

/**
 * Synchronously finds every executable file matching a name or glob pattern.
 *
 * Searches `prependPath` before the system `PATH`. A simple executable name
 * uses Windows `PATHEXT` matching when applicable. An absolute glob is expanded
 * directly, while a name-only glob is matched against each `PATH` entry.
 *
 * @param fileName The executable name or glob pattern to find.
 * @param prependPath Paths to search before the system `PATH`.
 * @param debug Whether to log filesystem errors encountered while searching.
 * @returns Every matching executable path, in search order.
 * @example
 * ```ts
 * import { whichAllSync } from "@neotales/exec";
 *
 * const nodeExecutables = whichAllSync("node*");
 * console.log(nodeExecutables);
 * ```
 */
export function whichAllSync(fileName: string, prependPath?: string[], debug = false): string[] {
  if (isNullOrSpace(fileName)) {
    throw new Error("Argument 'fileName' cannot be null or empty.");
  }

  if (isAbsolute(fileName)) {
    if (!isGlob(fileName)) return isfileSync(fileName) ? [fileName] : [];
    const paths: string[] = [];
    for (const entry of expandGlobSync(fileName, { includeDirs: false })) {
      if (entry.isFile) paths.push(entry.path);
    }
    return paths;
  }

  const baseName = basename(fileName);
  const pattern = isGlob(baseName)
    ? globToRegExp(baseName, { caseInsensitive: WIN, globstar: false })
    : undefined;
  const extensions = WIN
    ? (get("PATHEXT") || ".com;.exe;.bat;.cmd;.vbs;.vbe;.js;.jse;.wsf;.wsh")
      .toLowerCase()
      .split(";")
      .filter((extension) => !isNullOrSpace(extension))
    : [];
  const hasExtension = extensions.some((extension) => endsWithFold(fileName, extension));
  const expectedName = baseName.toLowerCase();
  const pathSegments = [
    ...(prependPath ?? []).map((path) => (isAbsolute(path) ? path : resolve(path))),
    ...splitPath(getPath())
      .filter((path) => path.length > 0)
      .map((path) => expand(path)),
  ];
  const paths: string[] = [];
  const seen = new Set<string>();

  for (const pathSegment of pathSegments) {
    if (isNullOrEmpty(pathSegment) || !isdirSync(pathSegment)) continue;
    try {
      for (const entry of readdirSync(pathSegment)) {
        if (!entry.isFile || !entry.name) continue;
        const name = entry.name.toLowerCase();
        const matches = pattern
          ? pattern.test(entry.name)
          : WIN && !hasExtension
          ? extensions.some((extension) => name === expectedName + extension)
          : name === expectedName;
        if (!matches) continue;
        const path = join(pathSegment, entry.name);
        if (!seen.has(path)) {
          seen.add(path);
          paths.push(path);
        }
      }
    } catch (error) {
      if (debug) console.debug(error);
    }
  }

  return paths;
}
