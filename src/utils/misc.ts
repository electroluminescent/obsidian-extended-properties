/**
 * Small, dependency-free helpers shared across the plugin.
 */

/** Clamp `n` into the inclusive range [min, max]. */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Format a number for display: integers as-is, floats rounded to 3 decimals. */
export function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000);
}

/** The vulgar fractions Unicode has a glyph for, by "numerator/denominator". */
const GLYPHS: Record<string, string> = {
  "1/2": "½",
  "1/3": "⅓", "2/3": "⅔",
  "1/4": "¼", "3/4": "¾",
  "1/5": "⅕", "2/5": "⅖", "3/5": "⅗", "4/5": "⅘",
  "1/6": "⅙", "5/6": "⅚",
  "1/7": "⅐",
  "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞",
  "1/9": "⅑",
  "1/10": "⅒",
};

/** Greatest common divisor, for putting a fraction in lowest terms. */
function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

/**
 * Format `n` as a fraction: the closest one whose denominator is at most
 * `maxDen`, in lowest terms, using the single glyph where Unicode has one
 * (1.5 -> "1½", 0.667 -> "⅔") and "a/b" where it does not.
 *
 * A value that lands on a whole number after rounding prints as that whole
 * number, so a fraction display never shows "2 0/8".
 */
export interface FractionFormat {
  /** Finest fraction to round to. Default 8. */
  max?: number;
  /** Write every fraction over `max` instead of reducing it. */
  keepDen?: boolean;
  /**
   * Write the denominator at all. Off gives `<whole><divider><numerator>`
   * with the suffix appended - 2.3" for two and three eighths - which only
   * reads if every numerator is over the same denominator, so the fraction is
   * left unreduced whatever `keepDen` says.
   */
  showDen?: boolean;
  /** What separates the whole number from the numerator. Default ".". */
  divider?: string;
  /** Written after the number. Default none. */
  suffix?: string;
}

export function fmtFraction(n: number, o: FractionFormat = {}): string {
  const suffix = o.suffix ?? "";
  if (!Number.isFinite(n)) return fmtNum(n) + suffix;
  const cap = Math.max(1, Math.min(64, Math.floor(o.max ?? 8) || 1));
  const showDen = o.showDen !== false;
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const whole = Math.floor(abs);
  const rest = abs - whole;
  // The nearest k/cap, then reduced: 6/8 is three quarters, not six eighths -
  // unless the denominator is being kept, where every fraction is written over
  // the same one, as a scale of eighths or sixteenths reads.
  let num = Math.round(rest * cap);
  let den = cap;
  if (num === 0) return sign + String(whole) + suffix;
  if (num === den) return sign + String(whole + 1) + suffix;
  const g = o.keepDen || !showDen ? 1 : gcd(num, den);
  num /= g;
  den /= g;
  if (!showDen) return sign + String(whole) + (o.divider ?? ".") + String(num) + suffix;
  const part = GLYPHS[`${num}/${den}`] ?? `${num}/${den}`;
  const glyph = part.length === 1;
  if (whole === 0) return sign + part + suffix;
  return sign + String(whole) + (glyph ? "" : " ") + part + suffix;
}

/** Format a signed modifier, e.g. `+3` / `-1`. */
export function fmtMod(m: number): string {
  return (m >= 0 ? "+" : "") + m;
}

/** Generate a short, collision-unlikely id for layout elements. */
export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Read a numeric value from a raw record, falling back to `def`. */
export function getNum(raw: Record<string, unknown>, key: string, def: number): number {
  const n = Number(raw?.[key]);
  return Number.isFinite(n) ? n : def;
}

/**
 * Coerce a frontmatter value to a number, or null when it isn't one:
 * plain numbers as-is; ISO dates (`YYYY-MM-DD`) as whole-day numbers; and the
 * leading number of a unit value (`"10 lb"` -> 10). Shared by the influence
 * engine and the vault index so references behave the same everywhere.
 */
export function parseNumeric(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const ms = Date.parse(s);
      if (Number.isFinite(ms)) return Math.floor(ms / 86400000);
    }
    const m = /^-?\d+(?:\.\d+)?/.exec(s);
    if (m) return Number(m[0]);
  }
  return null;
}

/** Case-insensitive own-key lookup on a raw record. */
export function getCI(raw: Record<string, unknown>, key: string): unknown {
  if (key in raw) return raw[key];
  const kl = key.toLowerCase();
  for (const k of Object.keys(raw)) if (k.toLowerCase() === kl) return raw[k];
  return undefined;
}

/** Read a string value from a raw record ("" when missing). */
export function getStr(raw: Record<string, unknown>, key: string): string {
  const v = raw?.[key];
  return v === undefined || v === null ? "" : String(v);
}

/** Read a list value from a raw record (scalars become 1-element lists). */
export function getList(raw: Record<string, unknown>, key: string): string[] {
  const v = raw?.[key];
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v === undefined || v === null || v === "") return [];
  return [String(v)];
}

/** Replace all of `target`'s own keys with the contents of a JSON snapshot.
 *  A corrupt snapshot leaves the target unchanged rather than throwing. */
export function restoreFromSnapshot(target: Record<string, unknown>, snapshot: string): void {
  let value: unknown;
  try {
    value = JSON.parse(snapshot);
  } catch {
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, value);
}

/**
 * The number a value cell is showing, or undefined where what it shows is not
 * simply a number.
 *
 * A slider mid-drag has written nothing to the note: the only place the value
 * under the reader's finger exists is the text in the cell, which is where
 * conditional formatting reads it from. A unit written after the number is
 * fine ("12 kg", "40%"); anything with a second number in it is not ("3/4",
 * "2 of 5"), because there is no telling which of them was meant.
 */
export function shownNumber(text: string): number | undefined {
  const m = /^\s*([+-]?[\d,]*\.?\d+)\s*([^\d]*)$/.exec(text);
  if (!m) return undefined;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}
