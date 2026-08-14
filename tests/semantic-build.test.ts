/**
 * Building the wide table: reading a vector file, and giving every word the
 * colour of the anchors it sits nearest to.
 */

import { describe, expect, it } from "vitest";
import { buildTable, eachLine, readCache } from "../src/utils/semantic-build";

/** Two anchors at opposite ends of a two-dimensional space. */
const anchors = new Map([
  ["fire", "#ff0000"],
  ["ice", "#0000ff"],
]);

/** "word x y" per line - the shape every vector file has. */
const vectors = [
  "fire 1 0",
  "ice 0 1",
  "flame 0.95 0.05",
  "frost 0.05 0.95",
  "the 0.7 0.7",
  "1234 0.5 0.5",
].join("\n");

describe("reading the file", () => {
  it("walks the lines without minding how they end", () => {
    expect([...eachLine("a\nb\r\nc")]).toEqual(["a", "b", "c"]);
    expect([...eachLine("")]).toEqual([]);
    expect([...eachLine("one line")]).toEqual(["one line"]);
  });
});

describe("building the table", () => {
  const table = buildTable(vectors, anchors);

  it("keeps the anchors' own colours exactly", () => {
    expect(table.fire).toBe("#ff0000");
    expect(table.ice).toBe("#0000ff");
  });

  it("gives a word the colour of what it sits nearest", () => {
    // "flame" is almost "fire", so it should come out far more red than blue.
    const flame = table.flame;
    expect(flame).toBeDefined();
    const r = parseInt(flame.slice(1, 3), 16);
    const b = parseInt(flame.slice(5, 7), 16);
    expect(r).toBeGreaterThan(b);
    const frost = table.frost;
    expect(parseInt(frost.slice(5, 7), 16)).toBeGreaterThan(parseInt(frost.slice(1, 3), 16));
  });

  it("passes over what is not a word", () => {
    expect(table["1234"]).toBeUndefined();
  });

  it("keeps only as many words as it is asked for", () => {
    expect(Object.keys(buildTable(vectors, anchors, { limit: 2 })).length).toBeLessThanOrEqual(2);
  });

  it("gives nothing at all when the file holds none of the anchors", () => {
    expect(buildTable("alpha 1 0\nbeta 0 1", anchors)).toEqual({});
  });
});

describe("reading a table back", () => {
  it("takes our own shape, and a plain map somebody else made", () => {
    expect(readCache({ built: 12, words: { fire: "#ff0000" } })).toEqual({
      words: { fire: "#ff0000" },
      built: 12,
    });
    expect(readCache({ fire: "#ff0000" }).words).toEqual({ fire: "#ff0000" });
  });

  it("refuses anything else", () => {
    expect(readCache(null).words).toBeNull();
    expect(readCache([1, 2]).words).toBeNull();
    expect(readCache({ fire: 12 }).words).toBeNull();
  });
});
