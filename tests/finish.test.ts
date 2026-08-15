/**
 * Which finish a value wears: who a rule speaks for, and how a set is handed
 * round so the same value always wears the same one.
 */

import { describe, expect, it } from "vitest";
import { finishesFor } from "../src/ui/render/format";
import { pickFinish, stableHash } from "../src/utils/finish";
import type { FinishRule } from "../src/core/model";

const rule = (r: Partial<FinishRule>): FinishRule => ({ when: "all", finish: "gloss", ...r });

describe("who a rule speaks for", () => {
  it("speaks for everything, when it says so", () => {
    expect(pickFinish([rule({})], 4)?.finish).toBe("gloss");
    expect(pickFinish([rule({})], "anything")?.finish).toBe("gloss");
  });

  it("speaks for the values it names, whatever their case", () => {
    const rs = [rule({ when: "values", values: ["Fire", "Ice"], finish: "mirror" })];
    expect(pickFinish(rs, "fire")?.finish).toBe("mirror");
    expect(pickFinish(rs, "Ice")?.finish).toBe("mirror");
    expect(pickFinish(rs, "Earth")).toBeUndefined();
  });

  it("speaks for a band of numbers, whichever way round it is written", () => {
    const rs = [rule({ when: "range", from: 10, to: 20, finish: "crackle" })];
    expect(pickFinish(rs, 15)?.finish).toBe("crackle");
    expect(pickFinish(rs, 10)?.finish).toBe("crackle");
    expect(pickFinish(rs, 21)).toBeUndefined();
    expect(pickFinish([rule({ when: "range", from: 20, to: 10, finish: "crackle" })], 15)?.finish).toBe("crackle");
  });

  it("reads a number written as text", () => {
    expect(pickFinish([rule({ when: "range", from: 0, to: 5, finish: "wave" })], "3")?.finish).toBe("wave");
  });

  it("lets the first rule that speaks win", () => {
    const rs = [
      rule({ when: "values", values: ["Fire"], finish: "glitter" }),
      rule({ when: "all", finish: "matte" }),
    ];
    expect(pickFinish(rs, "Fire")?.finish).toBe("glitter");
    expect(pickFinish(rs, "Water")?.finish).toBe("matte");
  });

  it("carries a colour of its own where the rule names one", () => {
    expect(pickFinish([rule({ color: "#123456" })], 1)?.color).toBe("#123456");
  });
});

describe("the withdrawn one-each rule", () => {
  it("gives nothing at all: a finish is something somebody chose", () => {
    const rs = [rule({ when: "unique", finish: "gloss", set: ["gloss", "mirror", "crackle"] })];
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

describe("where a finish comes from", () => {
  const rules = (finish: string): FinishRule[] => [{ when: "all", finish }];

  it("takes the palette's when the property says nothing", () => {
    const from = finishesFor(
      { palette: "p" },
      { id: "p", name: "P", mode: "bands", finishes: rules("mirror") }
    );
    expect(from?.[0].finish).toBe("mirror");
  });

  it("lets the property have its own instead", () => {
    expect(
      finishesFor(
        { palette: "p", finishes: rules("glitter") },
        { id: "p", name: "P", mode: "bands", finishes: rules("mirror") }
      )?.[0].finish
    ).toBe("glitter");
  });

  it("gives nothing where neither says anything", () => {
    expect(finishesFor({ palette: "p" }, { id: "p", name: "P", mode: "bands" })).toBeUndefined();
    expect(finishesFor(undefined, undefined)).toBeUndefined();
  });
});
