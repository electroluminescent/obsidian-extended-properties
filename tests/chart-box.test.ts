/**
 * The box a chart is drawn in: what it falls back to, and what it takes from
 * the room it was given.
 */

import { describe, expect, it } from "vitest";
import { chartBox } from "../src/ui/render/charts";
import { barLayout, barLayoutH } from "../src/utils/chart";

describe("the box a chart draws in", () => {
  it("is a line of text where nobody has given it one", () => {
    expect(chartBox("spark")).toEqual({ w: 64, h: 16 });
    expect(chartBox("progress")).toEqual({ w: 64, h: 10 });
    expect(chartBox("radar")).toEqual({ w: 64, h: 64 });
  });

  it("is the room it was given, rounded to whole pixels", () => {
    expect(chartBox("bar", { w: 420.4, h: 88.7 })).toEqual({ w: 420, h: 89 });
  });

  it("ignores a box that has not been measured yet", () => {
    expect(chartBox("bar", { w: 0, h: 0 })).toEqual({ w: 64, h: 16 });
    expect(chartBox("progress", { w: 300, h: 0 })).toEqual({ w: 300, h: 10 });
  });

  it("treats a kind it does not know as a sparkline", () => {
    expect(chartBox("nonsense")).toEqual({ w: 64, h: 16 });
  });
});

describe("bars lying down", () => {
  const values = [4, 2, 8];

  it("gives one row per value, each starting at the left edge", () => {
    const rows = barLayoutH(values, 200, 60, 2);
    expect(rows).toHaveLength(3);
    for (const r of rows) expect(r.x).toBe(0);
    // Rows stack down the box in order, none overlapping the next.
    for (let i = 1; i < rows.length; i++) expect(rows[i].y).toBeGreaterThanOrEqual(rows[i - 1].y + rows[i - 1].h);
  });

  it("measures the largest value across the full width", () => {
    const rows = barLayoutH(values, 200, 60, 0);
    expect(rows[2].w).toBe(200); // the peak fills it
    expect(rows[0].w).toBe(100); // half the peak, half the width
    expect(rows[1].w).toBe(50);
  });

  it("is the standing layout turned on its side", () => {
    const up = barLayout(values, 60, 200, 2);
    const along = barLayoutH(values, 200, 60, 2);
    expect(along.map((r) => r.h)).toEqual(up.map((r) => r.w)); // row thickness
    expect(along.map((r) => r.w)).toEqual(up.map((r) => r.h)); // bar length
    expect(along.map((r) => r.y)).toEqual(up.map((r) => r.x)); // position
  });
});
