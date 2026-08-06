/**
 * Intervals written in a calendar's own units: what "1Y" is worth on a
 * timeline, and how a worth is written back out.
 */

import { describe, expect, it } from "vitest";
import { formatSpan, parseSpan, spanUnits } from "../src/utils/date-span";
import type { DateConfig } from "../src/core/calendar";

/** The standard calendar: 12 months of 31 days, so a year is 372 days. */
const days: DateConfig = { format: "YYYY-MM-DD" };
/** The same calendar keeping a time of day, so a stored unit is a minute. */
const mins: DateConfig = { format: "YYYY-MM-DD HH:mm", time: { hoursPerDay: 24, minutesPerHour: 60 } };
/** A calendar of its own: ten months of thirty days. */
const other: DateConfig = {
  format: "YYYY-MM-DD",
  system: { months: 10, daysPerMonth: 30, daysPerWeek: 6, monthNames: [] },
};

describe("what an interval is worth", () => {
  it("counts in the calendar's own units", () => {
    expect(parseSpan("1Y", days)).toBe(372);
    expect(parseSpan("1M", days)).toBe(31);
    expect(parseSpan("3D", days)).toBe(3);
    expect(parseSpan("1Y", other)).toBe(300);
    expect(parseSpan("1M", other)).toBe(30);
  });

  it("counts in minutes where the property keeps a time of day", () => {
    expect(parseSpan("1D", mins)).toBe(1440);
    expect(parseSpan("1h", mins)).toBe(60);
    expect(parseSpan("30m", mins)).toBe(30);
    expect(parseSpan("90s", mins)).toBe(1.5);
    expect(parseSpan("1Y", mins)).toBe(372 * 1440);
  });

  it("tells a month from a minute by its case, as the format does", () => {
    expect(parseSpan("2M", mins)).toBe(2 * 31 * 1440);
    expect(parseSpan("2m", mins)).toBe(2);
  });

  it("adds up the terms it is given", () => {
    expect(parseSpan("1Y 6M", days)).toBe(372 + 186);
    expect(parseSpan("1Y, 6M", days)).toBe(558);
    expect(parseSpan("1D + 12h", mins)).toBe(1440 + 720);
  });

  it("takes a bare number as the unit values are stored in", () => {
    expect(parseSpan("30", days)).toBe(30);
    expect(parseSpan("30", mins)).toBe(30);
  });

  it("reads a unit however it is spelled", () => {
    expect(parseSpan("2 years", days)).toBe(744);
    expect(parseSpan("2 Months", days)).toBe(62);
    expect(parseSpan("3 hrs", mins)).toBe(180);
    expect(parseSpan("5 mins", mins)).toBe(5);
  });

  it("gives nothing for what is not an interval", () => {
    expect(parseSpan("", days)).toBeUndefined();
    expect(parseSpan("   ", days)).toBeUndefined();
    expect(parseSpan("3 mint", days)).toBeUndefined();
    expect(parseSpan("soon", days)).toBeUndefined();
    expect(parseSpan("0", days)).toBeUndefined(); // no interval at all
  });

  it("puts a sub-day unit between two dates rather than refusing it", () => {
    expect(parseSpan("12h", days)).toBe(0.5);
  });
});

describe("writing an interval back out", () => {
  it("uses the largest unit that measures it exactly", () => {
    expect(formatSpan(372, days)).toBe("1Y");
    expect(formatSpan(31, days)).toBe("1M");
    expect(formatSpan(7, days)).toBe("7D");
    expect(formatSpan(0.5, days)).toBe("12h");
    expect(formatSpan(1440, mins)).toBe("1D");
    expect(formatSpan(90, mins)).toBe("90m"); // an hour and a half is not a whole hour
    expect(formatSpan(1.5, mins)).toBe("90s");
  });

  it("leaves a span that fits nothing evenly as a number", () => {
    expect(formatSpan(Math.PI, days)).toBe(String(Math.PI));
  });

  it("says nothing at all for no interval", () => {
    expect(formatSpan(undefined, days)).toBe("");
    expect(formatSpan(0, days)).toBe("");
  });

  it("reads back what was typed", () => {
    for (const text of ["1Y", "6M", "3D", "2Y"]) {
      expect(formatSpan(parseSpan(text, days), days)).toBe(text);
    }
    for (const text of ["1D", "6h", "45m"]) {
      expect(formatSpan(parseSpan(text, mins), mins)).toBe(text);
    }
  });
});

describe("the units on offer", () => {
  it("run largest to smallest, so formatting picks the largest", () => {
    const worth = spanUnits(days).map((u) => u.serials);
    expect(worth).toEqual([...worth].sort((a, b) => b - a));
    expect(spanUnits(days).map((u) => u.id)).toEqual(["Y", "M", "D", "h", "m", "s"]);
  });
});
