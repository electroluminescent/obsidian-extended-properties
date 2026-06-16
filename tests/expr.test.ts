import { describe, it, expect } from "vitest";
import { parseExpr, evalExpr, serializeExpr } from "../src/core/expr";

const ev = (src: string, resolve: (n: string) => number | undefined = () => undefined): number | undefined =>
  evalExpr(parseExpr(src)!, { resolve, fn: () => undefined });

describe("arithmetic & precedence", () => {
  it("respects operator precedence and parentheses", () => {
    expect(ev("1 + 2 * 3")).toBe(7);
    expect(ev("(1 + 2) * 3")).toBe(9);
    expect(ev("2 ^ 3")).toBe(8);
    expect(ev("7 % 3")).toBe(1);
    expect(ev("-3 + 5")).toBe(2);
  });
});

describe("function library", () => {
  it("rounding, min/max/clamp, abs, if", () => {
    expect(ev("floor(7/2)")).toBe(3);
    expect(ev("ceil(7/2)")).toBe(4);
    expect(ev("round(2.5)")).toBe(3);
    expect(ev("max(1, 5, 3)")).toBe(5);
    expect(ev("min(1, 5, 3)")).toBe(1);
    expect(ev("clamp(10, 0, 5)")).toBe(5);
    expect(ev("abs(0 - 4)")).toBe(4);
    expect(ev("if(1, 2, 3)")).toBe(2);
    expect(ev("if(0, 2, 3)")).toBe(3);
  });
  it("date helpers", () => {
    expect(ev("days(10, 13)")).toBe(3);
    const today = ev("today()");
    expect(typeof today).toBe("number");
    expect(today!).toBeGreaterThan(19000); // ~2022+ in day-numbers
  });
});

describe("comparisons & booleans", () => {
  it("yield 1/0", () => {
    expect(ev("3 >= 2")).toBe(1);
    expect(ev("2 > 3")).toBe(0);
    expect(ev("2 == 2")).toBe(1);
    expect(ev("2 != 2")).toBe(0);
    expect(ev("1 && 0")).toBe(0);
    expect(ev("1 || 0")).toBe(1);
  });
});

describe("references", () => {
  it("resolves names, short forms and dotted .s modifiers", () => {
    expect(ev("STR + 1", (n) => (n === "STR" ? 5 : undefined))).toBe(6);
    expect(ev("INT.s * 2", (n) => (n === "INT.s" ? 3 : undefined))).toBe(6);
    expect(ev("floor((STR + DEX) / 2)", (n) => ({ STR: 14, DEX: 12 } as Record<string, number>)[n])).toBe(13);
  });
  it("degrades unresolved references to undefined (never throws)", () => {
    expect(ev("missing + 1")).toBeUndefined();
    expect(ev("1 / 0")).toBeUndefined(); // non-finite → undefined
  });
});

describe("serialize round-trip", () => {
  it("re-parses to the same canonical text", () => {
    for (const src of ["floor((STR + DEX) / 2)", "max(PB, 2) + 1", "INT.s + 3"]) {
      const s1 = serializeExpr(parseExpr(src)!);
      const s2 = serializeExpr(parseExpr(s1)!);
      expect(s2, src).toBe(s1);
    }
  });
});
