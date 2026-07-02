/**
 * D&D section templates and the character layout preset.
 *
 * Nothing here is a bespoke widget and nothing is computed by hidden rules:
 * every value is an ordinary property entry, and every derived number
 * (proficiency bonus, initiative, saves, skills) is a "derived" entry whose
 * influences reference *real source properties* by name — Level feeds the
 * proficiency bonus, abilities feed saves and skills, and proficiency is a
 * togglable influence backed by the classic list properties
 * ("Saving Throw Proficiencies" / "Skill Proficiencies").
 *
 * Templates declare their source entries via `SectionTemplateDef.sources`,
 * so adding e.g. only the Skills template also adds any missing ability
 * scores and the Proficiency Bonus property to refer to.
 */

import type { I18n } from "../../i18n/i18n";
import type { LayoutPresetDef, SectionTemplateDef, SkillPresetDef } from "../../core/registry";
import type { Influence } from "../../core/influences";
import { Entry, LAYOUT_VERSION, Section } from "../../core/model";
import { genId } from "../../utils/misc";
import {
  ABILITIES, INIT_KEY, LEVEL_KEY, PROF_KEY, SAVE_PROF_KEY, SKILL_PROF_KEY, SKILLS,
} from "./rules";

/** Shorthand for a property entry. */
function prop(key: string, extra: Partial<Entry> = {}): Entry {
  return { id: genId(), kind: "prop", key, ...extra } as Entry;
}

/** Shorthand for a derived (computed) property entry. */
function derived(key: string, mods: Influence[], extra: Partial<Entry> = {}): Entry {
  return prop(key, { dataType: "derived", hideIfEmpty: false, mods, ...extra });
}

// -- the shared building-block entries ---------------------------------------

/** Proficiency bonus: a derived property fed by Level. */
export function profBonusEntry(): Entry {
  return derived(PROF_KEY, [{ source: LEVEL_KEY, mode: "profBonus" }]);
}

/** Initiative: a derived property fed by the Dexterity modifier. */
export function initiativeEntry(): Entry {
  return derived(INIT_KEY, [{ source: "Dexterity", mode: "abilityMod" }], { roll: true });
}

/** One saving throw: ability modifier + togglable proficiency. */
export function saveEntry(ability: string): Entry {
  return derived(
    `${ability} Save`,
    [
      { source: ability, mode: "abilityMod" },
      { source: PROF_KEY, toggle: SAVE_PROF_KEY },
    ],
    { roll: true, alias: ability }
  );
}

/** One skill: ability modifier + togglable proficiency. */
export function skillEntry(name: string, ability: string): Entry {
  return derived(
    name,
    [
      { source: ability, mode: "abilityMod" },
      { source: PROF_KEY, toggle: SKILL_PROF_KEY },
    ],
    { roll: true }
  );
}

export function savesEntries(): Entry[] {
  return ABILITIES.map((a) => saveEntry(a.key));
}

export function skillsEntries(): Entry[] {
  return SKILLS.map((s) => skillEntry(s.name, s.ability));
}

/** Ability-score number entry (slider, badge with the ability modifier). */
function abilityEntry(key: string): Entry {
  return prop(key, {
    dataType: "number",
    slider: true,
    min: 1,
    max: 30,
    clamp: true,
    roll: true,
    showMod: true,
    mods: [{ mode: "abilityMod" }],
  });
}

/** Source entries shared by the saves/skills templates. */
function rollSources(): Entry[] {
  return [profBonusEntry(), ...ABILITIES.map((a) => prop(a.key, { dataType: "number" }))];
}

// ---------------------------------------------------------------------------
// Skill record presets (for the legacy "skills" value type & conversions)
// ---------------------------------------------------------------------------

export const savesPreset: SkillPresetDef = {
  id: "dnd5e-saves",
  name: (i18n) => i18n.t("dnd.savingThrows"),
  records: () => ABILITIES.map((a) => ({ name: a.key, source: a.key })),
  legacyProfKey: SAVE_PROF_KEY,
};

