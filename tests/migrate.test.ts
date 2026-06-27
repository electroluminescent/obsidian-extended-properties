import { describe, it, expect } from "vitest";
import { defaultSettings, runSchemaMigrations, CURRENT_SCHEMA, type Migration } from "../src/core/settings";

describe("runSchemaMigrations (D3)", () => {
  it("stamps the current schema on a fresh, unversioned settings object", () => {
    const s = defaultSettings();
    expect(s.schemaVersion).toBeUndefined();
    const r = runSchemaMigrations(s);
    expect(s.schemaVersion).toBe(CURRENT_SCHEMA);
    expect(r.from).toBe(0);
    expect(r.to).toBe(CURRENT_SCHEMA);
    expect(r.changed).toBe(true);
  });

  it("is a no-op when already at the current schema", () => {
    const s = defaultSettings();
    s.schemaVersion = CURRENT_SCHEMA;
    const r = runSchemaMigrations(s);
    expect(r.changed).toBe(false);
    expect(r.ran).toEqual([]);
  });

  it("de-duplicates types case-insensitively (step 1)", () => {
    const s = defaultSettings();
    s.types = ["Hero", "hero", "Villain", "VILLAIN"];
    runSchemaMigrations(s);
    expect(s.types).toEqual(["Hero", "Villain"]);
  });

  it("prunes table layouts for types that no longer exist (step 1)", () => {
    const s = defaultSettings();
    s.types = ["Hero"];
    s.tableLayouts = { hero: { columns: ["HP"] }, ghost: { columns: ["X"] } };
    runSchemaMigrations(s);
    expect(Object.keys(s.tableLayouts!)).toEqual(["hero"]);
  });

  it("skips a step the stored version has already passed", () => {
    const s = defaultSettings();
    s.schemaVersion = 1;
    s.types = ["Hero", "hero"]; // dups survive: step 1 (to=1) is skipped
    const r = runSchemaMigrations(s);
    expect(s.types).toEqual(["Hero", "hero"]);
    expect(r.ran).toEqual([]);
  });

  it("runs only steps newer than the stored version, in ascending order", () => {
    const order: number[] = [];
    const table: Migration[] = [
      { to: 3, name: "c", run: () => (order.push(3), true) },
      { to: 1, name: "a", run: () => (order.push(1), false) },
      { to: 2, name: "b", run: () => (order.push(2), true) },
    ];
    const s = defaultSettings();
    s.schemaVersion = 1;
    const r = runSchemaMigrations(s, table);
    expect(order).toEqual([2, 3]); // step "a" (to=1) is skipped
    expect(r.ran).toEqual(["b", "c"]);
  });

  it("is idempotent across repeated runs", () => {
    const s = defaultSettings();
    s.types = ["A", "a"];
    runSchemaMigrations(s);
    const second = runSchemaMigrations(s);
    expect(second.changed).toBe(false);
    expect(s.types).toEqual(["A"]);
  });
});
