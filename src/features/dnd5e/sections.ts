/**
 * D&D section templates and the character layout preset.
 *
 * Saves and skills are *not* bespoke widgets: the templates create ordinary
 * property entries of the generic "skills" value type, pre-configured for
 * 5e (ability-modifier derivation, level-based proficiency bonus) and
 * pointing at the registered record presets.
 */

import type { I18n } from "../../i18n/i18n";
import type { LayoutPresetDef, SectionTemplateDef, SkillPresetDef } from "../../core/registry";
import { Entry, LAYOUT_VERSION, Section } from "../../core/model";
import { genId } from "../../utils/misc";
import { ABILITIES, SAVE_PROF_KEY, SAVES_KEY, SKILL_PROF_KEY, SKILLS, SKILLS_KEY } from "./rules";

/** Shorthand for a property entry. */
function prop(key: string, extra: Partial<Entry> = {}): Entry {
  return { id: genId(), kind: "prop", key, ...extra } as Entry;
}

/**
 * 5e configuration for a skills-type entry. Always visible (so the
 * populate button is reachable) and derived the d20 way.
 */
export function dnd5eSkillsEntry(key: string, preset: string): Entry {
  return prop(key, {
    dataType: "skills",
    skillsPreset: preset,
    skillMode: "abilityMod",
    profMode: "level",
    profSource: "Level",
    hideIfEmpty: false,
  });
}

// ---------------------------------------------------------------------------
// Skill record presets (registered into the skill-preset registry)
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
    sticky: true,
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
      prop("Level", { dataType: "number", min: 1, max: 20 }),
      { id: genId(), kind: "computed", computed: "proficiency" } as Entry,
      prop("Armor Class", { dataType: "number", min: 0, max: 40 }),
      prop("Speed", { dataType: "number", min: 0, max: 200 }),
      prop("Current HP", { dataType: "number", min: 0, max: 9999 }),
      prop("Max HP", { dataType: "number", min: 0, max: 9999 }),
      { id: genId(), kind: "computed", computed: "initiative" } as Entry,
    ],
  }),
  abilities: (i18n) => ({
    id: "abilities",
    title: i18n.t("dnd.tpl.abilities"),
    columns: 1,
    dividers: true,
    entries: ABILITIES.map((a) =>
      prop(a.key, { dataType: "number", slider: true, min: 1, max: 30, clamp: true, roll: "abilityMod", showMod: true })
    ),
  }),
  saves: (i18n) => ({
    id: "saves",
    title: i18n.t("dnd.savingThrows"),
    columns: 1,
    entries: [dnd5eSkillsEntry(SAVES_KEY, savesPreset.id)],
  }),
  skills: (i18n) => ({
    id: "skills",
    title: i18n.t("dnd.skills"),
    columns: 1,
    entries: [dnd5eSkillsEntry(SKILLS_KEY, skillsPreset.id)],
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

export function sectionTemplates(): SectionTemplateDef[] {
  return TEMPLATE_ORDER.map((id) => ({
    id,
    name: (i18n: I18n) => i18n.t(TEMPLATE_NAMES[id]),
    build: (i18n: I18n) => builders[id](i18n),
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
