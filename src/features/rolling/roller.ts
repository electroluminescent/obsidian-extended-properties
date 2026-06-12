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

import type { EntryKindDef } from "../../core/registry";
import type { ViewCtx } from "../../core/context";
import { ext } from "../../core/model";
import { formatDice, parseDiceOrDefault, rollPool } from "../../utils/dice";
import { ROLL_SERVICE, RollMode, RollPart, RollService } from "./roll-service";
import { openDiceMenu } from "./dice-ui";

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
  return view.hub.get(ROLL_SERVICE, () => new RollService(view.i18n, view.settings));
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
      const list = segs();
      const firstDice = list.find((s) => s.dice !== undefined);
      const spec = parseDiceOrDefault(firstDice?.dice);
      const label = (ctx.entry as { alias?: string }).alias || t("roller.title");
      const n = Math.max(1, Math.min(20, e.rollerTimes ?? 1));
      for (let i = 0; i < n; i++) {
        // Secondary dice groups reroll fresh for every simultaneous roll.
        const parts: RollPart[] = [];
        let modifier = 0;
        for (const s of list) {
          if (s === firstDice) continue;
          if (s.dice !== undefined) {
            const sub = parseDiceOrDefault(s.dice);
            const pool = rollPool(sub);
            parts.push({ label: formatDice(sub), value: pool.total });
            modifier += pool.total;
          } else if (typeof s.add === "number" && s.add !== 0) {
            parts.push({ label: t("roll.partMod"), value: s.add });
            modifier += s.add;
          }
        }
        svc(view).roll(n > 1 ? `${label} #${i + 1}` : label, modifier, spec, {
          parts,
          mode: curMode(),
          stay: n > 1,
        });
      }
    };
  },
};
