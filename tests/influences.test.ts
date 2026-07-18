import { describe, it, expect } from "vitest";
import {
  derivationBaseFor, modifierBaseFor, modifierSuffix, keyForShortForm, defaultAbbr, abbrFor, referenceSuggestions,
} from "../src/core/influences";
import type { EPSettings } from "../src/core/model";

const s = (over: Partial<EPSettings> = {}): EPSettings => ({ sourceAbbrs: {}, modifierSuffix: "s", ...over } as EPSettings);

describe("modifier dot-suffix", () => {
  it("strips a dotted suffix to the base reference", () => {
    expect(modifierBaseFor(s(), "INT.s")).toBe("INT");
    expect(modifierBaseFor(s(), "intelligence.s")).toBe("intelligence");
  });
  it("does NOT treat a bare trailing letter as a modifier", () => {
    expect(modifierBaseFor(s(), "INTs")).toBeNull();
    expect(modifierBaseFor(s(), "INT")).toBeNull();
  });
  it("honours a custom, multi-character suffix", () => {
    expect(modifierBaseFor(s({ modifierSuffix: "mod" }), "STR.mod")).toBe("STR");
    expect(modifierBaseFor(s({ modifierSuffix: "mod" }), "STR.s")).toBeNull();
  });
  it("an empty suffix disables the feature", () => {
    expect(modifierBaseFor(s({ modifierSuffix: "" }), "INT.s")).toBeNull();
    expect(modifierSuffix(s())).toBe("s");
    expect(modifierSuffix(s({ modifierSuffix: "x" }))).toBe("x");
  });
});

describe("short forms", () => {
  it("defaultAbbr is the capitalised first three letters", () => {
    expect(defaultAbbr("Strength")).toBe("STR");
    expect(defaultAbbr("HP")).toBe("HP");
    expect(defaultAbbr("dex")).toBe("DEX");
  });
  it("abbrFor prefers a configured override", () => {
    expect(abbrFor(s({ sourceAbbrs: { Dexterity: "DX" } }), "Dexterity")).toBe("DX");
    expect(abbrFor(s(), "Strength")).toBe("STR");
  });
  it("keyForShortForm resolves keys, overrides and default abbreviations", () => {
    expect(keyForShortForm(s(), "INT", ["INT", "DEX"])).toBe("INT"); // direct, case-insensitive
    expect(keyForShortForm(s(), "str", ["Strength"])).toBe("Strength"); // via defaultAbbr
    expect(keyForShortForm(s({ sourceAbbrs: { Strength: "S" } }), "s", ["Strength"])).toBe("Strength"); // override
    expect(keyForShortForm(s(), "zzz", ["Strength"])).toBeNull();
  });
  it("referenceSuggestions offers both the name and its short form", () => {
    const texts = referenceSuggestions(s(), ["Strength"]).map((x) => x.text);
    expect(texts).toContain("Strength");
    expect(texts).toContain("STR");
  });
});

describe("derivationBaseFor (building-block suffixes)", () => {
  const withBlocks = () =>
    s({
      derivations: [
        { id: "abilityMod", name: "Ability modifier", formula: "floor((x - 10) / 2)", suffix: "am" },
        { id: "profBonus", name: "Proficiency bonus", formula: "2 + floor((max(x, 1) - 1) / 4)", suffix: "pb" },
        { id: "noSuffix", name: "No ref", formula: "x * 2" },
      ],
    });

  it("matches each block's own suffix, case-insensitively", () => {
    expect(derivationBaseFor(withBlocks(), "Level.pb")).toMatchObject({ base: "Level" });
    expect(derivationBaseFor(withBlocks(), "strength.AM")).toMatchObject({ base: "strength" });
  });

  it("requires the dot and a non-empty base; blank suffixes never match", () => {
    expect(derivationBaseFor(withBlocks(), "Levelpb")).toBeNull();
    expect(derivationBaseFor(withBlocks(), ".pb")).toBeNull();
    expect(derivationBaseFor(withBlocks(), "X.noSuffix")).toBeNull();
  });

  it("returns the block formula for the caller to apply", () => {
    expect(derivationBaseFor(withBlocks(), "Level.pb")?.formula).toContain("max(x, 1)");
  });
});
