/**
 * Cluster addon attaching roll controls to numeric property entries: an
 * optional modifier badge (with the configured dice shown before the
 * modifier) and a roll button (dice pool + modifier).
 *
 * Persisted entry fields (accessed via `ext<RollExt>`):
 *   roll         "abilityMod" (dice + ability modifier) | "value" (dice + value)
 *   rollSource   property whose value feeds the modifier (default: own key)
 *   rollOverride fixed modifier overriding the source
 *   showMod      render the modifier badge
 *   dice         dice notation ("2d6"); unset = a single d20
 */

import { Setting } from "obsidian";
import type { EntryRef, EntryRenderCtx, OptionsCtx } from "../../core/context";
import type { ClusterAddon, ClusterNeeds, NumericAccess } from "../../core/registry";
import { ext } from "../../core/model";
import { fmtMod } from "../../utils/misc";
import { parseDiceOrDefault } from "../../utils/dice";
import { abilityMod, SourceMode } from "./modifiers";
import { ROLL_SERVICE, RollService } from "./roll-service";
import { addDiceSettings, renderDiceTag } from "./dice-ui";

/** Entry fields persisted by this addon. */
export interface RollExt {
  roll?: SourceMode;
  rollSource?: string;
  rollOverride?: number;
  showMod?: boolean;
  dice?: string;
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

/** Badge content: dice notation (when configured) before the modifier. */
function paintBadge(cell: HTMLElement, ref: EntryRef): void {
  const e = ext<RollExt>(ref.entry);
  cell.empty();
  renderDiceTag(cell, e.dice);
  cell.appendText(fmtMod(rollModifier(ref)));
}

export const rollAddon: ClusterAddon = {
  id: "rolling.roll",

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
        paintBadge(cell, ctx);
        view.registerUpdater(() => paintBadge(cell, ctx));
      };
    }
    slots["roll"] = (cell) => {
      const btn = cell.createEl("button", { cls: "ep-roll-btn", text: view.i18n.t("roll.roll") });
      btn.onclick = () => {
        const label =
          e.roll === "abilityMod" ? view.i18n.t("roll.checkLabel", { name: num.label }) : num.label;
        view.hub
          .get(ROLL_SERVICE, () => new RollService(view.i18n))
          .roll(label, rollModifier(ctx), parseDiceOrDefault(e.dice));
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
    const cell = cells["mod"];
    cell.empty();
    renderDiceTag(cell, e.dice);
    cell.appendText(fmtMod(e.roll === "abilityMod" ? abilityMod(value) : value));
  },

  renderOptions(octx: OptionsCtx): void {
    const { view, entry, container: c, changed, redraw } = octx;
    const t = view.i18n.t.bind(view.i18n);
    const e = ext<RollExt>(entry);
    new Setting(c).setName(t("roll.options.rollButton")).addDropdown((d) => {
      d.addOption("none", t("roll.options.rollNone"));
      d.addOption("abilityMod", t("roll.options.rollAbilityMod"));
      d.addOption("value", t("roll.options.rollValue"));
      d.setValue(e.roll ?? "none");
      d.onChange((v) => {
        e.roll = v === "none" ? undefined : (v as SourceMode);
        e.showMod = v === "none" ? undefined : true;
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
    const srcSet = new Setting(c).setName(t("roll.options.rollSource")).setDesc(t("roll.options.rollSourceDesc"));
    srcSet.addDropdown((d) => {
      d.addOption("", t("roll.options.rollSourceSelf"));
      for (const cand of view.propCandidates(true)) d.addOption(cand.key, cand.key);
      d.setValue(e.rollSource || "");
      d.setDisabled(!e.roll);
      d.onChange((v) => {
        e.rollSource = v || undefined;
        changed();
      });
    });
    if (!e.roll) srcSet.settingEl.addClass("ep-disabled");
    const ovSet = new Setting(c).setName(t("roll.options.rollOverride")).setDesc(t("roll.options.rollOverrideDesc"));
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
