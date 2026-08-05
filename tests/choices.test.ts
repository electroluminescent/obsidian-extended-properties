/**
 * Where a text field's offered values come from, and what it will accept -
 * the half of "restrict the suggestions" that owes nothing to Obsidian.
 */

import { describe, expect, it } from "vitest";
import { optionsFor, valueAllowed } from "../src/core/choices";

const POOL = ["Aardvark", "Badger", "Civet"];
const ALLOWED = ["Draft", "Active", "Completed"];

describe("what is offered", () => {
  it("offers what the vault holds by default", () => {
    expect(optionsFor(undefined, ALLOWED, POOL)).toEqual(POOL);
    expect(optionsFor({}, ALLOWED, POOL)).toEqual(POOL);
    expect(optionsFor({ from: "vault" }, ALLOWED, POOL)).toEqual(POOL);
  });

  it("offers the allowed values when set to, in the order written", () => {
    expect(optionsFor({ from: "allowed" }, ALLOWED, POOL)).toEqual(ALLOWED);
  });

  it("offers nothing when set to allowed values and none are listed", () => {
    expect(optionsFor({ from: "allowed" }, undefined, POOL)).toEqual([]);
  });
});

describe("what is accepted", () => {
  it("takes anything when not strict", () => {
    expect(valueAllowed("Whatever", ALLOWED)).toBe(true);
    expect(valueAllowed("Whatever", ALLOWED, false)).toBe(true);
  });

  it("takes only what is offered when strict", () => {
    expect(valueAllowed("Active", ALLOWED, true)).toBe(true);
    expect(valueAllowed("Whatever", ALLOWED, true)).toBe(false);
  });

  it("does not mind the case, or space around it", () => {
    expect(valueAllowed(" active ", ALLOWED, true)).toBe(true);
    expect(valueAllowed("ACTIVE", ALLOWED, true)).toBe(true);
  });

  it("always takes an empty value: clearing is not a wrong value", () => {
    expect(valueAllowed("", ALLOWED, true)).toBe(true);
    expect(valueAllowed("   ", ALLOWED, true)).toBe(true);
  });
});
