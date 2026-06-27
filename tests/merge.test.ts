import { describe, it, expect } from "vitest";
import { valuesEqual, conflictingKeys, mergeFrontmatter } from "../src/core/merge";

describe("valuesEqual", () => {
  it("treats undefined and null as equal (absent vs explicit null)", () => {
    expect(valuesEqual(undefined, null)).toBe(true);
  });
  it("compares scalars and arrays structurally", () => {
    expect(valuesEqual(3, 3)).toBe(true);
    expect(valuesEqual("a", "a")).toBe(true);
    expect(valuesEqual([1, 2], [1, 2])).toBe(true);
    expect(valuesEqual([1, 2], [2, 1])).toBe(false);
    expect(valuesEqual(3, "3")).toBe(false);
  });
});

describe("conflictingKeys", () => {
  const base = { HP: 10, AC: 12, Name: "Aria" };

  it("reports no conflict when the other side changed a different key", () => {
    const theirs = { HP: 10, AC: 15, Name: "Aria" }; // they changed AC
    const mine = { HP: 8, AC: 12, Name: "Aria" }; // we changed HP
    expect(conflictingKeys(base, theirs, mine, ["HP"])).toEqual([]);
  });

  it("reports no conflict when both sides made the identical change", () => {
    const theirs = { HP: 8, AC: 12, Name: "Aria" };
    const mine = { HP: 8, AC: 12, Name: "Aria" };
    expect(conflictingKeys(base, theirs, mine, ["HP"])).toEqual([]);
  });

  it("reports a conflict when both changed the same key differently", () => {
    const theirs = { HP: 5, AC: 12, Name: "Aria" };
    const mine = { HP: 8, AC: 12, Name: "Aria" };
    expect(conflictingKeys(base, theirs, mine, ["HP"])).toEqual(["HP"]);
  });

  it("only considers the keys we actually changed", () => {
    const theirs = { HP: 5, AC: 99, Name: "Aria" }; // they changed HP and AC
    const mine = { HP: 10, AC: 12, Name: "Bram" }; // we changed only Name
    expect(conflictingKeys(base, theirs, mine, ["Name"])).toEqual([]);
  });
});

describe("mergeFrontmatter", () => {
  it("auto-merges edits to disjoint keys", () => {
    const base = { HP: 10, AC: 12 };
    const mine = { HP: 8, AC: 12 };
    const theirs = { HP: 10, AC: 15 };
    const r = mergeFrontmatter(base, mine, theirs);
    expect(r.conflicts).toEqual([]);
    expect(r.merged).toEqual({ HP: 8, AC: 15 });
  });

  it("keeps our value but flags a true conflict", () => {
    const base = { HP: 10 };
    const mine = { HP: 8 };
    const theirs = { HP: 5 };
    const r = mergeFrontmatter(base, mine, theirs);
    expect(r.conflicts).toEqual(["HP"]);
    expect(r.merged.HP).toBe(8);
  });

  it("takes a new key added by only one side", () => {
    const base = { HP: 10 };
    const mine = { HP: 10, Note: "mine" };
    const theirs = { HP: 10 };
    const r = mergeFrontmatter(base, mine, theirs);
    expect(r.conflicts).toEqual([]);
    expect(r.merged).toEqual({ HP: 10, Note: "mine" });
  });

  it("drops a key both sides left unset", () => {
    const r = mergeFrontmatter({ A: undefined }, {}, {});
    expect("A" in r.merged).toBe(false);
  });
});
