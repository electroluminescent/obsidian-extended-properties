import { describe, it, expect } from "vitest";
import { parseNoteRef } from "../src/core/note-ref";

describe("parseNoteRef", () => {
  it("splits a wikilink and optional accessor", () => {
    expect(parseNoteRef("[[Other]]")).toEqual({ link: "Other", accessor: "" });
    expect(parseNoteRef("[[Other Note]].INT")).toEqual({ link: "Other Note", accessor: "INT" });
    expect(parseNoteRef("[[A]] . DEX")).toEqual({ link: "A", accessor: "DEX" });
    expect(parseNoteRef("[[A]].[hit points]")).toEqual({ link: "A", accessor: "[hit points]" });
    expect(parseNoteRef("[[Boss]].intelligence.s")).toEqual({ link: "Boss", accessor: "intelligence.s" });
  });
  it("returns null for non-references", () => {
    expect(parseNoteRef("INT")).toBeNull();
    expect(parseNoteRef("")).toBeNull();
    expect(parseNoteRef("[single]")).toBeNull();
  });
});
