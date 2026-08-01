/**
 * Renaming a type moves everything keyed by it - layout, icon, scoped macros -
 * so a vault can point the plugin at a property it already uses instead of
 * rebuilding its layouts under the value the plugin happened to be tested with.
 */

import { describe, expect, it } from "vitest";
import type { EPSettings, Layout } from "../src/core/model";
import { renameType, typeNamed } from "../src/core/type-ops";

const layout = (mark: string): Layout =>
  ({ version: 6, sections: [{ id: mark, title: mark, columns: 1, entries: [] }] }) as unknown as Layout;

/** Only the fields `renameType` reads; the rest of EPSettings is irrelevant here. */
function settings(over: Partial<EPSettings> = {}): EPSettings {
  return {
    types: ["Sims", "Locations"],
    layouts: { sims: layout("sims"), locations: layout("locations") },
    typeIcons: { sims: "user", locations: "map-pin" },
    macros: [
      { id: "m1", name: "Scoped", segs: [], typeKey: "sims" },
      { id: "m2", name: "Global", segs: [] },
    ],
    ...over,
  } as unknown as EPSettings;
}

describe("renameType", () => {
  it("moves the layout, icon and scoped macros to the new key", () => {
    const s = settings();
    expect(renameType(s, "Sims", "sim")).toBe("renamed");
    expect(s.types).toEqual(["sim", "Locations"]);
    expect(s.layouts.sim.sections[0].id).toBe("sims");
    expect(s.layouts.sims).toBeUndefined();
    expect(s.typeIcons?.sim).toBe("user");
    expect(s.typeIcons?.sims).toBeUndefined();
    expect(s.macros[0].typeKey).toBe("sim");
    expect(s.macros[1].typeKey).toBeUndefined();
  });

  it("leaves other types alone", () => {
    const s = settings();
    renameType(s, "Sims", "sim");
    expect(s.layouts.locations.sections[0].id).toBe("locations");
    expect(s.typeIcons?.locations).toBe("map-pin");
  });

  it("treats a case-only change as a display rename", () => {
    const s = settings();
    expect(renameType(s, "Sims", "SIMS")).toBe("renamed");
    expect(s.types).toEqual(["SIMS", "Locations"]);
    // The key never changed, so nothing moved.
    expect(s.layouts.sims.sections[0].id).toBe("sims");
    expect(s.typeIcons?.sims).toBe("user");
  });

  it("merges into an existing type, keeping the renamed layout by default", () => {
    const s = settings();
    expect(renameType(s, "Sims", "Locations")).toBe("merged");
    expect(s.types).toEqual(["Locations"]);
    expect(s.layouts.locations.sections[0].id).toBe("sims");
    expect(s.typeIcons?.locations).toBe("user");
    expect(s.layouts.sims).toBeUndefined();
    expect(s.macros[0].typeKey).toBe("locations");
  });

  it("merges the other way when asked to keep the existing layout", () => {
    const s = settings();
    expect(renameType(s, "Sims", "Locations", "keep")).toBe("merged");
    expect(s.types).toEqual(["Locations"]);
    expect(s.layouts.locations.sections[0].id).toBe("locations");
    expect(s.typeIcons?.locations).toBe("map-pin");
    expect(s.layouts.sims).toBeUndefined();
    // The macro still applies to these notes - only its key changed.
    expect(s.macros[0].typeKey).toBe("locations");
  });

  it("rejects an empty name or an unknown type", () => {
    const s = settings();
    expect(renameType(s, "Sims", "   ")).toBe("invalid");
    expect(renameType(s, "Ghosts", "sim")).toBe("invalid");
    expect(s.types).toEqual(["Sims", "Locations"]);
    expect(s.layouts.sims).toBeDefined();
  });

  it("trims the new name and keeps its casing", () => {
    const s = settings();
    renameType(s, "Sims", "  Sim Cards  ");
    expect(s.types[0]).toBe("Sim Cards");
    expect(s.layouts["sim cards"]).toBeDefined();
  });

  it("survives a type that never had a layout or icon", () => {
    const s = settings({ types: ["Bare"], layouts: {}, typeIcons: {} });
    expect(renameType(s, "Bare", "bare-bones")).toBe("renamed");
    expect(s.types).toEqual(["bare-bones"]);
    expect(s.layouts["bare-bones"]).toBeUndefined();
  });
});

describe("typeNamed", () => {
  it("finds the registered display name for a key, whatever its case", () => {
    const s = settings();
    expect(typeNamed(s, "sims")).toBe("Sims");
    expect(typeNamed(s, "SIMS")).toBe("Sims");
    expect(typeNamed(s, "ghosts")).toBeUndefined();
  });
});
