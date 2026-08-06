/**
 * Scale lines on a slider or timeline: where they fall, which one wins where
 * two meet, and how far a value may be pulled onto one.
 */

import { describe, expect, it } from "vitest";
import { maxSnapRange, snapReach, snapTicks, snapValue, ticksFor, MAX_TICKS } from "../src/utils/ticks";

const values = (t: { value: number }[]): number[] => t.map((x) => x.value);

describe("where the lines fall", () => {
  it("puts a line on every multiple inside the range", () => {
    expect(values(ticksFor(0, 10, 5))).toEqual([0, 5, 10]);
    expect(values(ticksFor(0, 10, 2.5))).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it("starts from the multiples, not from the minimum", () => {
    // A range starting at 3 with a step of 5 has lines at 5 and 10, not 3 and 8.
    expect(values(ticksFor(3, 12, 5))).toEqual([5, 10]);
  });

  it("draws secondary lines between the primary ones", () => {
    const t = ticksFor(0, 4, 2, 1);
    expect(values(t)).toEqual([0, 1, 2, 3, 4]);
    expect(t.filter((x) => x.major).map((x) => x.value)).toEqual([0, 2, 4]);
  });

  it("drops a secondary line that falls on a primary one", () => {
    const t = ticksFor(0, 4, 2, 2);
    expect(values(t)).toEqual([0, 2, 4]);
    expect(t.every((x) => x.major)).toBe(true);
  });

  it("draws nothing without an interval, or over a dead range", () => {
    expect(ticksFor(0, 10)).toEqual([]);
    expect(ticksFor(0, 10, 0)).toEqual([]);
    expect(ticksFor(5, 5, 1)).toEqual([]);
    expect(ticksFor(10, 0, 1)).toEqual([]);
  });

  it("refuses to draw a wall of lines", () => {
    expect(ticksFor(0, MAX_TICKS * 10, 1)).toEqual([]);
    expect(ticksFor(0, 100, 1).length).toBe(101);
  });
});

describe("how far a value may be pulled", () => {
  it("is half the finest interval", () => {
    expect(maxSnapRange(10)).toBe(5);
    expect(maxSnapRange(10, 2)).toBe(1);
    expect(maxSnapRange(undefined, 4)).toBe(2);
  });

  it("is nothing when there are no lines", () => {
    expect(maxSnapRange()).toBe(0);
    expect(maxSnapRange(0, 0)).toBe(0);
  });
});

describe("which lines a value settles on", () => {
  it("takes the primary set, the secondary set, or both", () => {
    expect(values(snapTicks(0, 10, 5, 1, { primary: true }))).toEqual([0, 5, 10]);
    expect(values(snapTicks(0, 4, 2, 1, { secondary: true }))).toEqual([0, 1, 2, 3, 4]);
    expect(values(snapTicks(0, 4, 2, 1, { primary: true, secondary: true }))).toEqual([0, 1, 2, 3, 4]);
    expect(snapTicks(0, 10, 5, 1, {})).toEqual([]);
  });

  it("counts a secondary that shares a primary's place, unlike the drawn lines", () => {
    // Drawn, 4 is only a primary; for snapping to secondaries it is still a
    // multiple of 2, so a value near it settles there.
    expect(values(snapTicks(0, 4, 4, 2, { secondary: true }))).toEqual([0, 2, 4]);
  });

  it("reaches half the finest interval it uses", () => {
    expect(snapReach(10, 2, { primary: true })).toBe(5);
    expect(snapReach(10, 2, { secondary: true })).toBe(1);
    expect(snapReach(10, 2, { primary: true, secondary: true })).toBe(1);
    expect(snapReach(10, 2, {})).toBe(0);
  });
});

describe("snapping", () => {
  const ticks = ticksFor(0, 10, 5, 1);

  it("pulls a value onto the nearest line in range", () => {
    expect(snapValue(4.8, ticks, 0.5)).toBe(5);
    expect(snapValue(3.2, ticks, 0.5)).toBe(3);
  });

  it("leaves a value that is out of reach alone", () => {
    expect(snapValue(3.5, ticks, 0.4)).toBe(3.5);
  });

  it("prefers the primary line where two are equally close", () => {
    // 4.5 is half a unit from the secondary 4 and from the primary 5.
    expect(snapValue(4.5, ticks, 0.5)).toBe(5);
  });

  it("does nothing without a range or without lines", () => {
    expect(snapValue(4.8, ticks, 0)).toBe(4.8);
    expect(snapValue(4.8, [], 1)).toBe(4.8);
  });
});
