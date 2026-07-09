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
  return encodeSerial(parts, cfg);
}

// -- serial storage ---------------------------------------------------------
// Stored note values are calendar-independent integers ("date serials"):
// era block + day index under the property's system. The config is only the
// lens (decode -> parts -> format). When the system or era pool changes,
// translateSerial re-encodes a value so the INTERPRETED date - year, month,
// day, era - survives the change, clamped to the closest representable date
// when the new system is smaller.

/** One era occupies this span; day indexes stay within half of it. */
const ERA_SPAN = 2e10;
const ERA_HALF = 1e10;

/** Encode parts as a storable integer under the config's system and eras. */
export function encodeSerial(parts: DateParts, cfg: DateConfig): number {
  const sys = systemOf(cfg);
  const eras = cfg.eras ?? [];
  let eraIdx = 0;
  if (parts.era) {
    const i = eras.findIndex((e) => e.toLowerCase() === parts.era!.toLowerCase());
    eraIdx = i >= 0 ? i + 1 : eras.length + 1;
  }
  const d = (parts.year * sys.months + (parts.month - 1)) * sys.daysPerMonth + (parts.day - 1);
  const day = Math.max(-ERA_HALF + 1, Math.min(ERA_HALF - 1, d));
  return eraIdx * ERA_SPAN + day;
}

/**
 * Decode a stored integer back to parts under the config. Negative years
 * are fine (floor division); an era index beyond the pool (its era was
 * removed) decodes era-less.
 */
export function decodeSerial(serial: number, cfg: DateConfig): DateParts | null {
  if (!Number.isFinite(serial)) return null;
  const sys = systemOf(cfg);
  const eras = cfg.eras ?? [];
  const eraIdx = Math.round(serial / ERA_SPAN);
  const d = Math.round(serial - eraIdx * ERA_SPAN);
  const perYear = sys.months * sys.daysPerMonth;
  const year = Math.floor(d / perYear);
  const rem = d - year * perYear;
  const month = Math.floor(rem / sys.daysPerMonth) + 1;
  const day = (rem % sys.daysPerMonth) + 1;
  const parts: DateParts = { year, month, day };
  const era = eraIdx > 0 ? eras[eraIdx - 1] : undefined;
  if (era) parts.era = era;
  return parts;
}

/**
 * Re-encode a serial written under `before` so it means the same date under
 * `after`: decode with the old lens, clamp month/day into the new system,
 * keep the era when the new pool still has it (dropped otherwise), encode
 * with the new lens.
 */
export function translateSerial(serial: number, before: DateConfig, after: DateConfig): number {
  const p = decodeSerial(serial, before);
  if (!p) return serial;
  const sys = systemOf(after);
  const q: DateParts = {
    year: p.year,
    month: Math.min(Math.max(1, p.month), sys.months),
    day: Math.min(Math.max(1, p.day), sys.daysPerMonth),
  };
  if (p.era && (after.eras ?? []).some((e) => e.toLowerCase() === p.era!.toLowerCase())) q.era = p.era;
  return encodeSerial(q, after);
}

/** Parse-then-serial convenience; null when `text` doesn't fit the format. */
export function serialOf(text: string, cfg: DateConfig): number | null {
  const p = parseDate(text, cfg);
  return p ? dateSerial(p, cfg) : null;
}

// -- flexible input ----------------------------------------------------------

/** The format's Y/M/D order (missing tokens appended in Y, M, D order). */
export function tokenOrder(cfg: DateConfig): ("Y" | "M" | "D")[] {
  const out: ("Y" | "M" | "D")[] = [];
  for (const p of formatPieces(cfg.format)) {
    const k = p.token?.[0];
    if ((k === "Y" || k === "M" || k === "D") && !out.includes(k)) out.push(k);
  }
  for (const k of ["Y", "M", "D"] as const) if (!out.includes(k)) out.push(k);
  return out;
}

/** Validate ranges; returns the parts or null. */
function checked(parts: DateParts, sys: DateSystem): DateParts | null {
  if (parts.month < 1 || parts.month > sys.months) return null;
  if (parts.day < 1 || parts.day > sys.daysPerMonth) return null;
  return parts;
}

