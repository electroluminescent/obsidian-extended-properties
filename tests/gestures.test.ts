/**
 * Gesture mapping. Desktop has four independent gestures; a touch screen has
 * one long press that is also the platform's context-menu press, so both the
 * hold and the right-click mapping must collapse onto the single
 * right-click-and-hold option - otherwise one press fires two actions.
 */

import { describe, expect, it } from "vitest";
import { effectiveGesture, interactionFor } from "../src/ui/components/hold-config";

describe("gesture mapping", () => {
  it("keeps the four gestures apart on desktop", () => {
    for (const kind of ["click", "hold", "right", "rightHold"] as const) {
      expect(effectiveGesture(kind, false)).toBe(kind);
    }
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
