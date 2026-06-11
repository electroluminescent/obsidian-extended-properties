/**
 * D&D 5e rules data. Pure constants — the math lives in the rolling
 * module's `modifiers.ts` (shared "code pieces") and is re-exported here
 * for convenience.
 */

export { abilityMod, levelProfBonus as profBonus } from "../rolling/modifiers";

/** Legacy property keys (pre-record storage); used for one-click import. */
export const SAVE_PROF_KEY = "Saving Throw Proficiencies";
export const SKILL_PROF_KEY = "Skill Proficiencies";
export const LEVEL_KEY = "Level";
export const ABILITY_DEFAULT = 10;

/** Default property keys for the record-based skills entries. */
export const SAVES_KEY = "Saving Throws";
export const SKILLS_KEY = "Skills";

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
