import { describe, it, expect } from "vitest";
import { snapshotStem, pruneList } from "../src/core/snapshot-store";

describe("snapshotStem", () => {
  it("produces a sortable, padded stem", () => {
    const stem = snapshotStem(new Date(2026, 0, 5, 9, 3, 7)); // Jan 5 2026 09:03:07
    expect(stem).toBe("ep-snapshot-2026-01-05-090307");
  });

  it("orders chronologically under lexicographic sort", () => {
    const a = snapshotStem(new Date(2026, 0, 5, 9, 3, 7));
    const b = snapshotStem(new Date(2026, 0, 5, 9, 3, 8));
    const c = snapshotStem(new Date(2026, 5, 5, 9, 3, 7));
    expect([c, b, a].sort()).toEqual([a, b, c]);
  });
});

describe("pruneList", () => {
  const names = [
    "ep-snapshot-2026-01-01-000000.json",
    "ep-snapshot-2026-01-02-000000.json",
    "ep-snapshot-2026-01-03-000000.json",
    "ep-snapshot-2026-01-04-000000.json",
  ];

  it("returns the oldest beyond the keep count", () => {
    expect(pruneList(names, 2)).toEqual([
      "ep-snapshot-2026-01-01-000000.json",
      "ep-snapshot-2026-01-02-000000.json",
    ]);
  });

  it("keeps everything when under the limit", () => {
    expect(pruneList(names, 10)).toEqual([]);
  });

  it("ignores unrelated files", () => {
    const mixed = [...names, "notes.json", "readme.md"];
    expect(pruneList(mixed, 4)).toEqual([]);
  });

  it("returns all when keep is zero", () => {
    expect(pruneList(names, 0).length).toBe(4);
  });
});
