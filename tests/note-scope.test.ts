/**
 * Folder-scoped link suggestions: which notes a property will offer, and what
 * counts as the note a typed value names.
 */

import { describe, expect, it } from "vitest";
import { inScope, linkDisplay, linkNameOf, linkStored } from "../src/ui/components/suggest";

describe("in scope", () => {
  it("takes every note when no folder is named", () => {
    expect(inScope("10.Personaggi/Ada.md")).toBe(true);
    expect(inScope("Ada.md", {})).toBe(true);
    expect(inScope("Ada.md", { folders: [""] })).toBe(true);
  });

  it("takes the folder's own notes, and not a deeper one", () => {
    const scope = { folders: ["10.Personaggi"] };
    expect(inScope("10.Personaggi/Ada.md", scope)).toBe(true);
    expect(inScope("10.Personaggi/Minori/Bo.md", scope)).toBe(false);
    expect(inScope("20.Luoghi/Ada.md", scope)).toBe(false);
    expect(inScope("Ada.md", scope)).toBe(false);
  });

  it("takes what is below the folder when asked to", () => {
    const scope = { folders: ["10.Personaggi"], subfolders: true };
    expect(inScope("10.Personaggi/Minori/Bo.md", scope)).toBe(true);
    expect(inScope("10.Personaggi/Ada.md", scope)).toBe(true);
    expect(inScope("20.Luoghi/Bo.md", scope)).toBe(false);
  });

  it("takes a note in any of several folders", () => {
    const scope = { folders: ["10.Personaggi", "20.Luoghi"] };
    expect(inScope("10.Personaggi/Ada.md", scope)).toBe(true);
    expect(inScope("20.Luoghi/Ancona.md", scope)).toBe(true);
    expect(inScope("30.Oggetti/Spada.md", scope)).toBe(false);
  });

  it("is not fooled by a folder that merely starts the same", () => {
    expect(inScope("10.PersonaggiVecchi/Ada.md", { folders: ["10.Personaggi"] })).toBe(false);
    expect(inScope("10.PersonaggiVecchi/Ada.md", { folders: ["10.Personaggi"], subfolders: true })).toBe(false);
  });

  it("ignores stray slashes around the folder", () => {
    expect(inScope("10.Personaggi/Ada.md", { folders: ["/10.Personaggi/"] })).toBe(true);
  });
});

describe("the note a value names", () => {
  it("reads the target out of a wikilink, alias or heading and all", () => {
    expect(linkNameOf("[[Ada]]")).toBe("Ada");
    expect(linkNameOf("[[Ada|the smith]]")).toBe("Ada");
    expect(linkNameOf("[[Ada#Background]]")).toBe("Ada");
    expect(linkNameOf("[[ Ada ")).toBe("Ada"); // still being typed
  });

  it("takes a bare name as the name", () => {
    expect(linkNameOf("Ada")).toBe("Ada");
    expect(linkNameOf("")).toBe("");
  });
});

describe("what the field shows", () => {
  it("shows a plain link as its note name", () => {
    expect(linkDisplay("[[Ada]]")).toBe("Ada");
    expect(linkDisplay("  [[Ada]] ")).toBe("Ada");
  });

  it("leaves anything else as it is written", () => {
    expect(linkDisplay("Ada")).toBe("Ada");
    expect(linkDisplay("[[Ada|the smith]]")).toBe("[[Ada|the smith]]");
    expect(linkDisplay("see [[Ada]] and [[Bo]]")).toBe("see [[Ada]] and [[Bo]]");
    expect(linkDisplay("")).toBe("");
  });
});

describe("what the field stores", () => {
  it("links a name, whether or not its note exists yet", () => {
    expect(linkStored("Ada")).toBe("[[Ada]]");
    expect(linkStored("  Ada  ")).toBe("[[Ada]]");
    expect(linkStored("A note nobody has made")).toBe("[[A note nobody has made]]");
  });

  it("keeps a link a link on the way through", () => {
    // What the field shows for [[Ada]] is "Ada", and storing that must give
    // the link back rather than a bare word.
    expect(linkStored(linkDisplay("[[Ada]]"))).toBe("[[Ada]]");
  });

  it("leaves a value that already carries a link alone", () => {
    expect(linkStored("[[Ada|the smith]]")).toBe("[[Ada|the smith]]");
    expect(linkStored("[Ada](Ada.md)")).toBe("[Ada](Ada.md)");
    expect(linkStored("https://example.com/Ada")).toBe("https://example.com/Ada");
  });

  it("gives back nothing for an emptied field", () => {
    expect(linkStored("")).toBe("");
    expect(linkStored("   ")).toBe("");
  });
});
