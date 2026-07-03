import { describe, it, expect } from "vitest";
import { parseRoll, serializeRoll, evalRoll } from "../src/utils/dice-expr";

/** A deterministic roll1 that yields `values` in order (throws when exhausted). */
function seq(values: number[]): (sides: number) => number {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error("RNG exhausted");
    return values[i++];
  };
}

describe("parse / serialize round-trip", () => {
  const cases = ["2d6 + 3", "2d6kh1 + 1d8 + DEX + 3", "4d6dl1", "10d6>=5", "1d10!", "2d20kl1", "1d6ro1"];
  it("re-parses its own canonical text", () => {
    for (const c of cases) {
      const ast = parseRoll(c);
      expect(ast, c).not.toBeNull();
      const s1 = serializeRoll(ast!);
      const s2 = serializeRoll(parseRoll(s1)!);
      expect(s2, c).toBe(s1);
    }
  });
  it("preserves property and cross-note references (incl. .s modifier)", () => {
    expect(serializeRoll(parseRoll("1d20 + INT.s")!)).toContain("INT.s");
    expect(serializeRoll(parseRoll("2d6 + [[Boss]].intelligence.s")!)).toContain("[[Boss]].intelligence.s");
  });
});

describe("evalRoll - deterministic", () => {
  it("flat modifier and references", () => {
    const r = evalRoll(parseRoll("2d6 + 3 + DEX")!, { roll1: seq([4, 4]), resolve: (n) => (n === "DEX" ? 2 : undefined) });
    expect(r.total).toBe(4 + 4 + 3 + 2);
    expect(r.groups[0].value).toBe(8);
  });
  it("keep-highest drops the lowest", () => {
    const r = evalRoll(parseRoll("4d6kh3")!, { roll1: seq([1, 2, 3, 4]) });
    expect(r.total).toBe(9); // kept 2+3+4
    expect(r.groups[0].value).toBe(9);
    expect(r.groups[0].dropped.filter(Boolean)).toHaveLength(1);
  });
  it("drop-lowest is equivalent to keep-highest(n-1)", () => {
    const a = evalRoll(parseRoll("4d6dl1")!, { roll1: seq([1, 2, 3, 4]) }).total;
    const b = evalRoll(parseRoll("4d6kh3")!, { roll1: seq([1, 2, 3, 4]) }).total;
    expect(a).toBe(b);
  });
  it("explodes on max", () => {
    const r = evalRoll(parseRoll("1d6!")!, { roll1: seq([6, 2]) });
    expect(r.total).toBe(8);
    expect(r.groups[0].faces).toEqual([6, 2]);
  });
  it("recursively rerolls at or below the threshold", () => {
    const r = evalRoll(parseRoll("1d6r1")!, { roll1: seq([1, 1, 4]) });
    expect(r.total).toBe(4);
  });
  it("counts successes", () => {
    const r = evalRoll(parseRoll("4d6>=5")!, { roll1: seq([5, 6, 4, 2]) });
    expect(r.groups[0].success).toBe(true);
    expect(r.groups[0].value).toBe(2);
    expect(r.total).toBe(2);
  });
  it("invariant: total === sum(parts) + sum(group values), signs included", () => {
    const r = evalRoll(parseRoll("2d6 + 1d8 - 2 + STR")!, {
      roll1: seq([3, 3, 5]),
      resolve: () => 4,
    });
    const partsSum = r.parts.reduce((a, p) => a + p.value, 0);
    const groupsSum = r.groups.reduce((a, g) => a + g.value, 0);
    // every term here is positive except the -2 (captured in parts), and no
    // dice term is negated, so the plain sum matches.
    expect(r.total).toBe(partsSum + groupsSum);
  });
});

describe("advantage >= normal in expectation", () => {
  it("2d20kh1 averages higher than 1d20 over many samples", () => {
    const rng = () => 1 + Math.floor(Math.random() * 20);
    const mean = (expr: string) => {
      let sum = 0;
      const N = 4000;
      for (let i = 0; i < N; i++) sum += evalRoll(parseRoll(expr)!, { roll1: rng }).total;
      return sum / N;
    };
    expect(mean("2d20kh1")).toBeGreaterThan(mean("1d20"));
  });
});
