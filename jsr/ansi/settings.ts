/** Mutable terminal ANSI settings. @module */

import { stderr, stdout } from "@neotales/process/streams";
import { Lazy } from "./_lazy.ts";
import { detectMode } from "./detector.ts";
import { AnsiModes, type AnsiMode } from "./enums.ts";

let current = new Lazy<AnsiSettings>(() => new AnsiSettings(detectMode()));

/** Controls the active ANSI color mode and terminal hyperlink preference. */
export class AnsiSettings {
  #links: boolean;

  constructor(public mode: AnsiMode) {
    this.#links = mode === AnsiModes.TwentyFourBit;
  }

  static get current(): AnsiSettings {
    return current.value;
  }

  static set current(value: AnsiSettings) {
    current = new Lazy(() => value);
  }

  get stdout(): boolean {
    return this.mode > 0 && stdout.isTerm();
  }

  get stderr(): boolean {
    return this.mode > 0 && stderr.isTerm();
  }

  get links(): boolean {
    return this.#links;
  }

  set links(value: boolean) {
    this.#links = value;
  }
}
