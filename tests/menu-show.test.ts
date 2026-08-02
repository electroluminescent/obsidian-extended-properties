/**
 * Showing a menu with its first item already highlighted, so the keyboard can
 * use it straight away - and keeping that highlight through the tail of the
 * press that opened it, without overriding the item a cursor rests on.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { showMenuAt } from "../src/ui/menus/show";

class FakeKeyboardEvent {
  key: string;
  constructor(_type: string, init: { key: string }) {
    this.key = init.key;
  }
}

/** A menu element: on screen or not, with or without a highlighted item. */
function menuEl(opts: { shown: boolean; selected: boolean }): unknown {
  return {
    getClientRects: () => (opts.shown ? [{}] : []),
    querySelector: () => (opts.selected ? {} : null),
  };
}

interface FakeDoc {
  menus: unknown[];
  keys: string[];
  listeners: Map<string, (ev?: unknown) => void>;
  querySelectorAll: (sel: string) => unknown[];
  dispatchEvent: (ev: FakeKeyboardEvent) => void;
  addEventListener: (type: string, fn: (ev?: unknown) => void, opts?: unknown) => void;
  removeEventListener: (type: string, fn: (ev?: unknown) => void, capture?: boolean) => void;
}

/** A key press as the menu's key handler reads it. */
function press(key: string, shiftKey = false): Record<string, unknown> {
  return { key, shiftKey, preventDefault: () => undefined, stopPropagation: () => undefined };
}

function fakeDoc(): FakeDoc {
  const doc: FakeDoc = {
    menus: [],
    keys: [],
    listeners: new Map(),
    querySelectorAll: () => doc.menus,
    dispatchEvent: (ev) => void doc.keys.push(ev.key),
    addEventListener: (type, fn) => void doc.listeners.set(type, fn),
    removeEventListener: (type) => void doc.listeners.delete(type),
  };
  return doc;
}

/** The bit of Obsidian's Menu that showing one touches. */
function fakeMenu(): { showAtPosition: () => void; onHide: () => void; hide: () => void } {
  return { showAtPosition: () => undefined, onHide: () => undefined, hide: hidden };
}

let hidden: () => void;
let doc: FakeDoc;

beforeAll(() => {
  vi.useFakeTimers();
  const g = globalThis as Record<string, unknown>;
  g.window = globalThis;
  g.KeyboardEvent = FakeKeyboardEvent;
  g.HTMLElement = class {}; // the overlay slot asks what had focus
});

beforeEach(() => {
  doc = fakeDoc();
  hidden = vi.fn();
  (globalThis as Record<string, unknown>).activeDocument = doc;
});

/** The key handler the open menu installed. */
function menuKeys(): (ev?: unknown) => void {
  const fn = doc.listeners.get("keydown");
  if (!fn) throw new Error("no key handler while a menu is open");
  return fn;
}

/** Show a menu over a document holding `menus`. */
function show(menus: unknown[]): void {
  doc.menus = menus;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showMenuAt(fakeMenu() as any, { x: 0, y: 0 }, doc as unknown as Document);
}

describe("first item", () => {
  it("highlights it when the menu opens with nothing selected", () => {
    show([menuEl({ shown: true, selected: false })]);
    vi.runAllTimers();
    expect(doc.keys).toContain("ArrowDown");
  });

  it("leaves a menu that already has a selection alone", () => {
    show([menuEl({ shown: true, selected: true })]);
    vi.runAllTimers();
    expect(doc.keys).toHaveLength(0);
  });

  it("ignores the hidden menus Obsidian parks in the document", () => {
    show([menuEl({ shown: false, selected: false })]);
    vi.runAllTimers();
    expect(doc.keys).toHaveLength(0);
  });
});

describe("keys while a menu is open", () => {
  it("moves the selection on Tab, and back on shift-Tab", () => {
    show([menuEl({ shown: true, selected: true })]);
    vi.runAllTimers();
    doc.keys.length = 0;
    menuKeys()(press("Tab"));
    menuKeys()(press("Tab", true));
    expect(doc.keys).toEqual(["ArrowDown", "ArrowUp"]);
  });

  it("closes on Escape rather than letting Obsidian have the key", () => {
    show([menuEl({ shown: true, selected: true })]);
    menuKeys()(press("Escape"));
    expect(hidden).toHaveBeenCalledOnce();
  });

  it("leaves Escape alone once the menu is gone", () => {
    show([menuEl({ shown: false, selected: false })]); // parked, not on screen
    menuKeys()(press("Escape"));
    expect(hidden).not.toHaveBeenCalled();
  });
});

describe("the tail of a hold", () => {
  it("puts the highlight back when the release clears it", () => {
    const menu = menuEl({ shown: true, selected: false });
    show([menu]);
    vi.advanceTimersByTime(1);
    doc.keys.length = 0; // the opening highlight, since taken off again
    doc.listeners.get("pointerup")?.();
    vi.runAllTimers();
    expect(doc.keys).toContain("ArrowDown");
  });

  it("does not move the highlight off the item the cursor came to rest on", () => {
    show([menuEl({ shown: true, selected: true })]);
    vi.advanceTimersByTime(1);
    doc.listeners.get("pointerup")?.();
    vi.runAllTimers();
    expect(doc.keys).toHaveLength(0);
  });
});
