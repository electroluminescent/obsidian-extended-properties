/**
 * "diceroller" entry kind: a freely assemblable dice interface (addable
 * like Contents, and available as a section template). The user builds a
 * chain of dice groups and flat additions, picks how many simultaneous
 * rolls to make and whether to roll with advantage or disadvantage, and
 * executes the chain through the shared {@link RollService} (animation,
 * log, notice — same as every roll button).
 *
 * The first dice group is the animated pool (advantage/disadvantage add
 * their extra die there); further dice groups and numbers join the roll
 * as labeled parts of the addition chain, rerolled fresh per roll.
 *
 * Persisted entry fields (via `ext<RollerExt>`):
 *   rollerSegs   chain segments: { dice: "2d6" } or { add: 3 }
 *   rollerTimes  number of simultaneous rolls (default 1)
 *   rollerMode   "advantage" | "disadvantage" (unset = normal)
 */

import { Menu, Notice } from "obsidian";
import type { EntryKindDef } from "../../core/registry";
import type { ViewCtx } from "../../core/context";
import { ext, type RollMacro } from "../../core/model";
import { genId } from "../../utils/misc";
import { ROLL_SERVICE, RollMode, RollService } from "./roll-service";
import { openDiceMenu } from "./dice-ui";
import { applicableMacros, runMacro, runRoll, segsToText } from "./macros";
import { TextPromptModal } from "../../ui/modals/dialogs";

/** One link of the user-assembled chain: a dice group or a flat number. */
export interface RollerSeg {
  dice?: string;
  add?: number;
}

/** Entry fields persisted by this kind. */
export interface RollerExt {
  rollerSegs?: RollerSeg[];
  rollerTimes?: number;
  rollerMode?: string;
}

function svc(view: ViewCtx): RollService {
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings, view.history, view.app));
}

