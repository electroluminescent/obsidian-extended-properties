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

describe("cross-note aggregates & prop() (B2)", () => {
  const env = {
    resolve: () => undefined,
    fn: () => undefined,
    agg: (fn: string, type: string, key: string) =>
      type === "Party member" && key === "HP"
        ? { sum: 30, avg: 10, count: 3, min: 4, max: 16 }[fn]
        : undefined,
    lookup: (linkProp: string, key: string) => (linkProp === "Mount" && key === "Speed" ? 40 : undefined),
  };
  const run = (src: string) => evalExpr(parseExpr(src)!, env);

  it("parses string-literal arguments", () => {
    expect(parseExpr('sum("Party member", "HP")')).not.toBeNull();
  });
  it("dispatches sum/avg/count to env.agg", () => {
    expect(run('sum("Party member", "HP")')).toBe(30);
    expect(run('avg("Party member", "HP")')).toBe(10);
    expect(run('count("Party member", "HP")')).toBe(3);
  });
  it("keeps numeric min/max but routes the string form to the aggregate", () => {
    expect(run("min(3, 1, 2)")).toBe(1); // numeric
    expect(run('min("Party member", "HP")')).toBe(4); // aggregate
    expect(run('max("Party member", "HP")')).toBe(16);
  });
  it("prop(linkProp, key) resolves through env.lookup", () => {
    expect(run('prop("Mount", "Speed")')).toBe(40);
    expect(run('prop("Mount", "HP")')).toBeUndefined();
  });
  it("aggregates are undefined when no vault env is provided", () => {
    expect(evalExpr(parseExpr('sum("Party member", "HP")')!, { resolve: () => undefined })).toBeUndefined();
  });
  it("a bare string is not a number", () => {
    expect(evalExpr(parseExpr('"hi" + 1')!, { resolve: () => undefined })).toBeUndefined();
  });
});

describe("serialize round-trip", () => {
  it("re-parses to the same canonical text", () => {
    for (const src of ["floor((STR + DEX) / 2)", "max(PB, 2) + 1", "INT.s + 3", 'sum("Party member", "HP")']) {
      const s1 = serializeExpr(parseExpr(src)!);
      const s2 = serializeExpr(parseExpr(s1)!);
      expect(s2, src).toBe(s1);
    }
  });
});
