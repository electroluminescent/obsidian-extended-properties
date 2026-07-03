/**
 * PropertyIndex scaling assertions (N2). Deterministic work-count and
 * identity checks - never wall-clock - so CI noise can't flake them:
 *
 *  - a warm cache serves reads with zero metadata-cache traffic;
 *  - aggregate candidate sets are memoized (same array identity) until a
 *    note of that type changes;
 *  - a per-type read touches only that type's notes, not the vault;
 *  - a note changing its Type list moves buckets and dirties both sides'
 *    aggregates (the classic under-invalidation trap).
 */

import { describe, expect, it } from "vitest";
import { PropertyIndex } from "../../src/core/property-index";
import { FixtureApp, generateVault } from "./fixture";

const N = 2000;
const TYPES = ["Character", "Beast", "Item", "Place"];

const makeIndex = (app: FixtureApp): PropertyIndex => new PropertyIndex(app as never);

describe("PropertyIndex scaling (N2)", () => {
  it("a warm cache serves reads with zero metadata-cache traffic", () => {
    const app = new FixtureApp();
    generateVault(app, N, TYPES);
    const idx = makeIndex(app);
    idx.valuesByType("Character", "Level"); // cold read builds the cache
    const cold = app.cacheReads;
    expect(cold).toBeGreaterThanOrEqual(N); // one consult per file, once
    for (let i = 0; i < 200; i++) {
      idx.valuesByType("Character", "Level");
      idx.valuesByType("Beast", "HP");
      idx.rowsByType("Item");
    }
    expect(app.cacheReads).toBe(cold); // flat - renders cost no re-scan
  });

  it("memoizes aggregates until a note of that type changes", () => {
    const app = new FixtureApp();
    generateVault(app, N, TYPES);
    const idx = makeIndex(app);
    const a1 = idx.valuesByType("Character", "Level");
    const a2 = idx.valuesByType("Character", "Level");
    expect(a2).toBe(a1); // identical array: no recompute
    const b1 = idx.valuesByType("Beast", "HP");

    // Edit one Character note -> Character aggregates recompute, Beast's don't.
    app.setFm("n/0.md", { Type: ["Character"], Level: 999 });
    idx.invalidateFile(app.files.get("n/0.md")!.file);
    const a3 = idx.valuesByType("Character", "Level");
    expect(a3).not.toBe(a1);
    expect(a3).toContain(999);
    expect(idx.valuesByType("Beast", "HP")).toBe(b1);
  });

  it("a per-type read touches only that type's notes, not the vault", () => {
    const app = new FixtureApp();
    generateVault(app, N, ["Common"]);
    for (let i = 0; i < 3; i++) app.add(`r/${i}.md`, { Type: ["Rare"], Gold: i });
    const idx = makeIndex(app);
    idx.rowsByType("Common"); // warm the snapshot cache + buckets
    app.fmReads = 0;
    expect(idx.valuesByType("Rare", "Gold")).toHaveLength(3);
    // Bounded by the type's size (3 notes x a few key accesses), not by N.
    expect(app.fmReads).toBeLessThan(3 * 10);
  });

  it("a Type-list change moves buckets and dirties both sides' aggregates", () => {
    const app = new FixtureApp();
    generateVault(app, 40, ["Character", "Beast"]);
    const idx = makeIndex(app);
    const chars = idx.rowsByType("Character").length;
    const beasts = idx.rowsByType("Beast").length;
    const aChar = idx.valuesByType("Character", "Level");
    const aBeast = idx.valuesByType("Beast", "Level");

    // n/0.md is a Character; move it to Beast.
    app.setFm("n/0.md", { Type: ["Beast"], Level: 555 });
    idx.invalidateFile(app.files.get("n/0.md")!.file);

    expect(idx.rowsByType("Character")).toHaveLength(chars - 1);
    expect(idx.rowsByType("Beast")).toHaveLength(beasts + 1);
    const aChar2 = idx.valuesByType("Character", "Level");
    const aBeast2 = idx.valuesByType("Beast", "Level");
    expect(aChar2).not.toBe(aChar); // old type dirtied
    expect(aBeast2).not.toBe(aBeast); // new type dirtied
    expect(aBeast2).toContain(555);
    expect(aChar2).not.toContain(555);
  });

  it("deletes and renames keep buckets consistent", () => {
    const app = new FixtureApp();
    generateVault(app, 20, ["Character"]);
    const idx = makeIndex(app);
    expect(idx.rowsByType("Character")).toHaveLength(20);

    // Delete one note.
    idx.invalidatePath("n/0.md");
    app.files.delete("n/0.md");
    expect(idx.rowsByType("Character")).toHaveLength(19);

    // Rename another: the old path must leave the bucket, the new one join.
    const rec = app.files.get("n/1.md")!;
    app.files.delete("n/1.md");
    rec.file.path = "moved/1.md";
    app.files.set("moved/1.md", rec);
    idx.invalidateFile(rec.file, "n/1.md");
    const rows = idx.rowsByType("Character");
    expect(rows).toHaveLength(19);
    expect(rows.some((r) => r.file.path === "moved/1.md")).toBe(true);
    expect(rows.some((r) => r.file.path === "n/1.md")).toBe(false);
  });
});
