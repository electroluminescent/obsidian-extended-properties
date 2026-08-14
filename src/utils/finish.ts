/**
 * Which finish a value wears.
 *
 * A finish is the treatment laid over the colour - gloss, foil, cracked ice -
 * and a property carries a short list of rules saying who gets what: all of
 * them, particular values, or a band of numbers. Every rule is one somebody
 * wrote down; nothing is handed out at random.
 *
 * Pure: rules and a value in, an id out. What the ids look like is CSS, and
 * lives in `ui/render/finishes.ts`.
 */

import type { FinishRule } from "../core/model";

/** How a value reads for the purpose of matching a rule. */
function asText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return Array.isArray(value) ? value.map((v) => String(v)).join(", ") : String(value);
}

/**
 * A number for a value, stable across sessions and vaults: the same word
 * always draws the same finish out of a set, so a sheet does not reshuffle
 * itself every time it is opened.
 */
export function stableHash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Whether `rule` speaks for `value`. */
function matches(rule: FinishRule, value: unknown): boolean {
  const text = asText(value).trim();
  switch (rule.when) {
    case "all":
      return true;
    case "values":
      return (rule.values ?? []).some((v) => v.trim().toLowerCase() === text.toLowerCase());
    case "range": {
      const n = typeof value === "number" ? value : Number(text);
      if (!Number.isFinite(n)) return false;
      const from = rule.from ?? -Infinity;
      const to = rule.to ?? Infinity;
      return n >= Math.min(from, to) && n <= Math.max(from, to);
    }
    default:
      return false;
  }
}

/**
 * The finish a value wears, and the colour it wears instead of the palette's
 * where the rule names one. The first rule that speaks for the value wins, so
 * put the particular ones above the general.
 */
export function pickFinish(
  rules: FinishRule[] | undefined,
  value: unknown
): { finish: string; color?: string } | undefined {
  for (const rule of rules ?? []) {
    if (!rule.finish) continue;
    if (!matches(rule, value)) continue;
    return { finish: rule.finish, color: rule.color };
  }
  return undefined;
}
