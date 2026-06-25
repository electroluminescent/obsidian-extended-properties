import { describe, it, expect } from "vitest";
import type { Layout, Section } from "../src/core/model";
import type { DerivationSetting } from "../src/core/influences";
import {
  TRANSFER_SCHEMA,
  packType,
  packSection,
  parseTransfer,
  referencedDerivations,
  missingDerivations,
  freshSection,
  docSections,
} from "../src/core/transfer";

const DERIVS: DerivationSetting[] = [
  { id: "abilityMod", name: "Ability modifier", formula: "floor((x - 10) / 2)" },
  { id: "half", name: "Half", formula: "x / 2" },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function entry(id: string, key: string, mods?: any[]): any {
  return { id, kind: "prop", key, ...(mods ? { mods } : {}) };
}
function section(id: string, title: string, entries: any[]): Section {
  return { id, title, columns: 1, entries } as unknown as Section;
}
function layout(sections: Section[]): Layout {
  return { version: 6, sections } as unknown as Layout;
}

const sampleLayout = () =>
  layout([
    section("s1", "Combat", [
      entry("e1", "AC", [{ mode: "value", source: "armor" }]),
      entry("e2", "Init", [{ mode: "abilityMod", source: "DEX" }]),
    ]),
    section("s2", "Skills", [entry("e3", "Stealth", [{ mode: "abilityMod", source: "DEX", toggle: "proficiencies" }])]),
  ]);

describe("referencedDerivations", () => {
  it("collects user derivation ids and skips built-ins", () => {
    const refs = referencedDerivations(sampleLayout().sections);
    expect(refs).toContain("abilityMod");
    expect(refs).not.toContain("value");
    expect(refs).not.toContain("formula");
  });
});

describe("packType / parseTransfer round-trip", () => {
  it("stamps schema + kind and bundles only referenced derivations", () => {
    const doc = packType("Monster", sampleLayout(), DERIVS, "2.40.0");
    expect(doc.schema).toBe(TRANSFER_SCHEMA);
    expect(doc.kind).toBe("type");
    expect(doc.plugin).toBe("2.40.0");
    // "half" is never referenced, so it must not travel with the snippet.
    expect(doc.derivations.map((d) => d.id)).toEqual(["abilityMod"]);

    const json = JSON.stringify(doc);
    const back = parseTransfer(json);
    expect(back).not.toBeNull();
    expect(back!.kind).toBe("type");
    expect(back!.layout!.sections).toHaveLength(2);
    expect(docSections(back!)).toHaveLength(2);
  });
});

describe("packSection", () => {
  it("packs a single section and its derivations", () => {
    const s = sampleLayout().sections[1];
    const doc = packSection(s, DERIVS);
    expect(doc.kind).toBe("section");
    expect(doc.name).toBe("Skills");
    expect(doc.derivations.map((d) => d.id)).toEqual(["abilityMod"]);
    expect(docSections(parseTransfer(JSON.stringify(doc))!)).toHaveLength(1);
  });
});

describe("parseTransfer guards", () => {
  it("rejects non-JSON, foreign objects and newer schemas", () => {
    expect(parseTransfer("not json")).toBeNull();
    expect(parseTransfer(JSON.stringify({ hello: "world" }))).toBeNull();
    expect(parseTransfer(JSON.stringify({ ep: "extended-properties", schema: 999, kind: "type", layout: { sections: [] }, derivations: [] }))).toBeNull();
    expect(parseTransfer(JSON.stringify({ ep: "extended-properties", schema: 1, kind: "type", derivations: [] }))).toBeNull();
  });
});

describe("missingDerivations", () => {
  it("returns only derivations absent in the target (case-insensitive)", () => {
    const doc = packType("Monster", sampleLayout(), DERIVS);
    expect(missingDerivations(doc, [])).toHaveLength(1);
    expect(missingDerivations(doc, [{ id: "ABILITYMOD", name: "x", formula: "x" }])).toHaveLength(0);
  });
});

describe("freshSection", () => {
  it("regenerates section + entry ids while preserving content", () => {
    const src = sampleLayout().sections[0];
    const out = freshSection(src);
    expect(out.id).not.toBe(src.id);
    expect(out.entries.map((e) => e.id)).not.toEqual(src.entries.map((e) => e.id));
    expect(new Set(out.entries.map((e) => e.id)).size).toBe(out.entries.length);
    // content survives the id remap
    expect((out.entries[1] as any).key).toBe("Init");
    expect((out.entries[1] as any).mods[0].mode).toBe("abilityMod");
    // original is untouched (deep clone)
    expect(src.id).toBe("s1");
  });
});
