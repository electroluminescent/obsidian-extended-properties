/**
 * Calendar engine tests: format/parse round-trips under standard and
 * custom systems, month names, era pools (including eras not yet in the
 * pool), range validation, and serial ordering.
 */

import { describe, expect, it } from "vitest";
import {
  DateConfig, dateSerial, decodeSerial, encodeSerial, formatDate, monthName, parseDate, serialOf,
  standardSystem, systemOf, translateSerial, weekday,
} from "../src/core/calendar";

const std: DateConfig = { format: "MM/DD/YYYY" };

describe("formatDate / parseDate (standard system)", () => {
  it("round-trips MM/DD/YYYY", () => {
    const p = { year: 2024, month: 3, day: 7 };
    const s = formatDate(p, std);
    expect(s).toBe("03/07/2024");
    expect(parseDate(s, std)).toMatchObject(p);
  });

  it("accepts unpadded numbers for padded tokens", () => {
    expect(parseDate("3/7/2024", std)).toMatchObject({ year: 2024, month: 3, day: 7 });
  });

  it("month names format and parse (MMMM / MMM)", () => {
    const cfg: DateConfig = { format: "D MMMM Y" };
    expect(formatDate({ year: 1024, month: 11, day: 5 }, cfg)).toBe("5 November 1024");
    expect(parseDate("5 november 1024", cfg)).toMatchObject({ month: 11 });
    const abbr: DateConfig = { format: "D MMM Y" };
    expect(formatDate({ year: 1024, month: 11, day: 5 }, abbr)).toBe("5 Nov 1024");
    expect(parseDate("5 nov 1024", abbr)).toMatchObject({ month: 11 });
  });

  it("rejects out-of-range parts and non-matching text", () => {
    expect(parseDate("13/40/2024", std)).toBeNull();
    expect(parseDate("hello", std)).toBeNull();
    expect(parseDate("03-07-2024", std)).toBeNull(); // wrong separators
  });
});

describe("custom systems", () => {
  const harptos: DateConfig = {
    format: "D MMMM, Y E",
    system: { months: 3, daysPerMonth: 30, daysPerWeek: 10, monthNames: ["Hammer", "Alturiak", "Ches"] },
    eras: ["BR", "DR"],
  };

  it("uses custom month names and counts", () => {
    expect(monthName(systemOf(harptos), 2)).toBe("Alturiak");
    expect(formatDate({ year: 1372, month: 3, day: 30, era: "DR" }, harptos)).toBe("30 Ches, 1372 DR");
    expect(parseDate("30 Ches, 1372 DR", harptos)).toMatchObject({ year: 1372, month: 3, day: 30, era: "DR" });
    expect(parseDate("31 Ches, 1372 DR", harptos)).toBeNull(); // beyond daysPerMonth
    expect(parseDate("1 Foo, 1372 DR", harptos)).toBeNull(); // unknown month
  });

  it("falls back to 'Month N' names past the named list", () => {
    const cfg: DateConfig = { format: "MMMM Y", system: { months: 4, daysPerMonth: 10, daysPerWeek: 5, monthNames: ["One"] } };
    expect(formatDate({ year: 1, month: 3, day: 1 }, cfg)).toBe("Month 3 1");
    expect(parseDate("Month 3 1", cfg)).toMatchObject({ month: 3, year: 1 });
  });

  it("era is optional and unknown eras still parse (pool grows in the editor)", () => {
    const noEra = parseDate("30 Ches, 1372", harptos);
    expect(noEra).toMatchObject({ year: 1372, month: 3, day: 30 });
    expect(noEra?.era).toBeUndefined();
    expect(parseDate("30 Ches, 1372 NEW", harptos)).toMatchObject({ era: "NEW" });
  });

  it("era-less dates format without a dangling separator", () => {
    expect(formatDate({ year: 1372, month: 1, day: 2 }, harptos)).toBe("2 Hammer, 1372");
  });

  it("weekday follows the custom week length", () => {
    const p1 = parseDate("1 Hammer, 0", harptos)!;
    const p2 = parseDate("11 Hammer, 0", harptos)!;
    expect(weekday(p1, harptos)).toBe(weekday(p2, harptos)); // 10-day week wraps
  });
});

