import { describe, it, expect } from "vitest";
import {
  modifierBaseFor, modifierSuffix, keyForShortForm, defaultAbbr, abbrFor, referenceSuggestions,
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
