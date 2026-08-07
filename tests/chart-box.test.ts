/**
 * The box a chart is drawn in: what it falls back to, and what it takes from
 * the room it was given.
 */

import { describe, expect, it } from "vitest";
import { chartBox } from "../src/ui/render/charts";

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