describe("dateSerial ordering", () => {
  it("ascends with year/month/day", () => {
    const a = dateSerial({ year: 2024, month: 3, day: 7 }, std);
    const b = dateSerial({ year: 2024, month: 3, day: 8 }, std);
    const c = dateSerial({ year: 2024, month: 4, day: 1 }, std);
    const d = dateSerial({ year: 2025, month: 1, day: 1 }, std);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThan(d);
  });

  it("eras order by pool position; unknown after; era-less first", () => {
    const cfg: DateConfig = { format: "Y E", eras: ["BCE", "CE"] };
    const none = serialOf("5", cfg)!;
    const bce = serialOf("5 BCE", cfg)!;
    const ce = serialOf("5 CE", cfg)!;
    const odd = serialOf("5 Weird", cfg)!;
    expect(none).toBeLessThan(bce);
    expect(bce).toBeLessThan(ce);
    expect(ce).toBeLessThan(odd);
  });

  it("serialOf returns null for text that doesn't fit", () => {
    expect(serialOf("not a date", std)).toBeNull();
  });

  it("standard system is 12 uniform months", () => {
    const s = standardSystem();
    expect(s.months).toBe(12);
    expect(monthName(s, 1)).toBe("January");
  });
});

describe("serial storage (encode/decode/translate)", () => {
  const cfg: DateConfig = {
    format: "D MMMM, Y E",
    system: { months: 10, daysPerMonth: 30, daysPerWeek: 6, monthNames: [] },
    eras: ["BE", "AE"],
  };

  it("encode/decode round-trips, including negative years and eras", () => {
    for (const p of [
      { year: 1372, month: 3, day: 30 },
      { year: 0, month: 1, day: 1 },
      { year: -45, month: 10, day: 12 },
      { year: 812, month: 7, day: 4, era: "AE" },
      { year: -3, month: 2, day: 9, era: "BE" },
    ]) {
      const back = decodeSerial(encodeSerial(p, cfg), cfg)!;
      expect(back.year).toBe(p.year);
      expect(back.month).toBe(p.month);
      expect(back.day).toBe(p.day);
      expect(back.era).toBe((p as { era?: string }).era);
    }
  });

  it("an era removed from the pool decodes era-less", () => {
    const v = encodeSerial({ year: 5, month: 1, day: 1, era: "AE" }, cfg);
    const shrunk: DateConfig = { ...cfg, eras: ["BE"] };
    expect(decodeSerial(v, shrunk)?.era).toBeUndefined();
  });

  it("translateSerial keeps the interpreted date across system changes", () => {
    const before: DateConfig = { format: "Y-M-D", system: { months: 12, daysPerMonth: 31, daysPerWeek: 7, monthNames: [] } };
    const after: DateConfig = { format: "Y-M-D", system: { months: 10, daysPerMonth: 28, daysPerWeek: 7, monthNames: [] } };
    const v = encodeSerial({ year: 1024, month: 6, day: 15 }, before);
    const moved = translateSerial(v, before, after);
    expect(decodeSerial(moved, after)).toMatchObject({ year: 1024, month: 6, day: 15 });
    // WITHOUT translation the same integer means a different date - the
    // failure mode the migration exists to prevent.
    expect(decodeSerial(v, after)).not.toMatchObject({ year: 1024, month: 6, day: 15 });
  });

  it("clamps to the closest representable date when the system shrinks", () => {
    const before: DateConfig = { format: "Y-M-D", system: { months: 13, daysPerMonth: 30, daysPerWeek: 7, monthNames: [] } };
    const after: DateConfig = { format: "Y-M-D", system: { months: 12, daysPerMonth: 28, daysPerWeek: 7, monthNames: [] } };
    const v = encodeSerial({ year: 900, month: 13, day: 30 }, before);
    expect(decodeSerial(translateSerial(v, before, after), after)).toMatchObject({ year: 900, month: 12, day: 28 });
  });

  it("era survives translation when still pooled, drops when removed", () => {
    const before: DateConfig = { format: "Y E", eras: ["BCE", "CE"] };
    const keep: DateConfig = { format: "Y E", eras: ["OLD", "BCE", "CE"] }; // reordered pool
    const gone: DateConfig = { format: "Y E", eras: ["CE"] };
    const v = encodeSerial({ year: 44, month: 1, day: 1, era: "BCE" }, before);
    expect(decodeSerial(translateSerial(v, before, keep), keep)).toMatchObject({ era: "BCE", year: 44 });
    expect(decodeSerial(translateSerial(v, before, gone), gone)?.era).toBeUndefined();
  });

  it("identity translation is a no-op", () => {
    const v = encodeSerial({ year: 1372, month: 3, day: 30, era: "AE" }, cfg);
    expect(translateSerial(v, cfg, cfg)).toBe(v);
  });

  it("dateSerial (ordering) and encodeSerial agree", () => {
    const p = { year: 2024, month: 3, day: 7 };
    expect(dateSerial(p, std)).toBe(encodeSerial(p, std));
  });
});
