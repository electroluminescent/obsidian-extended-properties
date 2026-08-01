/**
 * A row and the controls inside it both answer to Enter and Space, and the
 * row's handler is delegated - so without a rule, pressing Space on the menu
 * button opened the menu twice: once from the button, once from the row.
 */

import { describe, expect, it } from "vitest";
import { entryKeyAction } from "../src/ui/components/entry-keys";

describe("entryKeyAction", () => {
  it("opens the menu when the row itself has focus", () => {
    expect(entryKeyAction("Enter", true)).toBe("menu");
    expect(entryKeyAction(" ", true)).toBe("menu");
  });

  it("leaves activation to the control that has focus", () => {
    expect(entryKeyAction("Enter", false)).toBeNull();
    expect(entryKeyAction(" ", false)).toBeNull();
  });

  it("navigates from anywhere inside the row, so focus is never trapped", () => {
    for (const from of [true, false]) {
      expect(entryKeyAction("ArrowDown", from)).toBe("next");
      expect(entryKeyAction("ArrowUp", from)).toBe("prev");
      expect(entryKeyAction("Home", from)).toBe("first");
      expect(entryKeyAction("End", from)).toBe("last");
    }
  });

  it("ignores every other key", () => {
    for (const k of ["a", "Escape", "Tab", "ArrowLeft", "PageDown"]) {
      expect(entryKeyAction(k, true)).toBeNull();
    }
  });
});
