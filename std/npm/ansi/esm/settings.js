/** Mutable terminal ANSI settings. @module */
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AnsiSettings_links;
import { stderr, stdout } from "@neotales/process/streams";
import { Lazy } from "./_lazy.js";
import { detectMode } from "./detector.js";
import { AnsiModes } from "./enums.js";
let current = new Lazy(() => new AnsiSettings(detectMode()));
/** Controls the active ANSI color mode and terminal hyperlink preference. */
export class AnsiSettings {
    constructor(mode) {
        Object.defineProperty(this, "mode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: mode
        });
        _AnsiSettings_links.set(this, void 0);
        __classPrivateFieldSet(this, _AnsiSettings_links, mode === AnsiModes.TwentyFourBit, "f");
    }
    static get current() {
        return current.value;
    }
    static set current(value) {
        current = new Lazy(() => value);
    }
    get stdout() {
        return this.mode > 0 && stdout.isTerm();
    }
    get stderr() {
        return this.mode > 0 && stderr.isTerm();
    }
    get links() {
        return __classPrivateFieldGet(this, _AnsiSettings_links, "f");
    }
    set links(value) {
        __classPrivateFieldSet(this, _AnsiSettings_links, value, "f");
    }
}
_AnsiSettings_links = new WeakMap();