export const rollerKind: EntryKindDef = {
  id: "diceroller",
  addable: true,
  defaultLabel: (i18n) => i18n.t("roller.title"),

  render(ctx) {
    const { view } = ctx;
    const t = view.i18n.t.bind(view.i18n);
    view.renderLabel(ctx.head, ctx);
    const e = ext<RollerExt>(ctx.entry);
    const wrap = ctx.extra.createDiv({ cls: "ep-roller" });

    const segs = (): RollerSeg[] => (Array.isArray(e.rollerSegs) ? e.rollerSegs : []);
    const save = () => view.saveLayout();

    // -- chain builder -----------------------------------------------------
    const chainEl = wrap.createDiv({ cls: "ep-roller-chain" });
    const drawChain = (): void => {
      chainEl.empty();
      const list = segs();
      list.forEach((seg, idx) => {
        if (idx > 0) chainEl.createSpan({ cls: "ep-roll-op", text: "+" });
        const chip = chainEl.createSpan({ cls: "ep-roller-chip" });
        chip.createSpan({ cls: "ep-roller-chiplab", text: seg.dice ?? String(seg.add ?? 0) });
        chip.setAttr("title", t("roller.chipHint"));
        chip.onclick = (ev) => {
          ev.stopPropagation();
          if (seg.dice !== undefined) {
            openDiceMenu(ev, view.app, view.i18n, {
              get: () => seg.dice,
              set: (n) => {
                seg.dice = n || "d20";
                save();
                drawChain();
              },
            });
          } else {
            // Inline number edit.
            chip.empty();
            const inp = chip.createEl("input", { cls: "ep-roller-numedit", type: "number" });
            inp.value = String(seg.add ?? 0);
            inp.focus();
            inp.select();
            const commit = () => {
              const v = Math.round(Number(inp.value));
              seg.add = Number.isFinite(v) ? v : 0;
              save();
              drawChain();
            };
            inp.onblur = commit;
            inp.onkeydown = (ke) => {
              if (ke.key === "Enter") inp.blur();
              if (ke.key === "Escape") drawChain();
            };
          }
        };
        const x = chip.createSpan({ cls: "ep-roller-x", text: "✕" });
        x.setAttr("title", t("roller.removeSeg"));
        x.onclick = (ev) => {
          ev.stopPropagation();
          const next = segs().slice();
          next.splice(idx, 1);
          e.rollerSegs = next.length ? next : undefined;
          save();
          drawChain();
        };
      });
      const addDie = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addDie") });
      addDie.onclick = (ev) =>
        openDiceMenu(ev, view.app, view.i18n, {
          get: () => undefined,
          set: (n) => {
            e.rollerSegs = [...segs(), { dice: n || "d20" }];
            save();
            drawChain();
          },
        });
      const addNum = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addNum") });
      addNum.onclick = () => {
        e.rollerSegs = [...segs(), { add: 0 }];
        save();
        drawChain();
      };
    };
    drawChain();

    // -- controls: mode, number of rolls, roll -------------------------------
    const ctl = wrap.createDiv({ cls: "ep-roller-controls" });
    const modeRow = ctl.createDiv({ cls: "ep-mode" });
    modeRow.setAttr("title", t("roll.modeHint"));
    const modes: { key: RollMode; label: string }[] = [
      { key: "disadvantage", label: t("roll.modeDisadvantage") },
      { key: "normal", label: t("roll.modeNormal") },
      { key: "advantage", label: t("roll.modeAdvantage") },
    ];
    const btns = new Map<RollMode, HTMLElement>();
    const curMode = (): RollMode =>
      e.rollerMode === "advantage" || e.rollerMode === "disadvantage" ? e.rollerMode : "normal";
    const paintMode = () => {
      for (const [k, b] of btns) b.toggleClass("is-active", curMode() === k);
    };
    for (const m of modes) {
      const b = modeRow.createEl("button", { text: m.label, cls: "ep-mode-btn" });
      btns.set(m.key, b);
      b.onclick = () => {
        e.rollerMode = m.key === "normal" ? undefined : m.key;
        save();
        paintMode();
      };
    }
    paintMode();

    const timesWrap = ctl.createSpan({ cls: "ep-roller-times" });
    timesWrap.createSpan({ text: t("roller.times") });
    const times = timesWrap.createEl("input", { type: "number" });
    times.min = "1";
    times.max = "20";
    times.value = String(e.rollerTimes ?? 1);
    times.onchange = () => {
      const v = Math.max(1, Math.min(20, Math.round(Number(times.value)) || 1));
      times.value = String(v);
      e.rollerTimes = v === 1 ? undefined : v;
      save();
    };

    const go = ctl.createEl("button", { cls: "ep-roll-btn ep-roller-go", text: t("roll.roll") });
    go.onclick = () => {
      const label = (ctx.entry as { alias?: string }).alias || t("roller.title");
      // The roller, a macro chip and a macro command all share one executor.
      runRoll(svc(view), view.i18n, { segs: segs(), mode: curMode(), times: e.rollerTimes ?? 1, label });
    };

    // -- saved macros ("custom roll objects") --------------------------------
    // Saved rolls applicable to this note type live right on the roll screen:
    // click to roll, right-click to load into the builder, rename or delete.
    const macrosEl = wrap.createDiv({ cls: "ep-macros" });
    const loadMacro = (m: RollMacro): void => {
      const next = (m.segs ?? []).map((s) => ({ ...s }));
      e.rollerSegs = next.length ? next : undefined;
      e.rollerMode = m.mode === "advantage" || m.mode === "disadvantage" ? m.mode : undefined;
      e.rollerTimes = m.times && m.times > 1 ? m.times : undefined;
      save();
      drawChain();
      paintMode();
      times.value = String(e.rollerTimes ?? 1);
    };
    const drawMacros = (): void => {
      macrosEl.empty();
      const list = applicableMacros(view.settings, view.activeTypeKey);
      if (list.length) {
        macrosEl.createSpan({ cls: "ep-macros-lbl", text: t("roller.macros") });
        for (const m of list) {
          const chip = macrosEl.createSpan({ cls: "ep-roller-chip ep-macro-chip" });
          chip.createSpan({ cls: "ep-roller-chiplab", text: m.name });
          chip.setAttr("title", segsToText(m.segs) || t("roller.macroRun"));
          chip.onclick = (ev) => {
            ev.stopPropagation();
            runMacro(svc(view), view.i18n, m);
          };
          chip.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const menu = new Menu();
            menu.addItem((i) =>
              i.setTitle(t("roller.macroRun")).setIcon("dices").onClick(() => runMacro(svc(view), view.i18n, m))
            );
            menu.addItem((i) => i.setTitle(t("roller.macroLoad")).setIcon("download").onClick(() => loadMacro(m)));
            menu.addItem((i) =>
              i.setTitle(t("roller.macroRename")).setIcon("pencil").onClick(() =>
                new TextPromptModal(view.app, view.i18n, t("roller.macroRenamePrompt"), m.name, (v) => {
                  const nm = v.trim();
                  if (!nm) return;
                  m.name = nm;
                  save();
                  drawMacros();
                }).open()
              )
            );
            menu.addItem((i) =>
              i.setTitle(t("roller.macroDelete")).setIcon("trash").onClick(() => {
                view.settings.macros = (view.settings.macros ?? []).filter((x) => x.id !== m.id);
                save();
                drawMacros();
              })
            );
            menu.showAtMouseEvent(ev);
          };
        }
      }
      const saveBtn = macrosEl.createEl("button", { cls: "ep-roller-add", text: t("roller.saveMacro") });
      saveBtn.onclick = () => {
        if (!segs().some((s) => s.dice !== undefined)) {
          new Notice(t("roller.saveMacroEmpty"));
          return;
        }
        new TextPromptModal(view.app, view.i18n, t("roller.saveMacroPrompt"), "", (v) => {
          const nm = v.trim();
          if (!nm) return;
          const macro: RollMacro = {
            id: genId(),
            name: nm,
            segs: segs().map((s) => ({ ...s })),
            mode: curMode() === "normal" ? undefined : curMode(),
            times: e.rollerTimes && e.rollerTimes > 1 ? e.rollerTimes : undefined,
          };
          view.settings.macros = [...(view.settings.macros ?? []), macro];
          save();
          drawMacros();
          new Notice(t("roller.macroSaved", { name: nm }));
        }).open();
      };
    };
    drawMacros();
  },
};
