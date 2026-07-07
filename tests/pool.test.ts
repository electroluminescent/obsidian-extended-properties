import { describe, expect, it } from "vitest";
import { addPoolExtra, isPoolExtra, poolFor, removePoolExtra } from "../src/core/pool";
import { defaultSettings } from "../src/core/settings";

describe("autofill pool (.p)", () => {
  it("merges vault values with extras, deduplicated case-insensitively, sorted", () => {
    const s = defaultSettings();
    s.poolExtras = { class: ["Wizard", "rogue"] };
    expect(poolFor(s, ["Rogue", "Bard"], "Class")).toEqual(["Bard", "Rogue", "Wizard"]);
  });

  it("addPoolExtra ignores blanks and duplicates", () => {
    const s = defaultSettings();
    expect(addPoolExtra(s, "Class", "  ")).toBe(false);
    expect(addPoolExtra(s, "Class", "Bard")).toBe(true);
    expect(addPoolExtra(s, "class", "bard")).toBe(false); // case-insensitive dupe
    expect(s.poolExtras).toEqual({ class: ["Bard"] });
    expect(isPoolExtra(s, "CLASS", "BARD")).toBe(true);
  });

  it("removePoolExtra drops the entry and cleans up empty keys", () => {
    const s = defaultSettings();
    addPoolExtra(s, "Class", "Bard");
    expect(removePoolExtra(s, "Class", "bard")).toBe(true);
    expect(s.poolExtras?.class).toBeUndefined();
    expect(removePoolExtra(s, "Class", "Bard")).toBe(false);
  });
});
