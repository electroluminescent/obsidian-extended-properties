/**
 * Custom-calendar engine for the "date" value type: format strings
 * (MM/DD/YYYY-style tokens), user-defined date systems (months per year,
 * days per month, days per week, month names) and era suffix pools.
 *
 * Dates are plain {era?, year, month, day} tuples; nothing here touches
 * JS `Date`, so fantasy calendars and the standard one share one code
 * path. Ordering is by `dateSerial`: eras order by their pool position
 * (define them oldest first), years/months/days ascend within an era.
 *
 * Zero Obsidian imports - unit-tested directly (tests/calendar.test.ts).
 */

/** A user-defined calendar. All counts are at least 1. */
export interface DateSystem {
  /** Months per year. */
  months: number;
  /** Days in every month. */
  daysPerMonth: number;
  /** Days in a week (informational; weekday = day-of-year modulo this). */
  daysPerWeek: number;
  /** Month names; positions past the array fall back to "Month N". */
  monthNames: string[];
}

/** Per-property (vault-shared) date configuration. */
export interface DateConfig {
  /** Display/parse format, e.g. "MM/DD/YYYY" or "D MMMM, Y E". */
  format: string;
  /** Custom calendar; unset = standard months/names. */
  system?: DateSystem;
  /** Era suffix pool (e.g. ["BCE", "CE"]), oldest first. */
  eras?: string[];
}

/** A parsed date. Month and day are 1-based. */
export interface DateParts {
  year: number;
  month: number;
  day: number;
  /** Era suffix as written (may be absent even when the pool isn't empty). */
  era?: string;
}

export const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

const STANDARD_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The standard system used when a property defines no custom calendar. */
export function standardSystem(): DateSystem {
  return { months: 12, daysPerMonth: 31, daysPerWeek: 7, monthNames: [...STANDARD_MONTHS] };
}

/** The effective system of a config, with all counts sanitized. */
export function systemOf(cfg: DateConfig): DateSystem {
  const s = cfg.system;
  if (!s) return standardSystem();
  return {
    months: Math.max(1, Math.floor(s.months) || 1),
    daysPerMonth: Math.max(1, Math.floor(s.daysPerMonth) || 1),
    daysPerWeek: Math.max(1, Math.floor(s.daysPerWeek) || 1),
    monthNames: s.monthNames ?? [],
  };
}

/** Name of 1-based month `m` under `sys` ("Month N" past the named ones). */
export function monthName(sys: DateSystem, m: number): string {
  return (sys.monthNames[m - 1] ?? "").trim() || `Month ${m}`;
}

/** Format tokens, longest first so "MMMM" wins over "MM". */
const TOKENS = ["YYYY", "MMMM", "MMM", "MM", "DD", "Y", "M", "D", "E"] as const;
type Token = (typeof TOKENS)[number];

interface FormatPiece {
  token?: Token;
  literal?: string;
}

/** Split a format string into tokens and literal runs. */
export function formatPieces(format: string): FormatPiece[] {
  const out: FormatPiece[] = [];
  let i = 0;
  const f = format || DEFAULT_DATE_FORMAT;
  while (i < f.length) {
    const tok = TOKENS.find((t) => f.startsWith(t, i));
    if (tok) {
      out.push({ token: tok });
      i += tok.length;
    } else {
      const last = out[out.length - 1];
      if (last?.literal !== undefined) last.literal += f[i];
      else out.push({ literal: f[i] });
      i++;
    }
  }
  return out;
}

/** Render `parts` under the config's format and system. */
export function formatDate(parts: DateParts, cfg: DateConfig): string {
  const sys = systemOf(cfg);
  const pad = (n: number, w: number): string => String(Math.abs(n)).padStart(w, "0");
  let pieces = formatPieces(cfg.format);
  // An absent era must not leave its separator dangling ("1372," / trailing
  // space): drop every E token and the literal right before it.
  if (!parts.era) {
    pieces = pieces.filter((p, i) => !(p.token === "E" || pieces[i + 1]?.token === "E"));
  }
  let out = "";
  for (const p of pieces) {
    if (p.literal !== undefined) {
      out += p.literal;
      continue;
    }
    switch (p.token) {
      case "YYYY": out += pad(parts.year, 4); break;
      case "Y": out += String(parts.year); break;
      case "MM": out += pad(parts.month, 2); break;
      case "M": out += String(parts.month); break;
      case "MMMM": out += monthName(sys, parts.month); break;
      case "MMM": out += monthName(sys, parts.month).slice(0, 3); break;
      case "DD": out += pad(parts.day, 2); break;
      case "D": out += String(parts.day); break;
      case "E": out += parts.era ?? ""; break;
    }
  }
  // An empty era leaves a dangling separator (e.g. "2024-03-01 ") - trim it.
  return out.trim();
}

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Parse `text` against the config's format. Numeric tokens accept any
 * digit count; month names match the system's names (or "Month N")
 * case-insensitively; `E` captures a trailing word which need not be in
 * the era pool yet (the editor offers to add new ones). Returns null when
 * the text does not fit the format or a part is out of range.
 */
