/**
 * The overlay slot. A menu and the settings popup are opened by different
 * gestures on the same row, so they have to share one slot - and hand focus
 * back to whatever opened them, or the keyboard restarts from the top.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { closeOverlay, openOverlay, overlayClosed } from "../src/ui/overlay";

interface FakeDoc {
  activeElement: unknown;
  body: unknown;
  documentElement: unknown;
  /** Stands in for the row a re-render put back, found by entry id. */
  replacement: FakeEl | null;
  querySelector: (sel: string) => FakeEl | null;
}

class FakeEl {
  focused = false;
  isConnected = true;
  ownerDocument: FakeDoc;
  id: string | null;
  /** What this element sits inside: ".ep-content" for a row in the view. */
  within: string[];
  constructor(doc: FakeDoc, id: string | null = null, within: string[] = []) {
    this.ownerDocument = doc;
    this.id = id;
    this.within = id === null ? within : [...within, ".ep-entry", ".ep-content"];
  }
  focus(): void {
    this.focused = true;
  }
  instanceOf(): boolean {
    return true;
  }
  closest(sel: string): FakeEl | null {
    return this.within.some((w) => sel.includes(w)) ? this : null;
  }
  getAttribute(): string | null {
    return this.id;
  }
}

/** A document whose focus we can move around. */
function docWith(): FakeDoc {
  const body = { instanceOf: () => false, closest: () => null, isConnected: true };
  const doc: FakeDoc = {
    activeElement: body,
    body,
    documentElement: {},
    replacement: null,
    querySelector: () => doc.replacement,
  };
  return doc;
}

let doc: FakeDoc;

beforeAll(() => {
  vi.useFakeTimers();
  const g = globalThis as Record<string, unknown>;
  g.window = globalThis;
  g.HTMLElement = FakeEl;
});

beforeEach(() => {
  doc = docWith();
  (globalThis as Record<string, unknown>).activeDocument = doc;
  closeOverlay();
});

describe("one at a time", () => {
  it("closes the open overlay when another opens", () => {
    const first = vi.fn();
    const second = vi.fn();
    openOverlay(first);
    openOverlay(second);
    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    closeOverlay();
    expect(second).toHaveBeenCalledOnce();
  });

  it("does not re-enter the slot while closing the previous one", () => {
    const inner = vi.fn();
    // A close handler that reports itself, as the popup's does.
    const first = (): void => overlayClosed(first);
    openOverlay(first);
    openOverlay(inner);
    closeOverlay();
    expect(inner).toHaveBeenCalledOnce();
  });
});

describe("focus", () => {
  it("gives focus back to whatever opened it", () => {
    const opener = new FakeEl(doc);
    doc.activeElement = opener;
    const close = vi.fn();
    openOverlay(close);
    doc.activeElement = doc.body; // the overlay let focus go on the way out
    overlayClosed(close);
    vi.runAllTimers();
    expect(opener.focused).toBe(true);
  });

  it("leaves focus alone when the user has moved it somewhere deliberate", () => {
    const opener = new FakeEl(doc);
    doc.activeElement = opener;
    const close = vi.fn();
    openOverlay(close);
    doc.activeElement = new FakeEl(doc); // clicked something else
    overlayClosed(close);
    vi.runAllTimers();
    expect(opener.focused).toBe(false);
  });

  it("takes focus back from the editor Obsidian hands it to", () => {
    const opener = new FakeEl(doc, "e:1");
    doc.activeElement = opener;
    const close = vi.fn();
    openOverlay(close);
    doc.activeElement = doc.body; // the popup let focus go on the way out
    overlayClosed(close);
    doc.activeElement = new FakeEl(doc); // ... and Obsidian put it in the editor
    vi.runAllTimers();
    expect(opener.focused).toBe(true);
  });

  it("leaves focus where the user put it in the view themselves", () => {
    const opener = new FakeEl(doc, "e:1");
    doc.activeElement = opener;
    const close = vi.fn();
    openOverlay(close);
    doc.activeElement = doc.body;
    overlayClosed(close);
    doc.activeElement = new FakeEl(doc, null, [".ep-content"]); // tabbed onward
    vi.runAllTimers();
    expect(opener.focused).toBe(false);
  });

  it("finds the row again when the view re-rendered underneath", () => {
    const opener = new FakeEl(doc, "e:1");
    doc.activeElement = opener;
    const close = vi.fn();
    openOverlay(close);
    opener.isConnected = false; // the row was rebuilt while the overlay was up
    const rebuilt = new FakeEl(doc, "e:1");
    doc.replacement = rebuilt;
    doc.activeElement = doc.body;
    overlayClosed(close);
    vi.runAllTimers();
    expect(rebuilt.focused).toBe(true);
  });

  it("ignores a report from an overlay that was already replaced", () => {
    const opener = new FakeEl(doc);
    doc.activeElement = opener;
    const first = vi.fn();
    openOverlay(first);
    doc.activeElement = doc.body;
    const second = vi.fn();
    openOverlay(second); // takes the slot; `first` is stale from here
    overlayClosed(first);
    vi.runAllTimers();
    expect(opener.focused).toBe(false);
  });
});
