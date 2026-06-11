/**
 * The rolling feature module: dice, roll buttons, the roll log panel, and
 * the "skills" value type.
 *
 * Domain modules (e.g. dnd5e) build on these pieces — they register skill
 * presets and section templates that *use* the skills type rather than
 * shipping bespoke widgets. Disabling this module removes all rolling UI;
 * skills properties then render through the fallback type until re-enabled.
 */

import type { FeatureContext, FeatureModule } from "../../core/registry";
import { rollsKind } from "./rolls-panel";
import { rollAddon } from "./numeric-addon";
import { skillsType } from "./skills-type";
import { rollingDe, rollingEn } from "./strings";

export const rollingModule: FeatureModule = {
  id: "rolling",
  name: (i18n) => i18n.t("roll.featureName"),
  description: (i18n) => i18n.t("roll.featureDesc"),

  register(ctx: FeatureContext): void {
    ctx.i18n.register("en", rollingEn);
    ctx.i18n.register("de", rollingDe);
    ctx.registries.valueTypes.add(skillsType);
    ctx.registries.entryKinds.add(rollsKind);
    ctx.registries.clusterAddons.add(rollAddon);
  },
};
