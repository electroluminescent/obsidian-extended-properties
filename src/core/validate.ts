/**
 * Per-entry validation (roadmap C1). Pure - no Obsidian - so it is trivially
 * unit-testable and shared by every renderer and editor.
 *
 * Constraints live on the layout entry (per-sheet policy, not per-note data).
 * Validation warns by default; the UI may clamp numbers when `clamp` is set.
 * It never blocks saving - frontmatter stays freeform.
 */

export interface Constraints {
  /** A value must be present (non-empty). */
  required?: boolean;
  /** Numeric bounds, enforced for validation (not just as slider limits). */
  min?: number;
  max?: number;
  /** Clamp out-of-range numbers on commit instead of only warning. */
  clamp?: boolean;
  /** Regex the whole text / each list item must match. */
  pattern?: string;
  /** Allowed text / list values (case-insensitive). */
  allowed?: string[];
}

export type ValidityCode = "required" | "min" | "max" | "pattern" | "allowed";

export interface Validity {
  ok: boolean;
  code?: ValidityCode;
  /** The offending bound, for "min"/"max" messages. */
  bound?: number;
}

const OK: Validity = { ok: true };

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Value types validated as numbers. */
const NUMERIC = new Set(["number", "decimal", "formula", "derived", "unit", "rating"]);

/** Validate a frontmatter value against `c` for a value of `type`. */
export function validate(raw: unknown, c: Constraints | undefined, type: string): Validity {
  if (!c) return OK;
  if (isEmpty(raw)) return c.required ? { ok: false, code: "required" } : OK;

  if (NUMERIC.has(type)) {
    const n = Number(raw);
    if (Number.isFinite(n)) {
      if (c.min !== undefined && n < c.min) return { ok: false, code: "min", bound: c.min };
      if (c.max !== undefined && n > c.max) return { ok: false, code: "max", bound: c.max };
    }
    return OK;
  }

  // text / link / datetime / list - each string checked against pattern/allowed.
  const items = Array.isArray(raw) ? raw.map((x) => String(x)) : [String(raw)];
  let re: RegExp | null = null;
  if (c.pattern) {
    try {
      re = new RegExp(`^(?:${c.pattern})$`);
    } catch {
      re = null; // a broken pattern never fails validation
    }
  }
  const allow = c.allowed && c.allowed.length ? c.allowed.map((a) => a.toLowerCase()) : null;
  for (const item of items) {
    if (re && !re.test(item)) return { ok: false, code: "pattern" };
    if (allow && !allow.includes(item.toLowerCase())) return { ok: false, code: "allowed" };
  }
  return OK;
}

/** Clamp a number into the constraint range (used on commit when `clamp` is set). */
export function clampToConstraints(n: number, c: Constraints | undefined): number {
  if (!c) return n;
  let out = n;
  if (c.min !== undefined && out < c.min) out = c.min;
  if (c.max !== undefined && out > c.max) out = c.max;
  return out;
}

/** Whether a numeric commit should be clamped (clamp on, with at least one bound). */
export function shouldClamp(c: Constraints | undefined): boolean {
  return !!c?.clamp && (c.min !== undefined || c.max !== undefined);
}

/** True when the entry carries any active constraint. */
export function hasConstraints(c: Constraints | undefined): boolean {
  return !!c && (c.required === true || c.min !== undefined || c.max !== undefined ||
    !!c.pattern || (Array.isArray(c.allowed) && c.allowed.length > 0));
}
