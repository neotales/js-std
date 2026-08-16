/** Mutable terminal ANSI settings. @module */
import { type AnsiMode } from "./enums.js";
/** Controls the active ANSI color mode and terminal hyperlink preference. */
export declare class AnsiSettings {
    #private;
    mode: AnsiMode;
    constructor(mode: AnsiMode);
    static get current(): AnsiSettings;
    static set current(value: AnsiSettings);
    get stdout(): boolean;
    get stderr(): boolean;
    get links(): boolean;
    set links(value: boolean);
}
