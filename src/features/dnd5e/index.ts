/**
 * The D&D 5e feature module.
 *
 * Built entirely on the rolling module's generic pieces: its saving throws
 * and skills are *presets* (record sets + pre-configured entries) of the
 * generic "skills" value type, its roll buttons come from the shared roll
 * addon, and its math comes from the shared modifier helpers. This module
 * contributes only data and templates:
 *
 *   entry kind       computed values (proficiency bonus, initiative)
 *   skill presets    5e saving throws and the 18-skill list
 *   templates        Contents / Details / Vitals / Abilities / Saves / Skills
 *   layout preset    full character sheet (claimed as the default preset)
 *   migration        converts legacy "saves"/"skills" entry kinds into
 *                    skills-type property entries
 */

import type { EPSettings } from "../../core/model";
import type { FeatureContext, FeatureModule } from "../../core/registry";
import { computedKind } from "./entry-kinds";
import { characterPreset, dnd5eSkillsEntry, savesPreset, sectionTemplates, skillsPreset } from "./sections";
import { SAVES_KEY, SKILLS_KEY } from "./rules";
import { dndDe, dndEn } from "./strings";

export const dnd5eModule: FeatureModule = {
  id: "dnd5e",
  name: (i18n) => i18n.t("dnd.featureName"),
  description: (i18n) => i18n.t("dnd.featureDesc"),

  register(ctx: FeatureContext): void {
    ctx.i18n.register("en", dndEn);
    ctx.i18n.register("de", dndDe);

    ctx.registries.entryKinds.add(computedKind);
    ctx.registries.skillPresets.add(savesPreset);
    ctx.registries.skillPresets.add(skillsPreset);

    for (const tpl of sectionTemplates()) ctx.registries.sectionTemplates.add(tpl);
    ctx.registries.layoutPresets.add(characterPreset);
    // New note types start as character sheets while this module is enabled.
    ctx.registries.defaultPresetId = characterPreset.id;
  },

  /**
   * v2.0 layouts contained bespoke "saves"/"skills" entry kinds. Convert
   * them to skills-type property entries; appearance fields (alias, icon,
   * sizes, …) carry over via spread. Proficiencies stored in the legacy
   * list properties are imported when the user populates from a preset.
   */
  migrate(settings: EPSettings): boolean {
    let changed = false;
    for (const lk of Object.keys(settings.layouts)) {
      for (const section of settings.layouts[lk].sections) {
        section.entries = section.entries.map((e) => {
          if (e.kind !== "saves" && e.kind !== "skills") return e;
          changed = true;
          const fresh =
            e.kind === "saves"
              ? dnd5eSkillsEntry(SAVES_KEY, savesPreset.id)
              : dnd5eSkillsEntry(SKILLS_KEY, skillsPreset.id);
          // Keep id and appearance customizations; force the new identity.
          return { ...e, ...fresh, id: e.id, alias: e.alias };
        });
      }
    }
    return changed;
  },
};
