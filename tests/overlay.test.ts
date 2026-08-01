/**
 * The overlay slot. A menu and the settings popup are opened by different
 * gestures on the same row, so they have to share one slot - and hand focus
 * back to whatever opened them, or the keyboard restarts from the top.
 */

import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { closeOverlay, openOverlay, overlayClosed } from "../src/ui/overlay";

class FakeEl {
  focused = false;
  isConnected = true;
  ownerDocument: { activeElement: unknown; body: unknown; documentElement: unknown };
  constructor(doc: { activeElement: unknown; body: unknown; documentElement: unknown }) {
    this.ownerDocument = doc;
  }
  focus(): void {
    this.focused = true;
  }
}

/** A document whose focus we can move around. */
function docWith(): { activeElement: unknown; body: unknown; documentElement: unknown } {
  const body = {};
  return { activeElement: body, body, documentElement: {} };
}

let doc: ReturnType<typeof docWith>;

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
