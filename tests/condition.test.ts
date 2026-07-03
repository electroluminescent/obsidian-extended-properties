import { describe, it, expect } from "vitest";
import { parseExpr, evalCondition, evalExpr, type ExprEnv } from "../src/core/expr";

/** Build an env from case-insensitive numeric and string property maps. */
function env(nums: Record<string, number> = {}, strs: Record<string, string> = {}): ExprEnv {
  const lc = (o: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k.toLowerCase(), v]));
  const n = lc(nums) as Record<string, number>;
  const s = lc(strs) as Record<string, string>;
  return {
    resolve: (name) => n[name.toLowerCase()],
    resolveStr: (name) => s[name.toLowerCase()],
  };
}

function cond(expr: string, e: ExprEnv): boolean | undefined | null {
  const ast = parseExpr(expr);
  return ast ? evalCondition(ast, e) : null;
}

describe("evalCondition - numeric comparisons", () => {
  it("compares numbers", () => {
    expect(cond("Level >= 5", env({ Level: 5 }))).toBe(true);
    expect(cond("Level >= 5", env({ Level: 4 }))).toBe(false);
    expect(cond("HP < 10 && HP > 0", env({ HP: 3 }))).toBe(true);
    expect(cond("HP < 10 && HP > 0", env({ HP: 0 }))).toBe(false);
  });
});

describe("evalCondition - string equality", () => {
  it("matches case-insensitively and trims", () => {
    expect(cond('Class == "Wizard"', env({}, { Class: "Wizard" }))).toBe(true);
    expect(cond('Class == "wizard"', env({}, { Class: "Wizard" }))).toBe(true);
    expect(cond('Class == "Wizard"', env({}, { Class: " wizard " }))).toBe(true);
    expect(cond('Class == "Wizard"', env({}, { Class: "Rogue" }))).toBe(false);
    expect(cond('Class != "Wizard"', env({}, { Class: "Rogue" }))).toBe(true);
  });
});

describe("evalCondition - boolean logic & truthiness", () => {
  it("combines && || ! and treats non-empty strings as truthy", () => {
    const e = env({ Level: 6 }, { Class: "Wizard" });
    expect(cond('Class == "Wizard" && Level >= 5', e)).toBe(true);
    expect(cond('Class == "Rogue" || Level >= 5', e)).toBe(true);
    expect(cond('!(Class == "Wizard")', e)).toBe(false);
    expect(cond("Class", e)).toBe(true); // non-empty string is truthy
    expect(cond("Notes", env({}, { Notes: "" }))).toBe(false); // empty string is falsy
  });
});

describe("evalCondition - unresolved defaults to undefined", () => {
  it("returns undefined when a reference cannot be resolved", () => {
    expect(cond('Missing == "x"', env())).toBeUndefined();
    expect(cond("Missing >= 5", env())).toBeUndefined();
  });
});

describe("evalExpr stays numeric", () => {
  it("evaluates arithmetic and yields 1/0 for comparisons", () => {
    const ast = parseExpr("2 + 3 * 4")!;
    expect(evalExpr(ast, env())).toBe(14);
    expect(evalExpr(parseExpr('Class == "Wizard"')!, env({}, { Class: "Wizard" }))).toBe(1);
    // a bare string is not a number -> undefined in the numeric context
    expect(evalExpr(parseExpr('"hello"')!, env())).toBeUndefined();
  });
});
