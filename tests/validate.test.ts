import { describe, it, expect } from "vitest";
import { validate, clampToConstraints, shouldClamp, hasConstraints } from "../src/core/validate";

describe("validate — required", () => {
  it("flags empty when required", () => {
    expect(validate("", { required: true }, "text").ok).toBe(false);
    expect(validate(undefined, { required: true }, "number").ok).toBe(false);
    expect(validate([], { required: true }, "list").ok).toBe(false);
    expect(validate("x", { required: true }, "text").ok).toBe(true);
  });
  it("allows empty when not required", () => {
    expect(validate("", {}, "text").ok).toBe(true);
    expect(validate(undefined, undefined, "number").ok).toBe(true);
  });
});

describe("validate — numeric range", () => {
  const c = { min: 1, max: 20 };
  it("checks bounds (and accepts string numbers)", () => {
    expect(validate(0, c, "number")).toEqual({ ok: false, code: "min", bound: 1 });
    expect(validate(21, c, "number")).toEqual({ ok: false, code: "max", bound: 20 });
    expect(validate(10, c, "number").ok).toBe(true);
    expect(validate("15", c, "number").ok).toBe(true);
  });
  it("ignores non-numeric raw", () => {
    expect(validate("abc", c, "number").ok).toBe(true);
  });
});

describe("validate — text pattern & allowed", () => {
  it("matches the whole string against the pattern", () => {
    expect(validate("AB12", { pattern: "[A-Z]{2}\\d{2}" }, "text").ok).toBe(true);
    expect(validate("ab12", { pattern: "[A-Z]{2}\\d{2}" }, "text")).toEqual({ ok: false, code: "pattern" });
  });
  it("checks allowed values case-insensitively", () => {
    const c = { allowed: ["Fire", "Ice"] };
    expect(validate("ice", c, "text").ok).toBe(true);
    expect(validate("Wind", c, "text")).toEqual({ ok: false, code: "allowed" });
  });
  it("validates each list item", () => {
    const c = { allowed: ["a", "b"] };
    expect(validate(["a", "b"], c, "list").ok).toBe(true);
    expect(validate(["a", "z"], c, "list")).toEqual({ ok: false, code: "allowed" });
  });
  it("a broken regex never fails validation", () => {
    expect(validate("anything", { pattern: "(" }, "text").ok).toBe(true);
  });
});

describe("clamp helpers", () => {
  it("clampToConstraints clamps to bounds", () => {
    expect(clampToConstraints(25, { min: 1, max: 20 })).toBe(20);
    expect(clampToConstraints(-5, { min: 1, max: 20 })).toBe(1);
    expect(clampToConstraints(10, { min: 1, max: 20 })).toBe(10);
  });
  it("shouldClamp needs clamp + at least one bound", () => {
    expect(shouldClamp({ clamp: true, max: 5 })).toBe(true);
    expect(shouldClamp({ clamp: true })).toBe(false);
    expect(shouldClamp({ max: 5 })).toBe(false);
  });
  it("hasConstraints detects active constraints", () => {
    expect(hasConstraints(undefined)).toBe(false);
    expect(hasConstraints({})).toBe(false);
    expect(hasConstraints({ required: true })).toBe(true);
    expect(hasConstraints({ min: 0 })).toBe(true);
    expect(hasConstraints({ allowed: [] })).toBe(false);
    expect(hasConstraints({ allowed: ["x"] })).toBe(true);
  });
});
