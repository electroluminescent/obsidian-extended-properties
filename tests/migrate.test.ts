import { describe, it, expect } from "vitest";
import { defaultSettings, runSchemaMigrations, CURRENT_SCHEMA, type Migration } from "../src/core/settings";
import { setSharedDataType } from "../src/core/layout-ops";
import type { Layout } from "../src/core/model";

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
    s.schemaVersion = CURRENT_SCHEMA;
    s.types = ["Hero", "hero"]; // dups survive: step 1 (to=1) is skipped
    const r = runSchemaMigrations(s);
    expect(s.types).toEqual(["Hero", "hero"]);
    expect(r.ran).toEqual([]);
  });

  it("unifies per-layout data types into the shared propTypes map (step 2)", () => {
    const lay = (dt?: string): Layout => ({
      version: 4,
      sections: [{ id: "s", title: "S", columns: 1, entries: [{ id: "e", kind: "prop", key: "Level", dataType: dt }] }],
    });
    const s = defaultSettings();
    s.types = ["Character", "Beast"];
    s.layouts = { character: lay("number"), beast: lay("text") };
    runSchemaMigrations(s);
    // First explicit type wins and is re-stamped everywhere.
    expect(s.propTypes).toEqual({ level: "number" });
    expect(s.layouts.beast.sections[0].entries[0].dataType).toBe("number");
    // Entries without an explicit type keep auto-deriving (stay unset).
    const s2 = defaultSettings();
    s2.types = ["Character"];
    s2.layouts = { character: lay(undefined) };
    runSchemaMigrations(s2);
    expect(s2.layouts.character.sections[0].entries[0].dataType).toBeUndefined();
  });

  it("setSharedDataType records the shared type and re-stamps every layout and inline entry", () => {
    const lay = (dt?: string): Layout => ({
      version: 4,
      sections: [{ id: "s", title: "S", columns: 1, entries: [{ id: "e", kind: "prop", key: "HP", dataType: dt }] }],
    });
    const s = defaultSettings();
    s.layouts = { character: lay("text"), beast: lay(undefined) };
    s.inlineEntries = { hp: { id: "i", kind: "prop", key: "HP", dataType: "text" } };
    setSharedDataType(s, "HP", "number");
    expect(s.propTypes).toEqual({ hp: "number" });
    expect(s.layouts.character.sections[0].entries[0].dataType).toBe("number");
    expect(s.layouts.beast.sections[0].entries[0].dataType).toBe("number");
    expect(s.inlineEntries.hp.dataType).toBe("number");
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
