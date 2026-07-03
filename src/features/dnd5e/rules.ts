/**
 * D&D 5e rules data. Pure constants - the math lives in the rolling
 * module's `modifiers.ts` (shared "code pieces") and is re-exported here
 * for convenience.
 */

export { abilityMod, levelProfBonus as profBonus } from "../rolling/modifiers";

/** Proficiency list properties - also the toggle lists of the new entries. */
export const SAVE_PROF_KEY = "Saving Throw Proficiencies";
export const SKILL_PROF_KEY = "Skill Proficiencies";
export const LEVEL_KEY = "Level";

/** Source properties referenced by the templates (real, editable entries). */
export const PROF_KEY = "Proficiency Bonus";
export const INIT_KEY = "Initiative";

export interface Ability { key: string; abbr: string }

export const ABILITIES: Ability[] = [
  { key: "Strength", abbr: "STR" },
  { key: "Dexterity", abbr: "DEX" },
  { key: "Constitution", abbr: "CON" },
  { key: "Intelligence", abbr: "INT" },
  { key: "Wisdom", abbr: "WIS" },
  { key: "Charisma", abbr: "CHA" },
];

export const SKILLS: { name: string; ability: string }[] = [
  { name: "Acrobatics", ability: "Dexterity" },
  { name: "Animal Handling", ability: "Wisdom" },
  { name: "Arcana", ability: "Intelligence" },
  { name: "Athletics", ability: "Strength" },
  { name: "Deception", ability: "Charisma" },
  { name: "History", ability: "Intelligence" },
  { name: "Insight", ability: "Wisdom" },
  { name: "Intimidation", ability: "Charisma" },
  { name: "Investigation", ability: "Intelligence" },
  { name: "Medicine", ability: "Wisdom" },
  { name: "Nature", ability: "Intelligence" },
  { name: "Perception", ability: "Wisdom" },
  { name: "Performance", ability: "Charisma" },
  { name: "Persuasion", ability: "Charisma" },
  { name: "Religion", ability: "Intelligence" },
  { name: "Sleight of Hand", ability: "Dexterity" },
  { name: "Stealth", ability: "Dexterity" },
  { name: "Survival", ability: "Wisdom" },
];
