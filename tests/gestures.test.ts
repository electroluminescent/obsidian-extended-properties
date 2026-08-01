/**
 * Gesture mapping. Desktop has four independent gestures; a touch screen has
 * one long press that is also the platform's context-menu press, so both the
 * hold and the right-click mapping must collapse onto the single
 * right-click-and-hold option - otherwise one press fires two actions.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { effectiveGesture, interactionFor, outsidePopup } from "../src/ui/components/hold-config";

describe("gesture mapping", () => {
  it("keeps every gesture apart on desktop", () => {
    for (const kind of ["click", "dblClick", "hold", "right", "rightHold"] as const) {
      expect(effectiveGesture(kind, false)).toBe(kind);
    }
  });

  it("maps a double click of its own, defaulting to nothing", () => {
    expect(interactionFor({}, "dblClick")).toBe("none");
    expect(interactionFor({ dblClickAction: "settings" }, "dblClick")).toBe("settings");
    // Independent of the single click.
    expect(interactionFor({ dblClickAction: "settings" }, "click")).toBe("none");
    expect(interactionFor({ clickAction: "menu", dblClickAction: "settings" }, "click")).toBe("menu");
  });

  it("leaves a double click alone on mobile, where it is not offered", () => {
    expect(effectiveGesture("dblClick", true)).toBe("dblClick");
    expect(interactionFor({}, effectiveGesture("dblClick", true))).toBe("none");
  });

  it("routes a mobile long press through the right-click-and-hold mapping", () => {
    expect(effectiveGesture("hold", true)).toBe("rightHold");
    expect(effectiveGesture("right", true)).toBe("rightHold");
    // A plain tap is still a tap.
    expect(effectiveGesture("click", true)).toBe("click");
    expect(effectiveGesture("rightHold", true)).toBe("rightHold");
  });

  it("gives mobile one action per press, whatever the desktop mappings are", () => {
    const settings = { holdAction: "focus", rightClickAction: "menu", rightHoldAction: "settings" };
    const mobileActions = new Set(
      (["hold", "right", "rightHold"] as const).map((k) =>
        interactionFor(settings, effectiveGesture(k, true))
      )
    );
    expect([...mobileActions]).toEqual(["settings"]);
    // The same settings stay distinct on desktop.
    expect(interactionFor(settings, effectiveGesture("hold", false))).toBe("focus");
    expect(interactionFor(settings, effectiveGesture("right", false))).toBe("menu");
  });

  it("defaults both holds to the property settings and right click to the menu", () => {
    expect(interactionFor({}, "hold")).toBe("settings");
    expect(interactionFor({}, "rightHold")).toBe("settings");
    expect(interactionFor({}, "right")).toBe("menu");
    expect(interactionFor({}, "click")).toBe("none");
    // So an unconfigured mobile long press opens the property settings.
    expect(interactionFor({}, effectiveGesture("hold", true))).toBe("settings");
  });
});

/**
 * The settings popup dismisses on a press away from it - but a row can open
 * layers that live outside its element (autocomplete, menus, modals, other
 * plugin popups), and a native `<select>` list is drawn outside the page
 * entirely. Only a press that is none of those is "away".
 *
 * The node types are faked because the test environment has no DOM; only the
 * three members `outsidePopup` uses are modelled.
 */
class FakeNode {
  parent: FakeNode | null = null;
  classes: string[] = [];
  /** Obsidian's cross-window `instanceof` (added to Node by the app). */
  instanceOf(type: abstract new (...args: never[]) => unknown): boolean {
    return this instanceof type;
  }
  contains(other: FakeNode | null): boolean {
    for (let n = other; n; n = n.parent) if (n === this) return true;
    return false;
  }
  closest(sel: string): FakeNode | null {
    const wanted = sel.split(",").map((s) => s.trim());
    for (let n: FakeNode | null = this; n; n = n.parent) {
      if (n.classes.some((c) => wanted.includes("." + c))) return n;
    }
    return null;
  }
}
class FakeElement extends FakeNode {}
class FakeSelect extends FakeElement {}

/** `outsidePopup` narrows with instanceof; point those globals at the fakes. */
beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.Node = FakeNode;
  g.HTMLElement = FakeElement;
  g.HTMLSelectElement = FakeSelect;
});

/** A child element `depth` levels under `parent`, carrying `classes`. */
function child(parent: FakeNode | null, classes: string[] = []): FakeElement {
  const el = new FakeElement();
  el.parent = parent;
  el.classes = classes;
  return el;
}

describe("settings popup dismissal", () => {
  const setup = () => {
    const body = new FakeElement();
    const pop = child(body, ["ep-popup", "ep-entrysettings"]);
    const doc = { body, documentElement: body, activeElement: null } as unknown as Document;
    const away = (target: unknown): boolean =>
      outsidePopup(pop as unknown as HTMLElement, target as EventTarget, doc);
    return { body, pop, doc, away };
  };

  it("dismisses on a press somewhere else in the app", () => {
    const { body, away } = setup();
    expect(away(child(body, ["ep-sidebar"]))).toBe(true);
    expect(away(body)).toBe(true);
  });

  it("stays open for a press inside itself", () => {
    const { pop, away } = setup();
    expect(away(child(pop, ["setting-item"]))).toBe(false);
  });

  it("stays open for the layers its own rows open", () => {
    const { body, away } = setup();
    for (const layer of ["suggestion-container", "menu", "modal-container", "prompt", "ep-popup"]) {
      const item = child(child(body, [layer]), ["item"]);
      expect(away(item)).toBe(false);
    }
  });

  it("stays open while a dropdown inside it is picking an option", () => {
    const { body, pop, doc, away } = setup();
    const select = new FakeSelect();
    select.parent = pop;
    // The native list is drawn outside the page: the press reports the
    // document while the select keeps focus.
    (doc as { activeElement: unknown }).activeElement = select;
    expect(away(body)).toBe(false);
    // A real press elsewhere still dismisses, focused select or not.
    expect(away(child(body, ["ep-sidebar"]))).toBe(true);
  });

  it("ignores events with no node at all", () => {
    const { away } = setup();
    expect(away(null)).toBe(false);
  });
});