/**
 * Parse leniently: the configured format is tried first (and wins - it is
 * also the only path that can introduce a NEW era); after that, common
 * alternate shapes are accepted regardless of the configured separators
 * and order:
 *
 * - month names in any position, full or shortened ("Nov", "sept", any
 *   unambiguous prefix of 3+ letters), with day/year assigned from the
 *   remaining numbers (a number that can only be a year is the year;
 *   ties resolve by the format's D/Y order);
 * - all-numeric dates in the format's Y/M/D order, then ISO Y-M-D, then
 *   D-M-Y and M-D-Y as fallbacks, under any of -, /, ., space;
 * - an era from the pool as a trailing suffix (unknown suffixes are NOT
 *   guessed at here - only the strict format can grow the pool).
 */
export function parseDateFlexible(text: string, cfg: DateConfig): DateParts | null {
  const strict = parseDate(text, cfg);
  if (strict) return strict;
  const sys = systemOf(cfg);
  let s = text.trim();
  if (!s) return null;

  // Trailing era from the pool (longest first so "CE" can't eat "BCE").
  let era: string | undefined;
  for (const e of [...(cfg.eras ?? [])].sort((a, b) => b.length - a.length)) {
    const re = new RegExp("[\\s,.-]+" + esc(e) + "\\s*$", "i");
    if (re.test(s)) {
      era = e;
      s = s.replace(re, "");
      break;
    }
  }

  // Tokenize into words and numbers (any separator).
  const tokens = s.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const nums: number[] = [];
  const words: string[] = [];
  for (const t of tokens) {
    if (/^\d+$/.test(t)) nums.push(parseInt(t, 10));
    else words.push(t);
  }
  const order = tokenOrder(cfg);
  const withEra = (p: DateParts | null): DateParts | null => {
    if (p && era) p.era = era;
    return p;
  };

  if (words.length === 1) {
    // A month name (full, 3-letter short form, or unambiguous 3+ prefix).
    const w = words[0].toLowerCase();
    const hits: number[] = [];
    for (let m = 1; m <= sys.months; m++) {
      const n = monthName(sys, m).toLowerCase();
      if (n === w || n.slice(0, 3) === w || (w.length >= 3 && n.startsWith(w))) {
        if (!hits.includes(m)) hits.push(m);
      }
    }
    if (hits.length !== 1) return null;
    const month = hits[0];
    if (nums.length === 2) {
      const [a, b] = nums;
      const fitsA = a >= 1 && a <= sys.daysPerMonth;
      const fitsB = b >= 1 && b <= sys.daysPerMonth;
      if (fitsA && fitsB) {
        // Both could be the day: the format's D/Y order decides.
        const dayFirst = order.indexOf("D") < order.indexOf("Y");
        return withEra(checked({ year: dayFirst ? b : a, month, day: dayFirst ? a : b }, sys));
      }
      if (fitsA) return withEra(checked({ year: b, month, day: a }, sys));
      if (fitsB) return withEra(checked({ year: a, month, day: b }, sys));
      return null;
    }
    if (nums.length === 1 && nums[0] > sys.daysPerMonth) {
      // Unambiguously a year ("March 1024"); a lone fits-the-day number
      // stays rejected rather than silently guessing the year.
      return withEra(checked({ year: nums[0], month, day: 1 }, sys));
    }
    return null;
  }
  if (words.length > 1) return null;

  // All-numeric: the format's own order, then common fallbacks.
  if (nums.length === 3) {
    const tryOrder = (o: ("Y" | "M" | "D")[]): DateParts | null => {
      const p: DateParts = { year: 1, month: 1, day: 1 };
      o.forEach((k, i) => {
        if (k === "Y") p.year = nums[i];
        else if (k === "M") p.month = nums[i];
        else p.day = nums[i];
      });
      return checked(p, sys);
    };
    const orders: ("Y" | "M" | "D")[][] = [order, ["Y", "M", "D"], ["D", "M", "Y"], ["M", "D", "Y"]];
    for (const o of orders) {
      const p = tryOrder(o);
      if (p) return withEra(p);
    }
  }
  return null;
}

/** 1-based weekday of a date (day-of-era modulo the week length). */
export function weekday(parts: DateParts, cfg: DateConfig): number {
  const sys = systemOf(cfg);
  const days = (parts.year * sys.months + (parts.month - 1)) * sys.daysPerMonth + (parts.day - 1);
  return ((days % sys.daysPerWeek) + sys.daysPerWeek) % sys.daysPerWeek + 1;
}
