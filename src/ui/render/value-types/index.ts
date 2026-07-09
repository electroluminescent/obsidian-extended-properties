/**
 * The "core" feature module: registers the built-in value types, entry
 * kinds, and the empty layout preset. Core registrations use the same
 * extension points as optional features - there is no privileged path.
 */

import type { FeatureContext } from "../../../core/registry";
import { LAYOUT_VERSION } from "../../../core/model";
import { textType } from "./text";
import { numberType, decimalType, formulaType } from "./numeric";
import { derivedType } from "./derived";
import { checkboxType, listType, colorType } from "./basic";
import { audioType, iframeType, imageType, pdfType, videoType } from "./media";
import { ratingType, linkType, unitType, datetimeType } from "./richer";
import { dateType } from "./date";
import { modifierAddon } from "../modifier-addon";
import { propKind, blankKind, tocKind } from "../entry-kinds/core-kinds";
import type { EPSettings } from "../../../core/model";
import { featureOn } from "../../../core/features";

/**
 * Register everything the core sidebar needs to function. Optional value
 * types and the modifier system honor the per-feature toggles in
 * `settings.features` (see `core/features.ts`); text and number are the
 * foundation (fallback renderer, numeric systems) and always register.
 * Properties of a disabled type keep their data and render as plain text.
 */
export function registerCore(ctx: FeatureContext, settings: EPSettings): void {
  const r = ctx.registries;
  const on = (id: string): boolean => featureOn(settings, id);
  // Value types (dropdown order).
  r.valueTypes.add(textType);
  r.valueTypes.add(numberType);
  if (on("decimal")) r.valueTypes.add(decimalType);
  if (on("derived")) r.valueTypes.add(derivedType);
  if (on("list")) r.valueTypes.add(listType);
  if (on("checkbox")) r.valueTypes.add(checkboxType);
  if (on("color")) r.valueTypes.add(colorType);
  if (on("formula")) r.valueTypes.add(formulaType);
  if (on("image")) r.valueTypes.add(imageType);
  if (on("media")) {
    r.valueTypes.add(audioType);
    r.valueTypes.add(videoType);
    r.valueTypes.add(pdfType);
  }
  if (on("iframe")) r.valueTypes.add(iframeType);
  if (on("rating")) r.valueTypes.add(ratingType);
  if (on("link")) r.valueTypes.add(linkType);
  if (on("unit")) r.valueTypes.add(unitType);
  if (on("datetime")) r.valueTypes.add(datetimeType);
  if (on("date")) r.valueTypes.add(dateType);
  // Entry kinds.
  r.entryKinds.add(propKind);
  r.entryKinds.add(blankKind);
  r.entryKinds.add(tocKind);
  // The modifier system (influences, toggles, badge) travels with the
  // derived-values feature: one switch for the whole derivation system.
  if (on("derived")) r.clusterAddons.add(modifierAddon);
  // The identity derivation; user-defined blocks are added from settings.
  r.derivations.add({ id: "value", name: (i18n) => i18n.t("derive.value"), apply: (x) => x });
  // The minimal layout preset.
  r.layoutPresets.add({
    id: "empty",
    name: (i18n) => i18n.t("preset.empty"),
    build: () => ({ version: LAYOUT_VERSION, sections: [] }),
  });
}
