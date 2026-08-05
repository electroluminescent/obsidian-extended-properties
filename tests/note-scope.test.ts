/**
 * Folder-scoped link suggestions: which notes a property will offer, and what
 * counts as the note a typed value names.
 */

import { describe, expect, it } from "vitest";
import { inScope, linkNameOf } from "../src/ui/components/suggest";

describe("in scope", () => {
  it("takes every note when no folder is named", () => {
    expect(inScope("10.Personaggi/Ada.md")).toBe(true);
    expect(inScope("Ada.md", {})).toBe(true);
    expect(inScope("Ada.md", { folder: "" })).toBe(true);
  });

  it("takes the folder's own notes, and not a deeper one", () => {
    const scope = { folder: "10.Personaggi" };
    expect(inScope("10.Personaggi/Ada.md", scope)).toBe(true);
    expect(inScope("10.Personaggi/Minori/Bo.md", scope)).toBe(false);
    expect(inScope("20.Luoghi/Ada.md", scope)).toBe(false);
    expect(inScope("Ada.md", scope)).toBe(false);
  });

  it("takes what is below the folder when asked to", () => {
    const scope = { folder: "10.Personaggi", subfolders: true };
    expect(inScope("10.Personaggi/Minori/Bo.md", scope)).toBe(true);
    expect(inScope("10.Personaggi/Ada.md", scope)).toBe(true);
    expect(inScope("20.Luoghi/Bo.md", scope)).toBe(false);
  });

  it("is not fooled by a folder that merely starts the same", () => {
    expect(inScope("10.PersonaggiVecchi/Ada.md", { folder: "10.Personaggi" })).toBe(false);
    expect(inScope("10.PersonaggiVecchi/Ada.md", { folder: "10.Personaggi", subfolders: true })).toBe(false);
  });

  it("ignores stray slashes around the folder", () => {
    expect(inScope("10.Personaggi/Ada.md", { folder: "/10.Personaggi/" })).toBe(true);
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
