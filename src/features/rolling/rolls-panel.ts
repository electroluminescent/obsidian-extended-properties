/**
 * "rolls" entry kind: the roll history panel.
 *
 * Renders the plugin-level, persistent {@link HistoryService} that every view
 * shares, so the log survives note switches and reloads. Toggles: the global
 * RNG system (random / karmic), the full roll chain vs. label & result, and
 * limiting the list to the current note. A clear action empties the history
 * (everything, or just the current note when the note filter is on). Clicking
 * an entry re-runs it while its re-roll closure is still in memory (this
 * session). Advantage/disadvantage is chosen per roll via right-click — there
 * is no global mode switch here.
 */

import type { EntryKindDef } from "../../core/registry";
import { ext } from "../../core/model";
import { ConfirmModal } from "../../ui/modals/dialogs";

/** Per-entry display state persisted via `ext`. */
interface RollsExt {
  rollsBrief?: boolean;
  rollsNoteOnly?: boolean;
}

export const rollsKind: EntryKindDef = {
  id: "rolls",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roll.rolls"),

  render(ctx) {
    const { view } = ctx;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx.head, ctx);
    const history = view.history;
    const e = ext<RollsExt>(ctx.entry);

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
    chainBtn.onclick = () => {
      e.rollsBrief = e.rollsBrief ? undefined : true;
      view.saveLayout();
      redraw();
    };
    // Limit the list to rolls made on the current note.
    const noteBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logNoteOnly") });
    noteBtn.setAttr("title", t("roll.logNoteOnlyHint"));
    noteBtn.onclick = () => {
      e.rollsNoteOnly = e.rollsNoteOnly ? undefined : true;
      view.saveLayout();
      redraw();
    };
    const clearBtn = tools.createEl("button", { cls: "ep-mode-btn", text: t("roll.logClear") });
    clearBtn.setAttr("title", t("roll.logClearHint"));
    clearBtn.onclick = () => {
      const noteOnly = !!e.rollsNoteOnly && !!view.note.path;
      new ConfirmModal(
        view.app,
        view.i18n,
        t(noteOnly ? "roll.logClearNoteConfirm" : "roll.logClearConfirm"),
        () => history.clear(noteOnly ? view.note.path : undefined)
      ).open();
    };

    const logEl = ctx.extra.createDiv({ cls: "ep-log" });

    const redraw = () => {
      rngBtn.setText(view.settings.karmicRolls ? t("roll.rngKarmic") : t("roll.rngRandom"));
      rngBtn.toggleClass("is-active", view.settings.karmicRolls === true);
      chainBtn.toggleClass("is-active", !e.rollsBrief);
      noteBtn.toggleClass("is-active", !!e.rollsNoteOnly);
      logEl.empty();
      const records = history.query({ note: e.rollsNoteOnly ? view.note.path : undefined });
      if (records.length === 0) {
        logEl.createDiv({ cls: "ep-log-empty", text: t("roll.logEmpty") });
        return;
      }
      for (const r of records) {
        const row = logEl.createDiv({ cls: "ep-log-row" });
        if (r.tone === "crit") row.addClass("ep-crit");
        if (r.tone === "fail") row.addClass("ep-fail");
        row.setText(e.rollsBrief ? r.brief ?? r.text : r.text);
        const redo = history.redoFor(r.id);
        if (redo) {
          row.addClass("ep-log-click");
          row.setAttr("title", t("roll.redoHint"));
          row.onclick = () => redo();
        }
      }
    };
    redraw();
    // Self-cleaning subscription: drop it once this DOM is replaced.
    const unsub = history.subscribe(() => {
      if (!logEl.isConnected) {
        unsub();
        return;
      }
      redraw();
    });
  },
};
