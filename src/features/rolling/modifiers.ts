/**
 * Modifier math used by the legacy skills value type.
 *
 * The current modifier system lives in `core/influences.ts`: these same
 * formulas exist there as *user-editable* derivation building blocks
 * ("abilityMod", "profBonus") seeded into settings. The functions below are
 * kept for the record-based skills type and for older code paths.
 */

/** Ability score → modifier: floor((score − 10) / 2). */
export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

/** Level → proficiency bonus: +2 at level 1, +1 every 4 levels. */
export function levelProfBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

/** How a modifier is derived from the value of its source property. */
export type SourceMode = "value" | "abilityMod";

/** Apply a source mode to a raw property value. */
export function deriveModifier(mode: SourceMode | undefined, raw: number): number {
  return mode === "abilityMod" ? abilityMod(raw) : raw;
}

/**
 * Short tag for a modifying property, shown before the modifier
 * ("Dexterity" → "DEX"). Falls back to the full name for short keys.
 * @deprecated use `abbrFor` from `core/influences.ts` (honors overrides).
 */
export function sourceAbbr(key: string): string {
  const word = key.trim();
  return word.length > 3 ? word.slice(0, 3).toUpperCase() : word.toUpperCase();
}