export function parseDate(text: string, cfg: DateConfig): DateParts | null {
  const sys = systemOf(cfg);
  const pieces = formatPieces(cfg.format);
  let re = "^\\s*";
  const fields: Token[] = [];
  for (let pi = 0; pi < pieces.length; pi++) {
    const p = pieces[pi];
    if (p.literal !== undefined) {
      const lit = /^\s+$/.test(p.literal) ? "\\s+" : esc(p.literal);
      // The era is optional, so a separator right before an E token must be
      // optional WITH it: fold both into one group ("30 Ches, 1372" fits
      // "D MMMM, Y E" without the trailing separator).
      if (pieces[pi + 1]?.token === "E") {
        re += "(?:" + lit + "\\s*([^\\s\\d][^\\n]*?))?";
        fields.push("E");
        pi++; // the E token is consumed by this group
        continue;
      }
      // Whitespace runs match loosely so "1 March" fits "D  MMMM".
      re += lit;
      continue;
    }
    const tok = p.token as Token;
    fields.push(tok);
    if (tok === "MMMM" || tok === "MMM") {
      const names: string[] = [];
      for (let m = 1; m <= sys.months; m++) {
        const full = monthName(sys, m);
        names.push(esc(full));
        if (tok === "MMM") names.push(esc(full.slice(0, 3)));
      }
      // Longest alternative first so "Month 12" beats "Month 1".
      names.sort((a, b) => b.length - a.length);
      re += "(" + names.join("|") + ")";
    } else if (tok === "E") {
      re += "\\s*([^\\s\\d][^\\n]*?)?";
    } else {
      re += "(\\d+)";
    }
  }
  re += "\\s*$";
  const m = new RegExp(re, "i").exec(text);
  if (!m) return null;

  const parts: DateParts = { year: 1, month: 1, day: 1 };
  let sawYear = false, sawMonth = false, sawDay = false;
  for (let i = 0; i < fields.length; i++) {
    const raw = m[i + 1];
    const tok = fields[i];
    if (tok === "E") {
      const era = (raw ?? "").trim();
      if (era) parts.era = era;
      continue;
    }
    if (raw === undefined) return null;
    if (tok === "MMMM" || tok === "MMM") {
      const low = raw.toLowerCase();
      let found = 0;
      for (let mm = 1; mm <= sys.months; mm++) {
        const name = monthName(sys, mm);
        if (name.toLowerCase() === low || (tok === "MMM" && name.slice(0, 3).toLowerCase() === low)) {
          found = mm;
          break;
        }
      }
      if (!found) return null;
      parts.month = found;
      sawMonth = true;
    } else {
      const n = parseInt(raw, 10);
      if (!Number.isFinite(n)) return null;
      if (tok === "YYYY" || tok === "Y") { parts.year = n; sawYear = true; }
      else if (tok === "MM" || tok === "M") { parts.month = n; sawMonth = true; }
      else { parts.day = n; sawDay = true; }
    }
  }
  // Range checks for the parts the format actually captured.
  if (sawMonth && (parts.month < 1 || parts.month > sys.months)) return null;
  if (sawDay && (parts.day < 1 || parts.day > sys.daysPerMonth)) return null;
  if (!sawYear && !sawMonth && !sawDay) return null;
  return parts;
}

/**
 * Total order for plotting/sorting: eras order by pool position (unknown
 * eras sort after the pool, no-era first when a pool exists), then
 * year/month/day ascend. Not a real-world day count - custom systems make
 * that meaningless - just a monotonic ordinal.
 */
export function dateSerial(parts: DateParts, cfg: DateConfig): number {
  const sys = systemOf(cfg);
  const eras = cfg.eras ?? [];
  let eraIdx = 0;
  if (eras.length) {
    if (parts.era) {
      const i = eras.findIndex((e) => e.toLowerCase() === parts.era!.toLowerCase());
      eraIdx = i >= 0 ? i + 1 : eras.length + 1;
    }
  }
  const days = (parts.year * sys.months + (parts.month - 1)) * sys.daysPerMonth + (parts.day - 1);
  return eraIdx * 1e12 + days;
}

/** Parse-then-serial convenience; null when `text` doesn't fit the format. */
export function serialOf(text: string, cfg: DateConfig): number | null {
  const p = parseDate(text, cfg);
  return p ? dateSerial(p, cfg) : null;
}

/** 1-based weekday of a date (day-of-era modulo the week length). */
export function weekday(parts: DateParts, cfg: DateConfig): number {
  const sys = systemOf(cfg);
  const days = (parts.year * sys.months + (parts.month - 1)) * sys.daysPerMonth + (parts.day - 1);
  return ((days % sys.daysPerWeek) + sys.daysPerWeek) % sys.daysPerWeek + 1;
}
