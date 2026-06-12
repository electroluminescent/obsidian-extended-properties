/**
 * "rolls" entry kind: the roll-mode switch (normal / advantage /
 * disadvantage) and the live result log, backed by the per-view
 * {@link RollService}.
 */

import type { EntryKindDef } from "../../core/registry";
import type { ViewCtx } from "../../core/context";
import { ROLL_SERVICE, RollMode, RollService } from "./roll-service";

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

    const modeWrap = ctx.extra.createDiv({ cls: "ep-mode" });
    modeWrap.setAttr("title", t("roll.modeHint"));
    const modes: { key: RollMode; label: string }[] = [
      { key: "disadvantage", label: t("roll.modeDisadvantage") },
      { key: "normal", label: t("roll.modeNormal") },
      { key: "advantage", label: t("roll.modeAdvantage") },
    ];
    const btns = new Map<RollMode, HTMLElement>();
    for (const m of modes) {
      const b = modeWrap.createEl("button", { text: m.label, cls: "ep-mode-btn" });
      btns.set(m.key, b);
      b.onclick = () => service.setMode(m.key);
    }
    const logEl = ctx.extra.createDiv({ cls: "ep-log" });

    const redraw = () => {
      for (const [k, b] of btns) b.toggleClass("is-active", service.mode === k);
      logEl.empty();
      if (service.log.length === 0) {
        logEl.createDiv({ cls: "ep-log-empty", text: t("roll.logEmpty") });
        return;
      }
      for (const e of service.log) {
        const row = logEl.createDiv({ cls: "ep-log-row" });
        if (e.tone === "crit") row.addClass("ep-crit");
        if (e.tone === "fail") row.addClass("ep-fail");
        row.setText(e.text);
      }
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
