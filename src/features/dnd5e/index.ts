/**
 * The D&D 5e feature module.
 *
 * Contributes only data and templates built from generic pieces: saves,
 * skills, proficiency bonus and initiative are ordinary *derived* property
 * entries of the core influence engine (with the "abilityMod"/"profBonus"
 * derivation blocks from settings), roll buttons come from the rolling
 * module's addon, and the record presets feed the legacy skills type and
 * its conversion. There are no D&D-specific widgets left.
 */

import type { Entry, EPSettings } from "../../core/model";
import type { FeatureContext, FeatureModule } from "../../core/registry";
import {
  characterPreset, initiativeEntry, profBonusEntry, savesEntries, savesPreset,
  sectionTemplates, skillsEntries, skillsPreset,
} from "./sections";
import { dndEn } from "./strings";

export const dnd5eModule: FeatureModule = {
  id: "dnd5e",
  name: (i18n) => i18n.t("dnd.featureName"),
  description: (i18n) => i18n.t("dnd.featureDesc"),

  register(ctx: FeatureContext): void {
    ctx.i18n.register("en", dndEn);

    ctx.registries.skillPresets.add(savesPreset);
    ctx.registries.skillPresets.add(skillsPreset);

    for (const tpl of sectionTemplates()) ctx.registries.sectionTemplates.add(tpl);
    // Registered as an optional preset only — new types always start
    // empty; the user adds the template sections they want.
    ctx.registries.layoutPresets.add(characterPreset);
  },

  /**
   * Upgrade layouts written by older versions:
   *
   * - v2.0 "saves"/"skills" entry kinds become per-record derived property
   *   entries. Their proficiencies already live in the legacy list
   *   properties, which are exactly the toggle lists of the new entries,
   *   so per-note data survives unchanged.
   * - "computed" entries (proficiency / initiative) become the equivalent
   *   derived property entries; appearance fields carry over.
   *
   * v2.1 record-based skills *properties* keep working through the legacy
   * skills value type, which offers its own one-click conversion.
   */
  migrate(settings: EPSettings): boolean {
    let changed = false;
    for (const lk of Object.keys(settings.layouts)) {
      for (const section of settings.layouts[lk].sections) {
        const out: Entry[] = [];
        for (const e of section.entries) {
          if (e.kind === "saves") {
            changed = true;
            out.push(...savesEntries());
          } else if (e.kind === "skills") {
            changed = true;
            out.push(...skillsEntries());
          } else if (e.kind === "computed") {
            changed = true;
            const fresh =
              (e as Record<string, unknown>)["computed"] === "proficiency" ? profBonusEntry() : initiativeEntry();
            out.push({ ...e, ...fresh, id: e.id, alias: e.alias, computed: undefined } as Entry);
          } else {
            out.push(e);
          }
        }
        section.entries = out;
      }
    }
    return changed;
  },
};
