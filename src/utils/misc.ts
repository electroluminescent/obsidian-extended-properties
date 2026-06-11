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

/** Replace all of `target`'s own keys with the contents of a JSON snapshot. */
export function restoreFromSnapshot(target: Record<string, unknown>, snapshot: string): void {
  const value = JSON.parse(snapshot);
  for (const k of Object.keys(target)) delete target[k];
  Object.assign(target, value);
}
