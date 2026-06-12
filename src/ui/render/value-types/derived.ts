/**
 * "derived" value type — a read-only number computed by the influence
 * engine: the sum of its configured influences (`core/influences.ts`),
 * shown as a signed modifier. Replaces the former hard-coded "computed"
 * entries (proficiency, initiative) and the rows of the legacy skills
 * list: a skill is simply a derived property like
 * `DEX(mod) + Proficiency Bonus (toggled by "Skill Proficiencies")`.
 *
 * Cluster addons attach as usual, so the roll button and the toggle
 * checkboxes work the same way they do on plain numbers.
 */

import type { EntryRef, OptionsCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import { modifierTotal } from "../../../core/influences";
import { fmtMod } from "../../../utils/misc";
import { addonsFor, emptyFlags, mergeNeeds } from "../cluster";
import { paintDenotation, paintDice } from "../modifier-addon";

export const derivedType: ValueTypeDef = {
  id: "derived",
  name: (i18n) => i18n.t("type.derived"),

  clusterNeeds(ref: EntryRef) {
    const flags = emptyFlags();
    for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
    // The denotation (+ dice breakdown) sits directly before the value.
    flags.before.push({ id: "den", cls: "ep-den-cell" });
    return flags;
  },

  render(ctx) {
    const { view, entry } = ctx;
    const compute = () => modifierTotal(view, entry);
    const label = (entry.alias as string) || (entry.key as string) || "";

    const slots: Record<string, (cell: HTMLElement) => void> = {
      den: (cell) => {
        const paint = () => {
          cell.empty();
          paintDenotation(cell, view, entry);
          // Roll breakdown between the modifier names and the value.
          paintDice(cell, entry);
        };
        paint();
        view.registerUpdater(paint);
      },
    };
    for (const a of addonsFor(ctx)) Object.assign(slots, a.fillSlots(ctx, { get: compute, label }));

    const refs = view.buildCluster(ctx.head, ctx.flags, { display: fmtMod(compute()), slots });
    if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) refs.val.style.color = entry.valueColor as string;
    view.registerUpdater(() => refs.val.setText(fmtMod(compute())));
  },

  renderOptions(octx: OptionsCtx) {
    // Influence editor, roll settings, … — every addon may contribute.
    for (const a of octx.view.registries.clusterAddons.all()) a.renderOptions?.(octx);
  },
};
