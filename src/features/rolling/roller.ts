/**
 * "diceroller" entry kind: a freely assemblable dice interface (addable like
 * Contents, and available as a section template). Build a chain of dice
 * groups, numbers and property references — as chips or by typing a full
 * expression (`2d6kh1 + 1d8 + DEX + 3`) — pick how many simultaneous rolls to
 * make and advantage/disadvantage, then execute through the shared
 * {@link RollService} (animation, history, notice — same as every roll button).
 *
 * The chips and the expression field are two views of one {@link RollAst}:
 * editing either rewrites the other. Advantage/disadvantage add their extra
 * die to the first dice group. Saved macros ("custom roll objects") applicable
 * to the note type live on the same screen.
 *
 * Persisted entry fields (via `ext<RollerExt>`):
 *   rollerSegs   chain segments: { dice: "2d6kh1" } | { add: 3 } | { ref: "DEX" } (+ neg)
 *   rollerTimes  number of simultaneous rolls (default 1)
 *   rollerMode   "advantage" | "disadvantage" (unset = normal)
 */

import { Menu, Notice } from "obsidian";
import type { EntryKindDef } from "../../core/registry";
import type { ViewCtx } from "../../core/context";
import { ext, type RollMacro, type RollSeg } from "../../core/model";
import { genId } from "../../utils/misc";
import { parseDice } from "../../utils/dice";
import { referenceSuggestions } from "../../core/influences";
import { makeNoteAwareResolver } from "../../core/note-ref";
import { ROLL_SERVICE, RollMode, RollService } from "./roll-service";
import { openDiceMenu } from "./dice-ui";
import { applicableMacros, runMacro, runRoll, segsToText, textToSegs } from "./macros";
import { RefSuggest } from "../../ui/components/suggest";
import { TextPromptModal } from "../../ui/modals/dialogs";

