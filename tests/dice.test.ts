import { describe, it, expect } from "vitest";
import {
  parseDice, parseDiceOrDefault, formatDice, isDefaultDice, isMaxPool, isMinPool, rollPool, DEFAULT_DICE,
} from "../src/utils/dice";

describe("parseDice", () => {
  it("parses plain and explicit counts", () => {
    expect(parseDice("d20")).toEqual({ count: 1, sides: 20 });
    expect(parseDice("2d6")).toEqual({ count: 2, sides: 6 });
    expect(parseDice(" 3 D 8 ")).toEqual({ count: 3, sides: 8 });
  });
  it("rejects junk and out-of-bounds", () => {
    for (const bad of ["", "abc", "d1", "d0", "0d6", "101d6", "2d", "2x6", null, undefined]) {
      expect(parseDice(bad as string)).toBeNull();
    }
  });
  it("falls back to a d20", () => {
    expect(parseDiceOrDefault("nonsense")).toEqual(DEFAULT_DICE);
    expect(parseDiceOrDefault("2d10")).toEqual({ count: 2, sides: 10 });
  });
});

describe("formatDice / isDefaultDice", () => {
  it("drops the leading 1", () => {
    expect(formatDice({ count: 1, sides: 20 })).toBe("d20");
    expect(formatDice({ count: 2, sides: 6 })).toBe("2d6");
  });
  it("round-trips through parseDice", () => {
    for (const spec of [{ count: 1, sides: 20 }, { count: 4, sides: 6 }, { count: 10, sides: 100 }]) {
      expect(parseDice(formatDice(spec))).toEqual(spec);
    }
  });
  it("recognises the implicit default", () => {
    expect(isDefaultDice({ count: 1, sides: 20 })).toBe(true);
    expect(isDefaultDice({ count: 2, sides: 20 })).toBe(false);
  });
});

describe("pool tone helpers", () => {
  it("detects all-max and all-min pools", () => {
    expect(isMaxPool({ count: 2, sides: 6 }, { faces: [6, 6], total: 12 })).toBe(true);
    expect(isMaxPool({ count: 2, sides: 6 }, { faces: [6, 5], total: 11 })).toBe(false);
    expect(isMinPool({ faces: [1, 1], total: 2 })).toBe(true);
    expect(isMinPool({ faces: [1, 2], total: 3 })).toBe(false);
  });
});

describe("rollPool", () => {
  it("stays within bounds and sums correctly (1000 samples)", () => {
    for (let i = 0; i < 1000; i++) {
      const pool = rollPool({ count: 3, sides: 8 });
      expect(pool.faces).toHaveLength(3);
      for (const f of pool.faces) expect(f).toBeGreaterThanOrEqual(1), expect(f).toBeLessThanOrEqual(8);
      expect(pool.total).toBe(pool.faces.reduce((a, b) => a + b, 0));
    }
  });
});
