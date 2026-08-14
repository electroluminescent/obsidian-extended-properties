import { describe, it, expect } from "vitest";
import { restoreFromSnapshot, shownNumber } from "../src/utils/misc";

describe("restoreFromSnapshot (hardening)", () => {
  it("replaces the target's keys with the snapshot's", () => {
    const target: Record<string, unknown> = { a: 1, b: 2 };
    restoreFromSnapshot(target, JSON.stringify({ b: 9, c: 3 }));
    expect(target).toEqual({ b: 9, c: 3 });
  });

  it("leaves the target unchanged on a corrupt snapshot (does not throw)", () => {
    const target: Record<string, unknown> = { a: 1 };
    expect(() => restoreFromSnapshot(target, "{ not valid json ]")).not.toThrow();
    expect(target).toEqual({ a: 1 });
  });

  it("ignores a non-object snapshot", () => {
    const target: Record<string, unknown> = { a: 1 };
    restoreFromSnapshot(target, "42");
    expect(target).toEqual({ a: 1 });
    restoreFromSnapshot(target, "null");
    expect(target).toEqual({ a: 1 });
  });
});

describe("the number a value cell is showing", () => {
  it("reads the number a slider has put there, unit and all", () => {
    expect(shownNumber("12")).toBe(12);
    expect(shownNumber("12kg")).toBe(12);
    expect(shownNumber(" 40 % ")).toBe(40);
    expect(shownNumber("-3.5")).toBe(-3.5);
    expect(shownNumber("1,250 gp")).toBe(1250);
  });

  it("refuses anything with a second number in it, and anything with none", () => {
    expect(shownNumber("3/4")).toBeUndefined();
    expect(shownNumber("2 of 5")).toBeUndefined();
    expect(shownNumber("")).toBeUndefined();
    expect(shownNumber("poisoned")).toBeUndefined();
  });
});