/** One link of the user-assembled chain. */
export type RollerSeg = RollSeg;

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
    const setSegs = (next: RollerSeg[]): void => {
      e.rollerSegs = next.length ? next : undefined;
      save();
      drawChain();
    };
    const save = () => view.saveLayout();

    const chainEl = wrap.createDiv({ cls: "ep-roller-chain" });

    // -- free-text expression (round-trips with the chips) -------------------
    const exprRow = wrap.createDiv({ cls: "ep-roller-expr" });
    const exprInput = exprRow.createEl("input", { cls: "ep-edit-input ep-roller-exprinput", type: "text" });
    exprInput.setAttr("placeholder", t("roller.exprPlaceholder"));
    exprInput.setAttr("title", t("roller.exprHint"));
    const refreshExpr = (): void => {
      exprInput.value = segsToText(segs());
      exprInput.removeClass("ep-invalid");
    };
    const commitExpr = (): void => {
      const parsed = textToSegs(exprInput.value);
      if (!parsed) {
        exprInput.addClass("ep-invalid");
        return;
      }
      setSegs(parsed);
    };
    exprInput.onkeydown = (ke) => {
      if (ke.key === "Enter") {
        ke.preventDefault();
        commitExpr();
      } else if (ke.key === "Escape") {
        refreshExpr();
      }
    };
    exprInput.onblur = commitExpr;
    // Interchangeable name/short-form autocomplete for the identifier being typed.
    new RefSuggest(view.app, exprInput, () =>
      referenceSuggestions(view.settings, view.propCandidates(true).map((c) => c.key))
    );

    // -- function bar: insert dice-notation tokens at the caret ----------------
    const insertToken = (token: string): void => {
      const s = exprInput.selectionStart ?? exprInput.value.length;
      const eEnd = exprInput.selectionEnd ?? exprInput.value.length;
      exprInput.value = exprInput.value.slice(0, s) + token + exprInput.value.slice(eEnd);
      const pos = s + token.length;
      exprInput.focus();
      try {
        exprInput.setSelectionRange(pos, pos);
      } catch {
        /* unsupported */
      }
    };
    const fnBar = wrap.createDiv({ cls: "ep-roller-fns" });
    const fnBtn = (label: string, title: string, onClick: (ev: MouseEvent) => void): void => {
      const b = fnBar.createEl("button", { cls: "ep-roller-fn", text: label });
      b.setAttr("title", title);
      b.onmousedown = (ev) => ev.preventDefault(); // keep the expression field focused
      b.onclick = onClick;
    };
    fnBtn(t("roller.fnDie"), t("roller.fnDieHint"), (ev) =>
      openDiceMenu(ev, view.app, view.i18n, { get: () => undefined, set: (n) => insertToken(n || "d20") })
    );
    fnBtn("kh", t("roller.fnKeepHigh"), () => insertToken("kh1"));
    fnBtn("kl", t("roller.fnKeepLow"), () => insertToken("kl1"));
    fnBtn("!", t("roller.fnExplode"), () => insertToken("!"));
    fnBtn("r", t("roller.fnReroll"), () => insertToken("r1"));
    fnBtn("≥", t("roller.fnSuccess"), () => insertToken(">="));
    fnBtn("+", t("roller.fnPlus"), () => insertToken(" + "));

    /** Replace a chip with a one-field text editor; `apply(value)` decides what to keep. */
    const inlineChipText = (chip: HTMLElement, initial: string, apply: (value: string) => void): void => {
      chip.empty();
      const inp = chip.createEl("input", { cls: "ep-roller-textedit", type: "text" });
      inp.value = initial;
      inp.focus();
      inp.select();
      let done = false;
      const finish = (commit: boolean): void => {
        if (done) return;
        done = true;
        if (commit) apply(inp.value);
        else drawChain();
      };
      inp.onblur = () => finish(true);
      inp.onkeydown = (ke) => {
        if (ke.key === "Enter") {
          ke.preventDefault();
          finish(true);
        } else if (ke.key === "Escape") finish(false);
      };
    };

    // -- chain builder -------------------------------------------------------
    const drawChain = (): void => {
      chainEl.empty();
      const list = segs();
      list.forEach((seg, idx) => {
        if (idx > 0) chainEl.createSpan({ cls: "ep-roll-op", text: seg.neg ? "−" : "+" });
        else if (seg.neg) chainEl.createSpan({ cls: "ep-roll-op", text: "−" });
        const chip = chainEl.createSpan({ cls: "ep-roller-chip" });
        const label = seg.dice !== undefined ? seg.dice : seg.ref !== undefined ? seg.ref : String(seg.add ?? 0);
        chip.createSpan({ cls: "ep-roller-chiplab", text: label });
        chip.setAttr("title", t("roller.chipHint"));
        chip.onclick = (ev) => {
          ev.stopPropagation();
          if (seg.dice !== undefined) {
            if (parseDice(seg.dice)) {
              // Simple NdS — the preset dice menu.
              openDiceMenu(ev, view.app, view.i18n, {
                get: () => seg.dice,
                set: (n) => {
                  seg.dice = n || "d20";
                  save();
                  drawChain();
                },
              });
            } else {
              // Advanced notation (keep/drop, explode, …) — edit as text.
              inlineChipText(chip, seg.dice ?? "", (val) => {
                const parsed = textToSegs(val);
                if (parsed && parsed.length === 1 && parsed[0].dice) seg.dice = parsed[0].dice;
                save();
                drawChain();
              });
            }
          } else if (seg.ref !== undefined) {
            inlineChipText(chip, seg.ref, (val) => {
              const v = val.trim();
              if (v) seg.ref = v;
              save();
              drawChain();
            });
          } else {
            inlineChipText(chip, String(seg.add ?? 0), (val) => {
              const v = Math.round(Number(val));
              seg.add = Number.isFinite(v) ? v : 0;
              seg.neg = undefined;
              save();
              drawChain();
            });
          }
        };
        const x = chip.createSpan({ cls: "ep-roller-x", text: "✕" });
        x.setAttr("title", t("roller.removeSeg"));
        x.onclick = (ev) => {
          ev.stopPropagation();
          const next = segs().slice();
          next.splice(idx, 1);
          setSegs(next);
        };
      });
      const addDie = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addDie") });
      addDie.onclick = (ev) =>
        openDiceMenu(ev, view.app, view.i18n, {
          get: () => undefined,
          set: (n) => setSegs([...segs(), { dice: n || "d20" }]),
        });
      const addNum = chainEl.createEl("button", { cls: "ep-roller-add", text: t("roller.addNum") });
      addNum.onclick = () => setSegs([...segs(), { add: 0 }]);
      refreshExpr();
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
      runRoll(svc(view), view.i18n, {
        segs: segs(),
        mode: curMode(),
        times: e.rollerTimes ?? 1,
        label,
        resolve: makeNoteAwareResolver(view.app, view.settings, view.registries, view, view.note.path ?? ""),
      });
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
            runMacro(svc(view), view.i18n, m, makeNoteAwareResolver(view.app, view.settings, view.registries, view, view.note.path ?? ""));
          };
          chip.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const menu = new Menu();
            menu.addItem((i) =>
              i.setTitle(t("roller.macroRun")).setIcon("dices").onClick(() => runMacro(svc(view), view.i18n, m, makeNoteAwareResolver(view.app, view.settings, view.registries, view, view.note.path ?? "")))
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
