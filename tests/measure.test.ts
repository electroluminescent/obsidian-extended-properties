/**
 * Working out what a numeric field was given: arithmetic, measurements, and
 * measurements mixed into arithmetic.
 */

import { describe, expect, it } from "vitest";
import { evalMeasure, needsEval, toPlainMath, unitsForField } from "../src/utils/measure";
import { convert, preferredUnit, unitByAlias, unitsFor, UNITS } from "../src/utils/units";

/** Rounded, since a converted measurement is rarely exact. */
const near = (n: number | undefined, want: number, places = 2): void => {
  expect(n).toBeDefined();
  expect(Number((n as number).toFixed(places))).toBe(want);
};

describe("arithmetic", () => {
  it("works out what was typed", () => {
    expect(evalMeasure("12*3")).toBe(36);
    expect(evalMeasure("(8+4)/2")).toBe(6);
    expect(evalMeasure("10 - 2.5")).toBe(7.5);
    expect(evalMeasure("2^3")).toBe(8);
  });

  it("passes a plain number through", () => {
    expect(evalMeasure("42")).toBe(42);
    expect(evalMeasure("-3.5")).toBe(-3.5);
  });

  it("gives nothing for an empty or senseless field", () => {
    expect(evalMeasure("")).toBeUndefined();
    expect(evalMeasure("   ")).toBeUndefined();
    expect(evalMeasure("what")).toBeUndefined();
    expect(evalMeasure("1/0")).toBeUndefined(); // not finite
  });

  it("knows when a value is worth working out at all", () => {
    expect(needsEval("42")).toBe(false);
    expect(needsEval("-3.5")).toBe(false);
    expect(needsEval("12*3")).toBe(true);
    expect(needsEval('1\'2"')).toBe(true);
  });
});

describe("measurements", () => {
  it("reads feet and inches written together", () => {
    // Into inches, the way the field's owner keeps lengths.
    near(evalMeasure('1\'2"', { length: "in" }), 14);
    near(evalMeasure('5\'6"', { length: "in" }), 66);
    near(evalMeasure("5'", { length: "in" }), 60);
  });

  it("converts each measurement into the unit that quantity is kept in", () => {
    near(evalMeasure('1\'2" - 5cm', { length: "in" }), 12.03);
    near(evalMeasure('1\'2" - 5cm', { length: "cm" }), 30.56);
    near(evalMeasure("3 lb + 12 oz", { mass: "lb" }), 3.75);
    near(evalMeasure("1 gal - 2 cup", { volume: "l" }), 3.31);
  });

  it("uses the quantity's own default when nothing is chosen", () => {
    near(evalMeasure("5cm"), 0.05); // metres
    near(evalMeasure("2 lb"), 0.91); // kilograms
  });

  it("mixes measurements into arithmetic", () => {
    near(evalMeasure("(2ft + 6in) * 2", { length: "in" }), 60);
    near(evalMeasure("10cm / 2", { length: "cm" }), 5);
  });

  it("does not read a word that merely starts with a unit", () => {
    // "3 mint" is not three minutes; nothing resolves, so nothing comes back.
    expect(evalMeasure("3 mint")).toBeUndefined();
  });

  it("leaves a bare number where no unit follows", () => {
    // Spacing is the tokeniser's business; what matters is the maths left behind.
    expect(toPlainMath("12 + 3").replace(/\s+/g, "")).toBe("12+3");
    expect(evalMeasure("12 + 3")).toBe(15);
  });
});

describe("a property with its own unit", () => {
  it("is kept in that unit, whatever the setting says for the quantity", () => {
    const settings = { length: "cm" };
    near(evalMeasure('1\'2" - 5cm', unitsForField(settings, "in")), 12.03);
    near(evalMeasure('1\'2" - 5cm', unitsForField(settings, undefined)), 30.56);
  });

  it("leaves the other quantities to the settings", () => {
    const at = unitsForField({ mass: "lb" }, "ft");
    near(evalMeasure("3 lb + 12 oz", at), 3.75); // mass still in pounds
    near(evalMeasure("1 yd", at), 3); // length now in feet
  });

  it("ignores a unit the table does not know", () => {
    expect(unitsForField({ length: "cm" }, "XP")).toEqual({ length: "cm" });
    expect(unitsForField(undefined, "%")).toBeUndefined();
  });

  it("takes the unit however it is written", () => {
    expect(unitsForField({}, "Feet")).toEqual({ length: "ft" });
    expect(unitsForField({}, "kg")).toEqual({ mass: "kg" });
  });
});

describe("the unit table", () => {
  it("knows a unit by any of its spellings", () => {
    expect(unitByAlias("cm")?.id).toBe("cm");
    expect(unitByAlias("Centimetres")?.id).toBe("cm");
    expect(unitByAlias('"')?.id).toBe("in");
    expect(unitByAlias("'")?.id).toBe("ft");
    expect(unitByAlias("nope")).toBeUndefined();
  });

  it("converts within a quantity and refuses across them", () => {
    const inch = unitByAlias("in")!;
    const cm = unitByAlias("cm")!;
    const kg = unitByAlias("kg")!;
    near(convert(1, inch, cm), 2.54);
    expect(convert(1, inch, kg)).toBeUndefined();
  });

  it("groups a quantity's units by system, metric first", () => {
    const lengths = unitsFor("length");
    expect(lengths[0].system).toBe("metric");
    expect(lengths.map((u) => u.id)).toContain("ft");
    expect(new Set(lengths.map((u) => u.quantity))).toEqual(new Set(["length"]));
  });

  it("has a unique id for every unit", () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
  });

  it("falls back to the quantity's base unit when the setting names nothing", () => {
    expect(preferredUnit("length").id).toBe("m");
    expect(preferredUnit("length", { length: "nope" }).id).toBe("m");
    expect(preferredUnit("length", { length: "ft" }).id).toBe("ft");
  });
});
