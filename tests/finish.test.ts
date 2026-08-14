/**
 * Which finish a value wears: who a rule speaks for, and how a set is handed
 * round so the same value always wears the same one.
 */

import { describe, expect, it } from "vitest";
import { pickFinish, stableHash } from "../src/utils/finish";
import type { FinishRule } from "../src/core/model";

const rule = (r: Partial<FinishRule>): FinishRule => ({ when: "all", finish: "gloss", ...r });

describe("who a rule speaks for", () => {
  it("speaks for everything, when it says so", () => {
    expect(pickFinish([rule({})], 4)?.finish).toBe("gloss");
    expect(pickFinish([rule({})], "anything")?.finish).toBe("gloss");
  });

  it("speaks for the values it names, whatever their case", () => {
    const rs = [rule({ when: "values", values: ["Fire", "Ice"], finish: "foil" })];
    expect(pickFinish(rs, "fire")?.finish).toBe("foil");
    expect(pickFinish(rs, "Ice")?.finish).toBe("foil");
    expect(pickFinish(rs, "Earth")).toBeUndefined();
  });

  it("speaks for a band of numbers, whichever way round it is written", () => {
    const rs = [rule({ when: "range", from: 10, to: 20, finish: "chrome" })];
    expect(pickFinish(rs, 15)?.finish).toBe("chrome");
    expect(pickFinish(rs, 10)?.finish).toBe("chrome");
    expect(pickFinish(rs, 21)).toBeUndefined();
    expect(pickFinish([rule({ when: "range", from: 20, to: 10, finish: "chrome" })], 15)?.finish).toBe("chrome");
  });

  it("reads a number written as text", () => {
    expect(pickFinish([rule({ when: "range", from: 0, to: 5, finish: "wave" })], "3")?.finish).toBe("wave");
  });

  it("lets the first rule that speaks win", () => {
    const rs = [
      rule({ when: "values", values: ["Fire"], finish: "cosmic" }),
      rule({ when: "all", finish: "matte" }),
    ];
    expect(pickFinish(rs, "Fire")?.finish).toBe("cosmic");
    expect(pickFinish(rs, "Water")?.finish).toBe("matte");
  });

  it("carries a colour of its own where the rule names one", () => {
    expect(pickFinish([rule({ color: "#123456" })], 1)?.color).toBe("#123456");
  });
});

describe("the withdrawn one-each rule", () => {
  it("gives nothing at all: a finish is something somebody chose", () => {
    const rs = [rule({ when: "unique", finish: "gloss", set: ["gloss", "foil", "chrome"] })];
    expect(pickFinish(rs, "Athletics")).toBeUndefined();
  });

  it("still hashes the same way, for anything else that wants it", () => {
    expect(stableHash("Athletics")).toBe(stableHash("Athletics"));
  });
});

describe("nothing to say", () => {
  it("gives nothing without rules, or without a finish in them", () => {
    expect(pickFinish(undefined, 1)).toBeUndefined();
    expect(pickFinish([], 1)).toBeUndefined();
    expect(pickFinish([{ when: "all", finish: "" }], 1)).toBeUndefined();
  });
});
