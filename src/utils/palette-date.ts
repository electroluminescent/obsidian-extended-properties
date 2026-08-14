/**
 * Palette edges written as dates.
 *
 * A date property stores a calendar-independent integer (see `core/calendar`),
 * so a palette over dates is a palette over numbers and the colour engine
 * needs to know nothing about calendars. What it does need is for the person
 * editing it to type "3 June, 1312" rather than 487,{-}something - which is
 * this: the same text -> parts -> integer path the date field itself uses.
 *
 * Pure: calendars in, numbers out.
 */

import { encodeSerial, decodeSerial, formatDate, parseDateFlexible, type DateConfig } from "../core/calendar";

/** The number behind a date as the property writes it, or undefined. */
export function parseEdge(text: string, cfg: DateConfig): number | undefined {
  const v = text.trim();
  if (!v) return undefined;
  // A plain number is the stored value itself - useful when a palette is
  // shared with something that is not a date.
  if (/^-?\d+$/.test(v)) return Number(v);
  const parts = parseDateFlexible(v, cfg);
  return parts ? encodeSerial(parts, cfg) : undefined;
}

/** A stored number written back out in the property's own format. */
export function formatEdge(n: number | undefined, cfg: DateConfig): string {
  if (n === undefined || !Number.isFinite(n)) return "";
  const parts = decodeSerial(Math.round(n), cfg);
  return parts ? formatDate(parts, cfg) : String(n);
}
