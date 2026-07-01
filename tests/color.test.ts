import { describe, it, expect } from "vitest";
import {
  hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToOklab, oklabToRgb, rgbToOklch, oklchToRgb, inGamutLin, gradientStops,
} from "../src/utils/color";

describe("hexToRgb / rgbToHex", () => {
  it("parses 6-digit and 3-digit hex, with or without #", () => {
    expect(hexToRgb("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb("#00f")).toEqual({ r: 0, g: 0, b: 255 });
  });

  it("rejects invalid hex", () => {
    expect(hexToRgb("nope")).toBeNull();
    expect(hexToRgb("#12")).toBeNull();
    expect(hexToRgb("")).toBeNull();
  });

  it("round-trips through rgbToHex", () => {
    for (const hex of ["#ff0000", "#00ff00", "#123456"]) {
      const rgb = hexToRgb(hex)!;
      expect(rgbToHex(rgb.r, rgb.g, rgb.b)).toBe(hex);
    }
  });

  it("clamps out-of-range channels", () => {
    expect(rgbToHex(-10, 300, 128)).toBe("#00ff80");
  });
});

describe("RGB <-> HSL", () => {
  it("converts primary colors", () => {
    const hsl = rgbToHsl(255, 0, 0);
    expect(hsl.h).toBeCloseTo(0, 0);
    expect(hsl.s).toBeCloseTo(100, 0);
    expect(hsl.l).toBeCloseTo(50, 0);
  });

  it("round-trips RGB -> HSL -> RGB", () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 200, 100], [30, 30, 30], [255, 255, 255], [0, 0, 0]]) {
      const hsl = rgbToHsl(r, g, b);
      const back = hslToRgb(hsl.h, hsl.s, hsl.l);
      expect(back.r).toBeCloseTo(r, 0);
      expect(back.g).toBeCloseTo(g, 0);
      expect(back.b).toBeCloseTo(b, 0);
    }
  });

  it("wraps hue and clamps s/l", () => {
    const a = hslToRgb(370, 50, 50);
    const b = hslToRgb(10, 50, 50);
    expect(a.r).toBeCloseTo(b.r, 0);
    expect(a.g).toBeCloseTo(b.g, 0);
    expect(a.b).toBeCloseTo(b.b, 0);
  });
});

describe("RGB <-> OKLab / OKLCH", () => {
  it("round-trips through OKLab", () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 128, 255], [200, 200, 200]]) {
      const lab = rgbToOklab(r, g, b);
      const back = oklabToRgb(lab.L, lab.a, lab.b);
      expect(back.r).toBeCloseTo(r, 0);
      expect(back.g).toBeCloseTo(g, 0);
      expect(back.b).toBeCloseTo(b, 0);
    }
  });

  it("round-trips through OKLCH", () => {
    for (const [r, g, b] of [[255, 0, 0], [0, 128, 255], [10, 200, 90]]) {
      const lch = rgbToOklch(r, g, b);
      const back = oklchToRgb(lch.L, lch.C, lch.H);
      expect(back.r).toBeCloseTo(r, 0);
      expect(back.g).toBeCloseTo(g, 0);
      expect(back.b).toBeCloseTo(b, 0);
    }
  });

  it("keeps hue non-negative", () => {
    const lch = rgbToOklch(0, 0, 255);
    expect(lch.H).toBeGreaterThanOrEqual(0);
  });
});

describe("inGamutLin", () => {
  it("accepts in-range linear values", () => {
    expect(inGamutLin({ lr: 0.5, lg: 0.5, lb: 0.5 })).toBe(true);
  });
  it("rejects clearly out-of-gamut values", () => {
    expect(inGamutLin({ lr: 2, lg: 0, lb: 0 })).toBe(false);
    expect(inGamutLin({ lr: -1, lg: 0, lb: 0 })).toBe(false);
  });
});

describe("gradientStops", () => {
  it("produces a linear-gradient with the requested number of stops", () => {
    const css = gradientStops(4, (t) => ({ rgb: { r: t * 255, g: 0, b: 0 }, oog: false }));
    expect(css.startsWith("linear-gradient(to right, ")).toBe(true);
    expect(css.split(",").length).toBeGreaterThanOrEqual(5);
    expect(css).toContain("0%");
    expect(css).toContain("100%");
  });

  it("marks out-of-gamut stops translucent", () => {
    const css = gradientStops(1, (t) => ({ rgb: { r: 0, g: 0, b: 0 }, oog: t > 0 }));
    expect(css).toContain("rgba(");
  });
});
