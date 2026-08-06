/**
 * Moving a link property to the text type: the data type is shared per key, so
 * the move has to reach every entry showing that key - and carry the settings
 * that make it behave the same.
 */

import { describe, expect, it } from "vitest";
import { absorbLinkEntries, convertLinkToText } from "../src/core/layout-ops";
import { freshSection } from "../src/core/transfer";
import type { EPSettings, Entry, Section } from "../src/core/model";

function prop(key: string, extra: Partial<Entry> = {}): Entry {
  return { id: key + "-" + Math.random().toString(36).slice(2), kind: "prop", key, dataType: "link", ...extra };
}

/** Two sheets showing the same property, plus one inline entry. */
function vault(): EPSettings {
  return {
    layouts: {
      character: { sections: [{ id: "s1", title: "A", entries: [prop("Patron"), prop("Level")] }] },
      place: { sections: [{ id: "s2", title: "B", entries: [prop("patron")] }] },
    },
    inlineEntries: { patron: prop("Patron") },
  } as unknown as EPSettings;
}

/** Every entry in `s` for `key`, wherever it lives. */
function entriesFor(s: EPSettings, key: string): Entry[] {
  const out: Entry[] = [];
  for (const lk of Object.keys(s.layouts))
    for (const sec of s.layouts[lk].sections)
      for (const e of sec.entries) if ((e.key ?? "").toLowerCase() === key) out.push(e);
  for (const k of Object.keys(s.inlineEntries ?? {})) {
    const e = s.inlineEntries?.[k];
    if (e && (e.key ?? "").toLowerCase() === key) out.push(e);
  }
  return out;
}

describe("converting a link property", () => {
  it("moves every entry for the key, whatever its capitalisation", () => {
    const s = vault();
    expect(convertLinkToText(s, "Patron", { folder: "10.People" })).toBe(3);
    for (const e of entriesFor(s, "patron")) {
      expect(e.dataType).toBe("text");
      expect(e.choices).toEqual({ folder: "10.People", linksToNotes: true });
    }
  });

  it("records the type as shared, so a new entry for the key follows", () => {
    const s = vault();
    convertLinkToText(s, "Patron", undefined);
    expect(s.propTypes?.patron).toBe("text");
  });

  it("leaves other properties alone", () => {
    const s = vault();
    convertLinkToText(s, "Patron", { folder: "10.People" });
    const other = s.layouts.character.sections[0].entries[1];
    expect(other.dataType).toBe("link"); // "Level" was never a link, but it is not ours to touch
    expect(other.choices).toBeUndefined();
  });

  it("does not overwrite what an entry had set for itself", () => {
    const s = vault();
    s.layouts.place.sections[0].entries[0].choices = { folder: "20.Places", strict: true };
    convertLinkToText(s, "Patron", { folder: "10.People" });
    expect(s.layouts.place.sections[0].entries[0].choices).toEqual({
      folder: "20.Places",
      strict: true,
      linksToNotes: true,
    });
  });

  it("is safe to run twice", () => {
    const s = vault();
    convertLinkToText(s, "Patron", { folder: "10.People" });
    const before = JSON.stringify(s);
    convertLinkToText(s, "Patron", { folder: "10.People" });
    expect(JSON.stringify(s)).toBe(before);
  });

  it("does nothing without a key", () => {
    const s = vault();
    expect(convertLinkToText(s, "  ", undefined)).toBe(0);
  });
});

describe("entries that arrive after the migration", () => {
  const section = (): Section =>
    ({
      id: "s",
      title: "Imported",
      columns: 1,
      entries: [
        { id: "a", kind: "prop", key: "Patron", dataType: "link", choices: { folder: "10.People" } },
        { id: "b", kind: "prop", key: "Notes", dataType: "text" },
      ],
    }) as unknown as Section;

  it("moves link entries in a section handed to it", () => {
    const s = section();
    expect(absorbLinkEntries([s])).toBe(1);
    expect(s.entries[0].dataType).toBe("text");
    expect(s.entries[0].choices).toEqual({ folder: "10.People", linksToNotes: true });
    expect(s.entries[1].choices).toBeUndefined();
  });

  it("moves them as a section is imported", () => {
    const imported = freshSection(section());
    expect(imported.entries[0].dataType).toBe("text");
    expect(imported.entries[0].choices?.linksToNotes).toBe(true);
    // Still a fresh copy: ids are new and the original is untouched.
    expect(imported.entries[0].id).not.toBe("a");
  });

  it("changes nothing when there is nothing to move", () => {
    const s = section();
    absorbLinkEntries([s]);
    expect(absorbLinkEntries([s])).toBe(0);
  });
});
