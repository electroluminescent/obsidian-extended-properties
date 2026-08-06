/**
 * Timeline intervals written the way a date reads: "1Y", "6M", "3D", "12h",
 * "30m".
 *
 * A timeline's scale lines are spaced in the same units the values are stored
 * in - days, or minutes where the property keeps a time of day - and those
 * units belong to the property's own calendar, so a year is however many days
 * that calendar's year holds. A bare number is taken as those stored units, so
 * an interval written before any of this still means what it did.
 *
 * Case matters between the two the tokens share: "M" is a month, "m" a minute,
 * exactly as in the format strings. Everything else reads either way.
 *
 * Pure: the calendar arithmetic lives in `core/calendar`; this only sizes it.
 */

import { systemOf, timeOf, timeOn, type DateConfig } from "../core/calendar";

/** One writable unit and what it is worth in stored units. */
export interface SpanUnit {
  id: string;
  serials: number;
}

/**
 * The units an interval may be written in, largest first. Where a property
 * keeps no time of day, an hour is still a fraction of a day rather than an
 * error - it just falls between two storable dates.
 */
export function spanUnits(cfg: DateConfig): SpanUnit[] {
  const sys = systemOf(cfg);
  const tm = timeOf(cfg);
  const day = timeOn(cfg) ? tm.hoursPerDay * tm.minutesPerHour : 1;
  return [
    { id: "Y", serials: sys.months * sys.daysPerMonth * day },
    { id: "M", serials: sys.daysPerMonth * day },
    { id: "D", serials: day },
    { id: "h", serials: day / tm.hoursPerDay },
    { id: "m", serials: day / (tm.hoursPerDay * tm.minutesPerHour) },
    { id: "s", serials: day / (tm.hoursPerDay * tm.minutesPerHour * 60) },
  ];
}

/** Spelled-out units, all case-insensitive (none of them collide). */
const WORDS: Record<string, string> = {
  y: "Y", yr: "Y", yrs: "Y", year: "Y", years: "Y",
  mo: "M", mos: "M", mon: "M", month: "M", months: "M",
  d: "D", day: "D", days: "D",
  h: "h", hr: "h", hrs: "h", hour: "h", hours: "h",
  min: "m", mins: "m", minute: "m", minutes: "m",
  s: "s", sec: "s", secs: "s", second: "s", seconds: "s",
};

/** Which unit a written suffix means, or undefined if it means nothing. */
function unitId(word: string): string | undefined {
  if (word === "") return "";
  if (word === "M") return "M"; // month, against "m" for minute
  if (word === "m") return "m";
  return WORDS[word.toLowerCase()];
}

/** A number, its unit, and whatever separates it from the next term. */
const TERM = /\s*(\d+(?:\.\d+)?)\s*([A-Za-z]*)\s*(?:[+,]\s*)?/y;

/**
 * What an interval works out to in stored units, or undefined if it is not an
 * interval at all. Terms add up, so "1Y 6M" is a year and a half.
 */
export function parseSpan(text: string, cfg: DateConfig): number | undefined {
  const raw = text.trim();
  if (!raw) return undefined;
  const worth = new Map(spanUnits(cfg).map((u) => [u.id, u.serials]));
  let total = 0;
  let i = 0;
  while (i < raw.length) {
    TERM.lastIndex = i;
    const m = TERM.exec(raw);
    if (!m) return undefined;
    const id = unitId(m[2]);
    if (id === undefined) return undefined; // a word that is not a unit
    total += Number(m[1]) * (id === "" ? 1 : (worth.get(id) ?? 0));
    i = TERM.lastIndex;
  }
  return total > 0 && Number.isFinite(total) ? total : undefined;
}

/**
 * An interval written back out in the largest unit that measures it exactly,
 * so what was typed is what is read back. A span that fits no unit evenly
 * stays a plain number.
 */
export function formatSpan(n: number | undefined, cfg: DateConfig): string {
  if (n === undefined || !(n > 0) || !Number.isFinite(n)) return "";
  for (const u of spanUnits(cfg)) {
    const q = n / u.serials;
    if (q >= 1 && Math.abs(q - Math.round(q)) < 1e-9) return `${Math.round(q)}${u.id}`;
  }
  return String(n);
}
