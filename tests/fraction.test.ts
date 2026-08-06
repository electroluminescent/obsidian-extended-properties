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
    expect(fmtFraction(0.75, 8)).toBe("¾");
    expect(fmtFraction(0.5, 8)).toBe("½");
  });

  it("rounds to the nearest fraction the denominator allows", () => {
    expect(fmtFraction(0.667, 3)).toBe("⅔");
    expect(fmtFraction(0.6, 2)).toBe("½");
    expect(fmtFraction(0.34, 8)).toBe("⅜"); // 0.34 is nearest 3/8 in eighths
  });

  it("writes a/b when Unicode has no glyph for it", () => {
    expect(fmtFraction(0.0625, 16)).toBe("1/16");
    expect(fmtFraction(3.0625, 16)).toBe("3 1/16");
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

  it("takes a silly denominator without falling over", () => {
    // A denominator below 1 is no denominator at all: whole numbers.
    expect(fmtFraction(0.5, 0)).toBe("1");
    expect(fmtFraction(1.5, 1)).toBe("2");
    expect(fmtFraction(0.5, 1000)).toBe("½"); // capped, and 1/2 is still 1/2
  });
});
