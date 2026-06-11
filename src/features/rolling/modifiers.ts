/**
 * Modifier math used by roll-enabled values and the skills value type.
 *
 * The formulas follow d20-system conventions (D&D 5e, Pathfinder, …) but are
 * deliberately kept here in the generic rolling module: domain modules (like
 * dnd5e) build presets on top of them, fulfilling "presets are built from
 * the same code pieces".
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
 */
export function sourceAbbr(key: string): string {
  const word = key.trim();
  return word.length > 3 ? word.slice(0, 3).toUpperCase() : word.toUpperCase();
}
