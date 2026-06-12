/**
 * Cluster addon attaching a roll button to numeric property entries
 * (including "derived" values). The rolled modifier is the entry's
 * influence sum from the core modifier system (`core/influences.ts`);
 * this addon only contributes the dice.
 *
 * Persisted entry fields (accessed via `ext<RollExt>`):
 *   roll   true = show the roll button (legacy "value"/"abilityMod"
 *          strings are migrated to influences in `index.ts`)
 *   dice   dice notation ("2d6"); unset = a single d20
 */

import { Setting } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, NumericAccess } from "../../core/registry";
import { ext } from "../../core/model";
import { modifierTotal, ModExt } from "../../core/influences";
import { MODIFIABLE_TYPE_IDS } from "../../ui/render/modifier-addon";
import { parseDiceOrDefault } from "../../utils/dice";
import { ROLL_SERVICE, RollService } from "./roll-service";
import { addDiceSettings } from "./dice-ui";

/** Entry fields persisted by this addon. */
export interface RollExt {
  roll?: boolean | string;
  dice?: string;
}

export const rollAddon: ClusterAddon = {
  id: "rolling.roll",

  appliesTo(ref: EntryRef): boolean {
    if (ref.entry.kind !== "prop") return false;
    if (!ext<RollExt>(ref.entry).roll) return false;
    return MODIFIABLE_TYPE_IDS.has(ref.view.resolveType(ref.entry));
  },

  needs(): ClusterNeeds {
    return { after: [{ id: "roll", cls: "ep-roll-cell" }] };
  },

  fillSlots(ctx: EntryRenderCtx, num: NumericAccess) {
    const view = ctx.view;
    const e = ext<RollExt>(ctx.entry);
    const slots: Record<string, (cell: HTMLElement) => void> = {};
    slots["roll"] = (cell) => {
      // The dice breakdown lives in the modifier badge / denotation cell
      // (between the modifier names and the modifier); the cell holds only
      // the button.
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
      btn.onclick = () =>
        view.hub
          .get(ROLL_SERVICE, () => new RollService(view.i18n))
          .roll(num.label, modifierTotal(view, ctx.entry), parseDiceOrDefault(e.dice));
    };
    return slots;
  },

  renderOptions(octx: OptionsCtx): void {
    const { view, entry, container: c, changed, redraw } = octx;
    if (entry.kind !== "prop" || !MODIFIABLE_TYPE_IDS.has(view.resolveType(entry))) return;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<RollExt & ModExt>(entry);
    c.createEl("h4", { text: t("roll.options.heading") });
    new Setting(c).setName(t("roll.options.rollButton")).setDesc(t("roll.options.rollButtonDesc")).addToggle((tg) => {
      tg.setValue(!!e.roll).onChange((v) => {
        e.roll = v || undefined;
        // Make the implicit "roll this value" explicit and editable:
        // a fresh roll button starts with the entry's own value as term.
        if (v && !(e.mods?.length) && e.rollOverride === undefined && view.resolveType(entry) !== "derived")
          e.mods = [{}];
        changed();
        redraw();
      });
    });
    if (e.roll) {
      addDiceSettings(c, view.i18n, {
        get: () => e.dice,
        set: (n) => {
          e.dice = n;
          changed();
        },
      });
    }
  },
};
