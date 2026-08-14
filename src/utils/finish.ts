/**
 * Which finish a value wears.
 *
 * A finish is the treatment laid over the colour - gloss, foil, cracked ice -
 * and a property carries a short list of rules saying who gets what: all of
 * them, particular values, a band of numbers, or one each for however many
 * distinct values there turn out to be.
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
    case "unique":
      return text !== "";
    default:
      return false;
  }
}

/** What a rule gives a value: one finish, or one from its set. */
function finishOf(rule: FinishRule, value: unknown): string {
  const set = rule.set ?? [];
  if (rule.when !== "unique" || !set.length) return rule.finish;
  return set[stableHash(asText(value)) % set.length];
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
    if (!rule.finish && !(rule.set ?? []).length) continue;
    if (!matches(rule, value)) continue;
    const finish = finishOf(rule, value);
    if (!finish) continue;
    return { finish, color: rule.color };
  }
  return undefined;
}
