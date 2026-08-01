/**
 * Tab through a note's fields. The chain must reach every kind of value in
 * screen order, open an editable one on arrival - whatever gesture the mouse
 * is set to - and run out at both ends, so focus can leave the sidebar.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { enterField, registerOpener, stepField } from "../src/ui/components/tab-chain";

/** The three members the chain uses; the test env has no DOM. */
class FakeEl {
  classes: string[] = [];
  focused = false;
  offsetParent: unknown = {};
  constructor(...classes: string[]) {
    this.classes = classes;
  }
  hasClass(c: string): boolean {
    return this.classes.includes(c);
  }
  focus(): void {
    this.focused = true;
  }
  getClientRects(): unknown[] {
    return this.offsetParent ? [{}] : [];
  }
}

/** A scope whose querySelectorAll returns the given elements in order. */
function scopeOf(els: FakeEl[]): ParentNode {
  return { querySelectorAll: () => els } as unknown as ParentNode;
}

const as = (el: FakeEl): HTMLElement => el as unknown as HTMLElement;

beforeAll(() => {
  vi.useFakeTimers();
  (globalThis as Record<string, unknown>).window = globalThis;
});

describe("stepField", () => {
  it("walks forwards and backwards through the fields", () => {
    const a = new FakeEl("ep-editable");
    const b = new FakeEl();
    const c = new FakeEl("ep-list-addbtn");
    const scope = scopeOf([a, b, c]);

    expect(stepField(scope, as(a), false)).toBe(true);
    vi.runAllTimers();
    expect(b.focused).toBe(true);

    expect(stepField(scope, as(c), true)).toBe(true);
    vi.runAllTimers();
    expect(b.focused).toBe(true);
  });

  it("runs out at both ends, so the key falls through to the browser", () => {
    const a = new FakeEl("ep-editable");
    const b = new FakeEl("ep-editable");
    const scope = scopeOf([a, b]);
    expect(stepField(scope, as(b), false)).toBe(false);
    expect(stepField(scope, as(a), true)).toBe(false);
  });

  it("ignores a starting point that is not part of the chain", () => {
    const a = new FakeEl("ep-editable");
    const stranger = new FakeEl();
    expect(stepField(scopeOf([a]), as(stranger), false)).toBe(false);
  });

  it("skips fields that are not on screen (a collapsed section)", () => {
    const a = new FakeEl("ep-editable");
    const hidden = new FakeEl("ep-editable");
    hidden.offsetParent = null;
    const c = new FakeEl("ep-editable");
    const scope = scopeOf([a, hidden, c]);
    expect(stepField(scope, as(a), false)).toBe(true);
    vi.runAllTimers();
    expect(hidden.focused).toBe(false);
    expect(c.focused).toBe(true);
  });
});

describe("enterField", () => {
  it("opens an editable value on arrival", () => {
    const el = new FakeEl("ep-editable");
    const open = vi.fn();
    registerOpener(as(el), open);
    enterField(as(el));
    expect(el.focused).toBe(true);
    expect(open).toHaveBeenCalledOnce();
  });

  it("only focuses a control - Space toggles a checkbox, Enter opens a picker", () => {
    const el = new FakeEl();
    enterField(as(el));
    expect(el.focused).toBe(true);
  });
});
