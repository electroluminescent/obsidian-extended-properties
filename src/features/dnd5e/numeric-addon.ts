/**
 * Cluster addon attaching D&D roll controls to numeric property entries:
 * an optional modifier badge ("+3") and a roll button (d20 + modifier).
 *
 * Persisted entry fields (accessed via `ext<RollExt>`):
 *   roll         "abilityMod" (d20 + ability modifier) | "value" (d20 + value)
 *   rollSource   property whose value feeds the modifier (default: own key)
 *   rollOverride fixed modifier overriding the source
 *   showMod      render the modifier badge
 */

import { Setting } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, NumericAccess } from "../../core/registry";
import { ext } from "../../core/model";
import { fmtMod } from "../../utils/misc";
import { abilityMod } from "./rules";
import { ROLL_SERVICE, RollService } from "./roll-service";

export type RollKind = "value" | "abilityMod";

/** Entry fields persisted by this addon. */
export interface RollExt {
  roll?: RollKind;
  rollSource?: string;
  rollOverride?: number;
  showMod?: boolean;
}

const NUMERIC_IDS = new Set(["number", "decimal", "formula"]);

/** The effective roll modifier for an entry. */
function rollModifier(ref: EntryRef): number {
  const e = ext<RollExt>(ref.entry);
  if (e.rollOverride !== undefined) return e.rollOverride;
  const sourceKey = e.rollSource || (e.key as string);
  const source = ref.view.note.num(sourceKey, 0);
  return e.roll === "abilityMod" ? abilityMod(source) : source;
}

export const rollAddon: ClusterAddon = {
  id: "dnd5e.roll",

  appliesTo(ref: EntryRef): boolean {
    if (ref.entry.kind !== "prop") return false;
    if (!ext<RollExt>(ref.entry).roll) return false;
    return NUMERIC_IDS.has(ref.view.resolveType(ref.entry));
  },

  needs(ref: EntryRef): ClusterNeeds {
    const e = ext<RollExt>(ref.entry);
    return {
      before: e.showMod ? [{ id: "mod", cls: "ep-mod-badge" }] : [],
      after: [{ id: "roll", cls: "ep-roll-cell" }],
    };
  },

  fillSlots(ctx: EntryRenderCtx, num: NumericAccess) {
    const view = ctx.view;
    const e = ext<RollExt>(ctx.entry);
    const slots: Record<string, (cell: HTMLElement) => void> = {};
    if (e.showMod) {
      slots["mod"] = (cell) => {
        cell.setText(fmtMod(rollModifier(ctx)));
        view.registerUpdater(() => cell.setText(fmtMod(rollModifier(ctx))));
      };
    }
    slots["roll"] = (cell) => {
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("dnd.roll") });
      btn.onclick = () => {
        const label =
          e.roll === "abilityMod" ? view.i18n.t("dnd.checkLabel", { name: num.label }) : num.label;
        view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n)).roll(label, rollModifier(ctx));
      };
    };
    return slots;
  },

  /** Keep the badge live while a slider is dragged (value not committed yet). */
  onPreview(ctx, cells, value) {
    const e = ext<RollExt>(ctx.entry);
    if (!e.showMod || !cells["mod"]) return;
    // Only derive from the previewed value when the modifier follows this
    // entry's own value; otherwise the modifier is independent of the drag.
    if (e.rollOverride !== undefined || e.rollSource) return;
    cells["mod"].setText(fmtMod(e.roll === "abilityMod" ? abilityMod(value) : value));
  },

  renderOptions(octx: OptionsCtx): void {
    const { view, entry, container: c, changed, redraw } = octx;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<RollExt>(entry);
    new Setting(c).setName(t("dnd.options.rollButton")).addDropdown((d) => {
      d.addOption("none", t("dnd.options.rollNone"));
      d.addOption("abilityMod", t("dnd.options.rollAbilityMod"));
      d.addOption("value", t("dnd.options.rollValue"));
      d.setValue(e.roll ?? "none");
      d.onChange((v) => {
        e.roll = v === "none" ? undefined : (v as RollKind);
        e.showMod = v === "none" ? undefined : true;
        changed();
        redraw();
      });
    });
    const srcSet = new Setting(c).setName(t("dnd.options.rollSource")).setDesc(t("dnd.options.rollSourceDesc"));
    srcSet.addDropdown((d) => {
      d.addOption("", t("dnd.options.rollSourceSelf"));
      for (const cand of view.propCandidates(true)) d.addOption(cand.key, cand.key);
      d.setValue(e.rollSource || "");
      d.setDisabled(!e.roll);
      d.onChange((v) => {
        e.rollSource = v || undefined;
        changed();
      });
    });
    if (!e.roll) srcSet.settingEl.addClass("ep-disabled");
    const ovSet = new Setting(c).setName(t("dnd.options.rollOverride")).setDesc(t("dnd.options.rollOverrideDesc"));
    ovSet.addText((tx) => {
      tx.setDisabled(!e.roll);
      tx.setValue(e.rollOverride !== undefined ? String(e.rollOverride) : "").onChange((v) => {
        const n = Number(v);
        e.rollOverride = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
        changed();
      });
    });
    if (!e.roll) ovSet.settingEl.addClass("ep-disabled");
  },
};
