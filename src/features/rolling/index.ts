/**
 * The rolling feature module: dice, roll buttons, the roll log panel, and
 * the removed "skills" value type (read-only fallback for old record data;
 * new layouts use sections of derived number properties instead - the
 * skills type offers a one-click conversion).
 *
 * Domain modules (e.g. dnd5e) build on these pieces. Disabling this module
 * removes all rolling UI; the modifier system itself lives in the core.
 */

import type { EPSettings } from "../../core/model";
import type { FeatureContext, FeatureModule } from "../../core/registry";
import type { Influence } from "../../core/influences";
import { genId } from "../../utils/misc";
import { rollsKind } from "./rolls-panel";
import { rollerKind } from "./roller";
import { rollAddon } from "./numeric-addon";
import { skillsType } from "./skills-type";
import { rollingEn } from "./strings";

export const rollingModule: FeatureModule = {
  id: "rolling",
  name: (i18n) => i18n.t("roll.featureName"),
  description: (i18n) => i18n.t("roll.featureDesc"),

  register(ctx: FeatureContext): void {
    ctx.i18n.register("en", rollingEn);
    ctx.registries.valueTypes.add(skillsType);
    ctx.registries.entryKinds.add(rollsKind);
    ctx.registries.entryKinds.add(rollerKind);
    ctx.registries.clusterAddons.add(rollAddon);
    // The dice roller is also offered as a section template: the roller in
    // the first column, the roll history beside it in the second.
    ctx.registries.sectionTemplates.add({
      id: "diceroller",
      name: (i18n) => i18n.t("roller.title"),
      build: (i18n) => ({
        id: "diceroller",
        title: i18n.t("roller.title"),
        columns: 2,
        layoutMode: "columns",
        collapsible: true,
        entries: [
          { id: genId(), kind: "diceroller" },
          { id: genId(), kind: "rolls" },
        ],
      }),
    });
  },

  /**
   * v2.x entries stored the modifier source as `roll: "value"|"abilityMod"`
   * plus `rollSource`. Convert that to an explicit influence list of the
   * core modifier system; `roll` becomes a plain on/off flag.
   */
  migrate(settings: EPSettings): boolean {
    let changed = false;
    for (const lk of Object.keys(settings.layouts)) {
      for (const section of settings.layouts[lk].sections) {
        for (const e of section.entries) {
          const x = e as Record<string, unknown>;
          if (x["roll"] !== "value" && x["roll"] !== "abilityMod") continue;
          changed = true;
          if (!Array.isArray(x["mods"])) {
            const inf: Influence = {};
            if (typeof x["rollSource"] === "string" && x["rollSource"]) inf.source = x["rollSource"];
            if (x["roll"] === "abilityMod") inf.mode = "abilityMod";
            x["mods"] = [inf];
          }
          x["roll"] = true;
          delete x["rollSource"];
        }
      }
    }
    return changed;
  },
};
