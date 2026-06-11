/**
 * The "core" feature module: registers the built-in value types, entry
 * kinds, and the empty layout preset. Core registrations use the same
 * extension points as optional features — there is no privileged path.
 */

import type { FeatureContext } from "../../../core/registry";
import { LAYOUT_VERSION } from "../../../core/model";
import { textType } from "./text";
import { numberType, decimalType, formulaType } from "./numeric";
import { derivedType } from "./derived";
import { checkboxType, listType, colorType } from "./basic";
import { imageType, iframeType } from "./media";
import { modifierAddon } from "../modifier-addon";
import { propKind, blankKind, tocKind } from "../entry-kinds/core-kinds";

/** Register everything the core sidebar needs to function. */
export function registerCore(ctx: FeatureContext): void {
  const r = ctx.registries;
  // Value types (dropdown order).
  r.valueTypes.add(textType);
  r.valueTypes.add(numberType);
  r.valueTypes.add(decimalType);
  r.valueTypes.add(derivedType);
  r.valueTypes.add(listType);
  r.valueTypes.add(checkboxType);
  r.valueTypes.add(colorType);
  r.valueTypes.add(formulaType);
  r.valueTypes.add(imageType);
  r.valueTypes.add(iframeType);
  // Entry kinds.
  r.entryKinds.add(propKind);
  r.entryKinds.add(blankKind);
  r.entryKinds.add(tocKind);
  // The modifier system (influences, toggles, badge).
  r.clusterAddons.add(modifierAddon);
  // The identity derivation; user-defined blocks are added from settings.
  r.derivations.add({ id: "value", name: (i18n) => i18n.t("derive.value"), apply: (x) => x });
  // The minimal layout preset.
  r.layoutPresets.add({
    id: "empty",
    name: (i18n) => i18n.t("preset.empty"),
    build: () => ({ version: LAYOUT_VERSION, sections: [] }),
  });
}
