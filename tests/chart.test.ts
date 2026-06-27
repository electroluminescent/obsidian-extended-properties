import { describe, it, expect } from "vitest";
import { extent, sparklinePath, barLayout, radarPoints, ringPoints, pointsAttr, clampFrac } from "../src/utils/chart";

describe("extent", () => {
  it("returns min/max", () => {
    expect(extent([3, 1, 4, 1, 5])).toEqual({ min: 1, max: 5 });
  });
  it("pads a flat series so the span is never zero", () => {
    const e = extent([7, 7, 7]);
    expect(e.max).toBeGreaterThan(e.min);
  });
  it("falls back for empty input", () => {
    expect(extent([])).toEqual({ min: 0, max: 1 });
  });
});

describe("sparklinePath", () => {
  it("starts with M and has one point per value", () => {
    const d = sparklinePath([1, 2, 3], 60, 16, 2);
    expect(d.startsWith("M")).toBe(true);
    expect((d.match(/[ML]/g) || []).length).toBe(3);
  });
  it("maps the max value to the top (smallest y) and min to the bottom", () => {
    const d = sparklinePath([0, 10], 60, 16, 2);
    const pts = d
      .replace(/[ML]/g, " ")
      .trim()
      .split(/\s+/)
      .map(Number);
    const y0 = pts[1];
    const y1 = pts[3];
    expect(y1).toBeLessThan(y0); // 10 is higher up than 0
  });
  it("centers a single value", () => {
    const d = sparklinePath([5], 60, 16, 2);
    expect(d).toContain("M30.00");
  });
});

describe("barLayout", () => {
  it("returns one rect per value, tallest = full height", () => {
    const rects = barLayout([1, 2, 4], 60, 16, 1);
    expect(rects).toHaveLength(3);
    expect(rects[2].h).toBeCloseTo(16);
    expect(rects[0].h).toBeCloseTo(4);
  });
  it("clamps negatives to zero height", () => {
    const rects = barLayout([-3, 5], 60, 16);
    expect(rects[0].h).toBe(0);
  });
  it("bars sit within the width", () => {
    const rects = barLayout([1, 1, 1, 1], 60, 16, 2);
    const last = rects[rects.length - 1];
    expect(last.x + last.w).toBeLessThanOrEqual(60.001);
  });
});

describe("radarPoints / ringPoints", () => {
  it("first axis points straight up from the center", () => {
    const [p] = radarPoints([10], 10, 50, 50, 40);
    expect(p.x).toBeCloseTo(50);
    expect(p.y).toBeCloseTo(10); // cy - r
  });
  it("a full value reaches the radius; zero stays at center", () => {
    const pts = radarPoints([20, 0], 20, 50, 50, 40);
    expect(Math.hypot(pts[0].x - 50, pts[0].y - 50)).toBeCloseTo(40);
    expect(Math.hypot(pts[1].x - 50, pts[1].y - 50)).toBeCloseTo(0);
  });
  it("ringPoints all sit on the radius", () => {
    for (const p of ringPoints(6, 50, 50, 40)) {
      expect(Math.hypot(p.x - 50, p.y - 50)).toBeCloseTo(40);
    }
  });
  it("pointsAttr formats x,y pairs", () => {
    expect(pointsAttr([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("1.00,2.00 3.00,4.00");
  });
});

describe("clampFrac", () => {
  it("clamps to [0,1] and handles bad max", () => {
    expect(clampFrac(5, 10)).toBe(0.5);
    expect(clampFrac(20, 10)).toBe(1);
    expect(clampFrac(-5, 10)).toBe(0);
    expect(clampFrac(5, 0)).toBe(0);
  });
});
