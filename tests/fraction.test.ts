/**
 * Writing a decimal as the nearest fraction: the display half of a number
 * property that keeps its fractions.
 */

import { describe, expect, it } from "vitest";
import { fmtFraction } from "../src/utils/misc";

describe("as a fraction", () => {
  it("uses the glyph where there is one", () => {
    expect(fmtFraction(0.5)).toBe("½");
    expect(fmtFraction(1.5)).toBe("1½");
    expect(fmtFraction(0.25)).toBe("¼");
    expect(fmtFraction(2.75)).toBe("2¾");
    expect(fmtFraction(0.125)).toBe("⅛");
    expect(fmtFraction(0.375)).toBe("⅜");
  });

  it("reduces to lowest terms rather than showing the denominator asked for", () => {
    // 6/8 is three quarters, and quarters have a glyph.
    expect(fmtFraction(0.75, { max: 8 })).toBe("¾");
    expect(fmtFraction(0.5, { max: 8 })).toBe("½");
  });

  it("rounds to the nearest fraction the denominator allows", () => {
    expect(fmtFraction(0.667, { max: 3 })).toBe("⅔");
    expect(fmtFraction(0.6, { max: 2 })).toBe("½");
    expect(fmtFraction(0.34, { max: 8 })).toBe("⅜"); // nearest 3/8 in eighths
  });

  it("writes a/b when Unicode has no glyph for it", () => {
    expect(fmtFraction(0.0625, { max: 16 })).toBe("1/16");
    expect(fmtFraction(3.0625, { max: 16 })).toBe("3 1/16");
  });

  it("never shows a zero part", () => {
    expect(fmtFraction(2)).toBe("2");
    expect(fmtFraction(2.01)).toBe("2"); // rounds away in eighths
    expect(fmtFraction(1.99)).toBe("2"); // rounds up to the whole number
    expect(fmtFraction(0)).toBe("0");
  });

  it("keeps the sign in front", () => {
    expect(fmtFraction(-0.5)).toBe("-½");
    expect(fmtFraction(-2.25)).toBe("-2¼");
    expect(fmtFraction(-3)).toBe("-3");
  });

  it("keeps the denominator when asked, instead of reducing", () => {
    expect(fmtFraction(0.75, { max: 8, keepDen: true })).toBe("6/8");
    expect(fmtFraction(0.5, { max: 8, keepDen: true })).toBe("4/8");
    // Already over the denominator asked for, so the glyph still applies.
    expect(fmtFraction(2.25, { max: 4, keepDen: true })).toBe("2¼");
    // A whole number is still a whole number, not 2 0/8 or 1 8/8.
    expect(fmtFraction(2, { max: 8, keepDen: true })).toBe("2");
    expect(fmtFraction(1.99, { max: 8, keepDen: true })).toBe("2");
    expect(fmtFraction(-0.5, { max: 8, keepDen: true })).toBe("-4/8");
  });

  it("takes a silly denominator without falling over", () => {
    // A denominator below 1 is no denominator at all: whole numbers.
    expect(fmtFraction(0.5, { max: 0 })).toBe("1");
    expect(fmtFraction(1.5, { max: 1 })).toBe("2");
    expect(fmtFraction(0.5, { max: 1000 })).toBe("½"); // capped, and a half is a half
  });
});

describe("without the denominator", () => {
  const hide = { max: 8, showDen: false } as const;

  it("writes the numerator after a divider", () => {
    expect(fmtFraction(2.375, hide)).toBe("2.3");
    expect(fmtFraction(0.125, hide)).toBe("0.1");
    expect(fmtFraction(3.0625, { max: 16, showDen: false })).toBe("3.1");
  });

  it("leaves the numerator over the largest denominator, never reduced", () => {
    // Three quarters is 6/8 here: "2.3" would read as three eighths.
    expect(fmtFraction(2.75, hide)).toBe("2.6");
    expect(fmtFraction(0.5, hide)).toBe("0.4");
  });

  it("takes the divider the user asked for", () => {
    expect(fmtFraction(2.375, { ...hide, divider: "-" })).toBe("2-3");
    expect(fmtFraction(2.375, { ...hide, divider: " " })).toBe("2 3");
  });

  it("appends the suffix, whatever else is shown", () => {
    expect(fmtFraction(2.375, { ...hide, suffix: '"' })).toBe('2.3"');
    expect(fmtFraction(2, { ...hide, suffix: '"' })).toBe('2"');
    expect(fmtFraction(2.75, { max: 8, suffix: " in" })).toBe("2¾ in");
  });

  it("still writes a whole number as one", () => {
    expect(fmtFraction(2, hide)).toBe("2");
    expect(fmtFraction(1.99, hide)).toBe("2");
    expect(fmtFraction(-2.375, hide)).toBe("-2.3");
  });
});
