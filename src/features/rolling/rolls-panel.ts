/**
 * "rolls" entry kind: the live roll history, backed by the per-view
 * {@link RollService}. Clicking an entry re-runs the roll that produced
 * it; a toggle switches between the full roll chain and label & result.
 * (Advantage/disadvantage is chosen per roll via right-click — there is
 * no global mode switch here.)
 */

import type { EntryKindDef } from "../../core/registry";
import type { ViewCtx } from "../../core/context";
import { ext } from "../../core/model";
import { ROLL_SERVICE, RollService } from "./roll-service";

function rollService(view: ViewCtx): RollService {
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings));
}

export const rollsKind: EntryKindDef = {
  id: "rolls",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roll.rolls"),

  render(ctx) {
    const { view } = ctx;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx.head, ctx);
    const service = rollService(view);
    const e = ext<{ rollsBrief?: boolean }>(ctx.entry);

    const tools = ctx.extra.createDiv({ cls: "ep-log-tools" });
    // Global RNG system: pure random vs adaptive ("karmic") luck debt.
    const rngBtn = tools.createEl("button", { cls: "ep-mode-btn" });
    rngBtn.setAttr("title", t("roll.rngHint"));
    rngBtn.onclick = () => {
      view.settings.karmicRolls = view.settings.karmicRolls ? undefined : true;
      view.saveLayout();
      redraw();
    };
    const chainBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logChains") });
    chainBtn.setAttr("title", t("roll.logChainsHint"));
    const logEl = ctx.extra.createDiv({ cls: "ep-log" });

    const redraw = () => {
      rngBtn.setText(view.settings.karmicRolls ? t("roll.rngKarmic") : t("roll.rngRandom"));
      rngBtn.toggleClass("is-active", view.settings.karmicRolls === true);
      chainBtn.toggleClass("is-active", !e.rollsBrief);
      logEl.empty();
      if (service.log.length === 0) {
        logEl.createDiv({ cls: "ep-log-empty", text: t("roll.logEmpty") });
        return;
      }
      for (const en of service.log) {
        const row = logEl.createDiv({ cls: "ep-log-row" });
        if (en.tone === "crit") row.addClass("ep-crit");
        if (en.tone === "fail") row.addClass("ep-fail");
        row.setText(e.rollsBrief ? en.brief ?? en.text : en.text);
        if (en.redo) {
          row.addClass("ep-log-click");
          row.setAttr("title", t("roll.redoHint"));
          row.onclick = () => en.redo?.();
        }
      }
    };
    chainBtn.onclick = () => {
      e.rollsBrief = e.rollsBrief ? undefined : true;
      view.saveLayout();
      redraw();
    };
    redraw();
    // Self-cleaning subscription: drop it once this DOM is replaced.
    const unsub = service.subscribe(() => {
      if (!logEl.isConnected) {
        unsub();
        return;
      }
      redraw();
    });
  },
};
