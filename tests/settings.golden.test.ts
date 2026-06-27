import { describe, it, expect } from "vitest";
import { normalizeSettings, defaultSettings, DEFAULT_DEFAULTS } from "../src/core/settings";
import type { Layout } from "../src/core/model";
import v1 from "./fixtures/v1-data.json";

const layout = (): Layout => ({ version: 4, sections: [] });

describe("normalizeSettings", () => {
  it("returns full defaults for empty/missing data", () => {
    const s = normalizeSettings(null, layout);
    expect(s).toEqual(defaultSettings());
    expect(s.derivations.length).toBeGreaterThan(0);
  });

  it("migrates the v1 single-layout shape (golden)", () => {
    const s = normalizeSettings(v1, layout);
    // v1's single layout becomes the "Character" type's layout.
    expect(s.types).toEqual(["Character"]);
    expect(s.layouts.character.sections).toHaveLength(1);
    expect(s.layouts.character.sections[0].entries[0].key).toBe("Strength");
    // scalar fields preserved / clamped
    expect(s.hideShown).toBe(false);
    expect(s.modDepth).toBe(32); // clamped from 99
    expect(s.modifierSuffix).toBe("mod");
    // macros sanitised: the malformed entry is dropped
    expect(s.macros).toHaveLength(1);
    expect(s.macros[0]).toMatchObject({ id: "m1", name: "Sneak" });
    // untouched fields fall back to defaults
    expect(s.defaults).toEqual(DEFAULT_DEFAULTS);
    expect(s.rollHistoryLimit).toBe(500);
  });

  it("fills a default layout for a declared type that has none", () => {
    const s = normalizeSettings({ types: ["Beast"], layouts: {} }, layout);
    expect(s.layouts.beast.sections).toEqual([]);
  });

  it("keeps an explicitly empty derivations list (no re-seeding)", () => {
    const s = normalizeSettings({ types: [], layouts: {}, derivations: [] }, layout);
    expect(s.derivations).toEqual([]);
  });

  it("preserves unknown / forward-compat keys and appVersion (carry-over)", () => {
    const s = normalizeSettings(
      {
        types: [],
        layouts: {},
        appVersion: "9.9.9",
        modDepth: "oops", // invalid → must fall back, not carry the bad value
        futureSetting: { nested: 1 },
        myModuleConfig: [1, 2, 3],
      },
      layout
    ) as Record<string, unknown>;
    expect(s.appVersion).toBe("9.9.9");
    expect(s.futureSetting).toEqual({ nested: 1 });
    expect(s.myModuleConfig).toEqual([1, 2, 3]);
    // a handled-but-invalid value is sanitized to its default, never carried raw
    expect(s.modDepth).toBe(8);
  });
});