export const skillsPreset: SkillPresetDef = {
  id: "dnd5e-skills",
  name: (i18n) => i18n.t("dnd.skills"),
  records: () => SKILLS.map((s) => ({ name: s.name, source: s.ability })),
  legacyProfKey: SKILL_PROF_KEY,
};

// ---------------------------------------------------------------------------
// Section templates
// ---------------------------------------------------------------------------

/**
 * Template builders, keyed by their stable section id. Ids are persisted in
 * layouts, which is what makes "reset this template section" possible.
 */
const builders: Record<string, (i18n: I18n) => Section> = {
  rolls: (i18n) => ({
    id: "rolls",
    title: i18n.t("dnd.tpl.contents"),
    columns: 2,
    layoutMode: "columns",
    pin: "header",
    collapsible: true,
    entries: [{ id: genId(), kind: "toc" }, { id: genId(), kind: "rolls" }],
  }),
  details: (i18n) => ({
    id: "details",
    title: i18n.t("dnd.tpl.details"),
    columns: 1,
    dividers: true,
    entries: [prop("Class"), prop("Subclass"), prop("Race"), prop("Background"), prop("Alignment")],
  }),
  vitals: (i18n) => ({
    id: "vitals",
    title: i18n.t("dnd.tpl.vitals"),
    columns: 2,
    layoutMode: "columns",
    dividers: true,
    entries: [
      prop(LEVEL_KEY, { dataType: "number", min: 1, max: 20 }),
      profBonusEntry(),
      prop("Armor Class", { dataType: "number", min: 0, max: 40 }),
      prop("Speed", { dataType: "number", min: 0, max: 200 }),
      prop("Current HP", { dataType: "number", min: 0, max: 9999 }),
      prop("Max HP", { dataType: "number", min: 0, max: 9999 }),
      initiativeEntry(),
    ],
  }),
  abilities: (i18n) => ({
    id: "abilities",
    title: i18n.t("dnd.tpl.abilities"),
    columns: 1,
    dividers: true,
    entries: ABILITIES.map((a) => abilityEntry(a.key)),
  }),
  saves: (i18n) => ({
    id: "saves",
    title: i18n.t("dnd.savingThrows"),
    columns: 1,
    dividers: true,
    entries: savesEntries(),
  }),
  skills: (i18n) => ({
    id: "skills",
    title: i18n.t("dnd.skills"),
    columns: 1,
    dividers: true,
    entries: skillsEntries(),
  }),
};

/** Template order shown in the toolbar (matches the preset layout order). */
const TEMPLATE_ORDER = ["rolls", "details", "vitals", "abilities", "saves", "skills"];

const TEMPLATE_NAMES: Record<string, string> = {
  rolls: "dnd.tpl.contents",
  details: "dnd.tpl.details",
  vitals: "dnd.tpl.vitals",
  abilities: "dnd.tpl.abilities",
  saves: "dnd.savingThrows",
  skills: "dnd.skills",
};

/** Templates whose influences rely on the shared source entries. */
const NEEDS_SOURCES = new Set(["vitals", "saves", "skills"]);

export function sectionTemplates(): SectionTemplateDef[] {
  return TEMPLATE_ORDER.map((id) => ({
    id,
    name: (i18n: I18n) => i18n.t(TEMPLATE_NAMES[id]),
    build: (i18n: I18n) => builders[id](i18n),
    sources: NEEDS_SOURCES.has(id) ? () => rollSources() : undefined,
  }));
}

/** Full character-sheet layout: every template, in order. */
export const characterPreset: LayoutPresetDef = {
  id: "dnd5e-character",
  name: (i18n) => i18n.t("dnd.presetName"),
  build: (i18n) => ({
    version: LAYOUT_VERSION,
    sections: TEMPLATE_ORDER.map((id) => builders[id](i18n)),
  }),
};
