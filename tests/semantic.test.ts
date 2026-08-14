/**
 * What a word means in colour: the words that ship, the stems that reach
 * them, the table that can be installed, and the colour invented for a word
 * nothing knows.
 */

import { afterEach, describe, expect, it } from "vitest";
import { hashColor, semanticColor, semanticTableSize, setSemanticTable, stem, wordHash } from "../src/utils/semantic";
import { colorForText, type Palette } from "../src/utils/palette";
import { anchors } from "../src/utils/semantic-anchors";

afterEach(() => setSemanticTable(null));

describe("the words that ship", () => {
  it("know a few hundred words, colours among them", () => {
    expect(anchors().size).toBeGreaterThan(200);
    expect(semanticColor("red")).toBeDefined();
    expect(semanticColor("poison")).toBeDefined();
    expect(semanticColor("gold")).toBeDefined();
  });

  it("do not care about case or space around a word", () => {
    expect(semanticColor("  FIRE ")).toBe(semanticColor("fire"));
  });

  it("give fire something warm and ice something cool", () => {
    // Not a claim about exact hues - only that they are not the same colour.
    expect(semanticColor("fire")).not.toBe(semanticColor("ice"));
  });

  it("say nothing about a word they do not hold", () => {
    expect(semanticColor("quixotic")).toBeUndefined();
  });
});

describe("reaching a word through its stem", () => {
  it("cuts plurals and endings back", () => {
    expect(stem("poisons")).toContain("poison");
    expect(stem("berries")).toContain("berry");
    expect(stem("burning")).toContain("burn");
    expect(stem("burned")).toContain("burn");
    expect(stem("calmly")).toContain("calm");
  });

  it("finds the word behind the ending", () => {
    expect(semanticColor("poisons")).toBe(semanticColor("poison"));
    expect(semanticColor("burning")).toBe(semanticColor("burn"));
  });

  it("takes a phrase from the first word in it that means anything", () => {
    expect(semanticColor("deep ocean trench")).toBe(semanticColor("ocean"));
  });
});

describe("the table that can be installed", () => {
  it("is empty until one is handed over", () => {
    expect(semanticTableSize()).toBe(0);
    setSemanticTable({ quixotic: "#123456" });
    expect(semanticTableSize()).toBe(1);
    expect(semanticColor("quixotic")).toBe("#123456");
  });

  it("never overrules a word that ships with the plugin", () => {
    const own = semanticColor("fire");
    setSemanticTable({ fire: "#000000" });
    expect(semanticColor("fire")).toBe(own);
  });
});

describe("a colour for a word nothing knows", () => {
  it("is only invented when asked for", () => {
    expect(semanticColor("zzzyx")).toBeUndefined();
    expect(semanticColor("zzzyx", { fallback: "hash" })).toBeDefined();
  });

  it("is the same every time, for the same word", () => {
    expect(hashColor("Athletics")).toBe(hashColor("athletics"));
    expect(wordHash("Athletics")).toBe(wordHash("athletics"));
    expect(hashColor("Athletics")).not.toBe(hashColor("Acrobatics"));
  });
});

describe("a palette that reads words", () => {
  const p = (fallback?: "hash"): Palette => ({ id: "s", name: "S", mode: "semantic", fallback });

  it("asks the tables, and takes its own words first", () => {
    expect(colorForText(p(), "fire")).toBe(semanticColor("fire"));
    const pinned: Palette = { ...p(), words: [{ word: "fire", color: "#010203" }] };
    expect(colorForText(pinned, "fire")).toBe("#010203");
  });

  it("invents one only where the palette says to", () => {
    expect(colorForText(p(), "zzzyx")).toBeUndefined();
    expect(colorForText(p("hash"), "zzzyx")).toBeDefined();
  });
});
