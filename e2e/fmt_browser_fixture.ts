import { inspect } from "../jsr/fmt/inspect.ts";

(globalThis as { fmtInspect?: typeof inspect }).fmtInspect = inspect;
