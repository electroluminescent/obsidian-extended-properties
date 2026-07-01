import { describe, it, expect } from "vitest";
import { compileFormula, invertFormula } from "../src/utils/formula";

describe("compileFormula", () => {
  it("compiles a valid single-variable expression", () => {
    const f = compileFormula("x * 2 + 1");
    expect(f).not.toBeNull();
    expect(f!(0)).toBe(1);
    expect(f!(5)).toBe(11);
  });

  it("rejects syntactically invalid expressions", () => {
    expect(compileFormula("x +")).toBeNull();
    expect(compileFormula("(x")).toBeNull();
    expect(compileFormula("")).toBeNull();
  });

  it("rejects expressions that evaluate non-finite at x = 1", () => {
    expect(compileFormula("1 / (x - 1)")).toBeNull();
  });

  it("ignores case in the variable name", () => {
    const f = compileFormula("X * 3");
    expect(f).not.toBeNull();
    expect(f!(4)).toBe(12);
  });

  it("supports the shared function library", () => {
    const f = compileFormula("floor(x / 2)");
    expect(f).not.toBeNull();
    expect(f!(7)).toBe(3);
  });
});

describe("invertFormula", () => {
  it("finds x for a monotonic function", () => {
    const f = compileFormula("x * 2")!;
    const x = invertFormula(f, 10, 0, 20);
    expect(x).toBeCloseTo(5, 0);
  });

  it("clamps to the search range when the target is unreachable", () => {
    const f = compileFormula("x * x")!;
    const x = invertFormula(f, 1000, 0, 10);
    expect(x).toBeCloseTo(10, 0);
  });

  it("handles a flat function without throwing", () => {
    const f = compileFormula("5")!;
    const x = invertFormula(f, 5, 0, 10);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(10);
  });
});
