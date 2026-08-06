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

  it("moves link properties into the text type (step 3)", () => {
    const s = defaultSettings();
    s.types = ["Character"];
    s.layouts = {
      character: {
        version: 4,
        sections: [
          {
            id: "s",
            title: "S",
            columns: 1,
            entries: [
              { id: "e1", kind: "prop", key: "Patron", dataType: "link", choices: { folder: "10.People" } },
              { id: "e2", kind: "prop", key: "Notes", dataType: "text" },
            ],
          },
        ],
      },
    };
    s.inlineEntries = { patron: { id: "i1", kind: "prop", key: "Patron", dataType: "link" } };
    runSchemaMigrations(s);
    const moved = s.layouts.character.sections[0].entries[0];
    expect(moved.dataType).toBe("text");
    // Step 4 follows on and stores the folder as a list.
    expect(moved.choices).toEqual({ folders: ["10.People"], linksToNotes: true });
    expect(s.propTypes?.patron).toBe("text");
    // The inline entry for the same key moves with it ...
    expect(s.inlineEntries?.patron.dataType).toBe("text");
    expect(s.inlineEntries?.patron.choices?.linksToNotes).toBe(true);
    // ... and a property that was never a link is left alone.
    expect(s.layouts.character.sections[0].entries[1].choices).toBeUndefined();
  });

  it("stores a single source folder as a list (step 4)", () => {
    const s = defaultSettings();
    s.types = ["Character"];
    s.layouts = {
      character: {
        version: 4,
        sections: [
          {
            id: "s",
            title: "S",
            columns: 1,
            entries: [
              { id: "e", kind: "prop", key: "Patron", choices: { linksToNotes: true, folder: "10.People" } },
            ],
          },
        ],
      },
    };
    runSchemaMigrations(s);
    expect(s.layouts.character.sections[0].entries[0].choices).toEqual({
      linksToNotes: true,
      folders: ["10.People"],
    });
  });

  it("finds link properties recorded only in the shared type map (step 3)", () => {
    const s = defaultSettings();
    s.types = ["Character"];
    s.layouts = {
      character: {
        version: 4,
        sections: [{ id: "s", title: "S", columns: 1, entries: [{ id: "e", kind: "prop", key: "Patron" }] }],
      },
    };
    s.propTypes = { patron: "link" };
    runSchemaMigrations(s);
    expect(s.propTypes.patron).toBe("text");
    expect(s.layouts.character.sections[0].entries[0].choices?.linksToNotes).toBe(true);
  });

  it("leaves a vault with no link properties untouched (step 3)", () => {
    const s = defaultSettings();
    s.types = ["Character"];
    s.layouts = {
      character: {
        version: 4,
        sections: [{ id: "s", title: "S", columns: 1, entries: [{ id: "e", kind: "prop", key: "Notes", dataType: "text" }] }],
      },
    };
    runSchemaMigrations(s);
    expect(s.layouts.character.sections[0].entries[0].choices).toBeUndefined();
    // Step 2 still records the shared type; step 3 has nothing to do.
    expect(s.propTypes).toEqual({ notes: "text" });
  });

  it("moves decimal properties into the number type (step 5)", () => {
    const s = defaultSettings();
    s.types = ["Character"];
    s.layouts = {
      character: {
        version: 4,
        sections: [
          {
            id: "s",
            title: "S",
            columns: 1,
            entries: [
              { id: "e1", kind: "prop", key: "Height", dataType: "decimal", min: 0, max: 8 },
              { id: "e2", kind: "prop", key: "Level", dataType: "number" },
            ],
          },
        ],
      },
    };
    runSchemaMigrations(s);
    const moved = s.layouts.character.sections[0].entries[0];
    expect(moved.dataType).toBe("number");
    expect(moved.fractions).toBe(true);
    // Its range is its own and is left alone; a whole-number property is not touched.
    expect(moved.min).toBe(0);
    expect(moved.max).toBe(8);
    expect(s.layouts.character.sections[0].entries[1].fractions).toBeUndefined();
    expect(s.propTypes?.height).toBe("number");
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
