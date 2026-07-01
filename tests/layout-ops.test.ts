import { describe, it, expect } from "vitest";
import type { Entry, Layout, Section } from "../src/core/model";
import {
  addColumnAt, addRowAt, blankEntry, ensurePropEntries, gridRows, moveEntryTo, moveLeavingBlank,
  moveSectionBy, moveSectionTo, removeColumnAt, removeRowAt, reorderByDomOrder, swapEntries,
} from "../src/core/layout-ops";

function prop(id: string, key = id): Entry {
  return { id, kind: "prop", key } as Entry;
}
function section(id: string, entries: Entry[], columns = 1): Section {
  return { id, title: id, columns, entries } as Section;
}
function layout(sections: Section[]): Layout {
  return { version: 4, sections };
}

describe("section ordering", () => {
  it("moveSectionBy shifts within range and rejects out-of-range", () => {
    const l = layout([section("a", []), section("b", []), section("c", [])]);
    expect(moveSectionBy(l, "b", -1)).toBe(true);
    expect(l.sections.map((s) => s.id)).toEqual(["b", "a", "c"]);
    expect(moveSectionBy(l, "b", -5)).toBe(false);
    expect(moveSectionBy(l, "missing", 1)).toBe(false);
  });

  it("moveSectionTo places before/after a target", () => {
    const l = layout([section("a", []), section("b", []), section("c", [])]);
    expect(moveSectionTo(l, "c", "a", false)).toBe(true);
    expect(l.sections.map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(moveSectionTo(l, "a", "a", true)).toBe(false);
  });
});

describe("entry moves", () => {
  it("moveEntryTo relocates across sections relative to a target", () => {
    const l = layout([section("s1", [prop("a"), prop("b")]), section("s2", [prop("c")])]);
    expect(moveEntryTo(l, "a", "s1", "s2", "c", false)).toBe(true);
    expect(l.sections[0].entries.map((e) => e.id)).toEqual(["b"]);
    expect(l.sections[1].entries.map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("swapEntries exchanges two entries in place, even across sections", () => {
    const l = layout([section("s1", [prop("a"), prop("b")]), section("s2", [prop("c")])]);
    expect(swapEntries(l, "a", "c")).toBe(true);
    expect(l.sections[0].entries.map((e) => e.id)).toEqual(["c", "b"]);
    expect(l.sections[1].entries.map((e) => e.id)).toEqual(["a"]);
    expect(swapEntries(l, "a", "missing")).toBe(false);
  });

  it("moveLeavingBlank replaces the cell and appends the entry at the end", () => {
    const l = layout([section("s1", [prop("a"), prop("b")])]);
    expect(moveLeavingBlank(l, "a", "s1")).toBe(true);
    const ids = l.sections[0].entries.map((e) => e.kind === "blank" ? "blank" : e.id);
    expect(ids).toEqual(["blank", "b", "a"]);
  });

  it("reorderByDomOrder applies observed DOM order and keeps unknown entries", () => {
    const l = layout([section("s1", [prop("a")]), section("s2", [prop("b"), prop("c")])]);
    expect(reorderByDomOrder(l, "a", "s1", "s2", ["c", "a", "b"])).toBe(true);
    expect(l.sections[1].entries.map((e) => e.id)).toEqual(["c", "a", "b"]);
  });
});

describe("ensurePropEntries", () => {
  it("adds only missing keys, case-insensitively, to the front of the section", () => {
    const sec = section("s1", [prop("existing", "Strength")]);
    const l = layout([sec]);
    const added = ensurePropEntries(l, sec, ["strength", "Dexterity"]);
    expect(added).toBe(1);
    expect(sec.entries[0].key).toBe("Dexterity");
    expect(sec.entries.some((e) => e.key === "Strength")).toBe(true);
  });
});

describe("grid row/column operations", () => {
  it("gridRows chunks and pads short rows with blanks", () => {
    const sec = section("s1", [prop("a"), prop("b"), prop("c")], 2);
    const rows = gridRows(sec, 2);
    expect(rows.length).toBe(2);
    expect(rows[1][1].kind).toBe("blank");
  });

  it("addColumnAt inserts a blank column for grid mode", () => {
    const sec = section("s1", [prop("a"), prop("b")], 2);
    addColumnAt(sec, 1, true);
    expect(sec.columns).toBe(3);
    expect(sec.entries.length).toBe(3);
    expect(sec.entries[1].kind).toBe("blank");
  });

  it("addColumnAt just increments columns for non-grid modes", () => {
    const sec = section("s1", [prop("a")], 1);
    addColumnAt(sec, 0, false);
    expect(sec.columns).toBe(2);
    expect(sec.entries.length).toBe(1);
  });

  it("removeColumnAt drops a column's cells and never goes below 1", () => {
    const sec = section("s1", [prop("a"), prop("b"), prop("c"), blankEntry()], 2);
    removeColumnAt(sec, 0, true);
    expect(sec.columns).toBe(1);
    removeColumnAt(sec, 0, true);
    expect(sec.columns).toBe(1);
  });

  it("addRowAt / removeRowAt insert and remove a full grid row", () => {
    const sec = section("s1", [prop("a"), prop("b")], 2);
    addRowAt(sec, 0);
    expect(gridRows(sec, 2).length).toBe(2);
    expect(sec.entries[0].kind).toBe("blank");
    removeRowAt(sec, 0);
    expect(sec.entries.map((e) => e.id)).toEqual(["a", "b"]);
  });
});
