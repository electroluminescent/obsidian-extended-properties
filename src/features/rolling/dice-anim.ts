/**
 * The dice-roll animation.
 *
 * Rolls render as cards on a shared, non-blocking layer, so several rolls
 * (e.g. a right-click multi-roll) can resolve side by side. In each card
 * the dice (their isometric icons, dimmed under the value) tumble in 3D
 * while faces cycle a configurable number of times; the dice then settle
 * **one after another**, each appending its value to an addition chain.
 * After the dice, every modifier part slides into the chain in turn, and
 * the total pops last. Every value in the chain carries a small label of
 * what it came from (the die, the modifier's short form, the total).
 *
 * Advantage/disadvantage pools carry one extra die; the dropped (ignored)
 * die still settles, but dims in the dice row and joins the chain struck
 * through, excluded from the sum.
 *
 * Clicking a card toggles keeping it on screen; the plugin setting decides
 * the default (auto-dismiss vs stay). Right-clicking a card offers copy
 * value / copy chain / reroll / dismiss; the layer carries a dismiss-all
 * button while any card is up. The caller's `done` (log + notice) fires
 * exactly when the roll resolves, regardless of pinning.
 *
 * Honors `prefers-reduced-motion` by resolving instantly.
 */

import { Menu, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { DiceSpec } from "../../utils/dice";
import { formatDice } from "../../utils/dice";
import { diceIconId } from "../../ui/render/dice-icons";
import { fmtMod } from "../../utils/misc";

/** Visual cap — huge pools still roll, but only this many dice render. */
const MAX_DICE_SHOWN = 12;
/** Milliseconds between face cycles while tumbling. */
const TICK_MS = 80;
/** Stagger between one die settling and the next. */
const SETTLE_MS = 240;
/** Stagger between modifier parts joining the chain. */
const PART_MS = 280;

/** One labeled summand of a roll (a modifier term, the override, …). */
export interface RollPart {
  label: string;
  value: number;
}

export interface RollAnimJob {
  /** Headline above the dice (roll label incl. adv/dis tag). */
  label: string;
  spec: DiceSpec;
  /** Final face per die — includes the extra advantage/disadvantage die. */
  faces: number[];
  /** Index into `faces` of the dropped (ignored) die, or −1 for none. */
  dropIndex: number;
  /** Labeled modifier parts (their values sum to the total modifier). */
  parts: RollPart[];
  total: number;
  /** How many times the faces cycle before settling. */
  spins: number;
  /** Keep the card on screen after resolving (clicking always toggles). */
  stay: boolean;
  /** Re-run the roll that produced this card ("reroll" in the menu). */
  reroll?: () => void;
}

let layer: HTMLElement | null = null;
/** Close handlers of all live cards, for the dismiss-all button. */
const closers = new Set<() => void>();

function getLayer(i18n: I18n): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = document.body.createDiv({ cls: "ep-roll-layer" });
    const all = layer.createEl("button", { cls: "ep-roll-closeall", text: i18n.t("roll.closeAll") });
    all.onclick = () => {
      for (const close of [...closers]) close();
    };
  }
  return layer;
}

function dropBox(box: HTMLElement): void {
  box.remove();
  if (layer && !layer.querySelector(".ep-roll-box")) {
    layer.remove();
    layer = null;
  }
}

export function playRollAnimation(job: RollAnimJob, i18n: I18n, done: () => void): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    done();
    return;
  }

  const box = getLayer(i18n).createDiv({ cls: "ep-roll-box" });
  box.createDiv({ cls: "ep-roll-label", text: job.label });
  const diceRow = box.createDiv({ cls: "ep-roll-dice" });
  const chain = box.createDiv({ cls: "ep-roll-chain" });

  const shown = Math.min(job.faces.length, MAX_DICE_SHOWN);
  const dies: { el: HTMLElement; num: HTMLElement }[] = [];
  for (let i = 0; i < shown; i++) {
    const el = diceRow.createDiv({ cls: "ep-roll-die ep-rolling" });
    const ic = el.createDiv({ cls: "ep-roll-die-ico" });
    setIcon(ic, diceIconId(job.spec.sides));
    const num = el.createDiv({ cls: "ep-roll-die-num" });
    dies.push({ el, num });
  }

  const timers: number[] = [];
  let interval = 0;
  let pinned = job.stay;
  let resolved = false;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    closers.delete(close);
    window.clearInterval(interval);
    for (const id of timers) window.clearTimeout(id);
    box.addClass("ep-closing");
    window.setTimeout(() => dropBox(box), 160);
  };
  closers.add(close);
  const later = (fn: () => void, ms: number): void => {
    timers.push(window.setTimeout(() => {
      if (!closed) fn();
    }, ms));
  };
  // Clicking toggles keeping the card up; unpinning a resolved card closes.
  box.toggleClass("ep-pinned", pinned);
  box.onclick = () => {
    pinned = !pinned;
    box.toggleClass("ep-pinned", pinned);
    if (resolved && !pinned) close();
  };

  /** Plain-text version of the chain, for the copy menu. */
  const chainText = (): string => {
    const kept = job.faces.filter((_, i) => i !== job.dropIndex);
    let txt = kept.join(" + ");
    if (job.dropIndex >= 0) txt += ` (${i18n.t("roll.partDrop")} ${job.faces[job.dropIndex]})`;
    for (const p of job.parts) txt += ` ${fmtMod(p.value)} (${p.label})`;
    return `${txt} = ${job.total}`;
  };
  box.oncontextmenu = (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const menu = new Menu();
    menu.addItem((mi) =>
      mi.setTitle(i18n.t("roll.card.copyValue")).setIcon("copy").onClick(() => {
        void navigator.clipboard?.writeText(String(job.total));
      })
    );
    menu.addItem((mi) =>
      mi.setTitle(i18n.t("roll.card.copyChain")).setIcon("list").onClick(() => {
        void navigator.clipboard?.writeText(chainText());
      })
    );
    if (job.reroll) {
      menu.addItem((mi) =>
        mi.setTitle(i18n.t("roll.card.reroll")).setIcon("dices").onClick(() => {
          close();
          job.reroll?.();
        })
      );
    }
    menu.addItem((mi) => mi.setTitle(i18n.t("roll.card.dismiss")).setIcon("x").onClick(close));
    menu.showAtMouseEvent(ev);
  };

  /** Append one value (+ small origin label) to the addition chain. */
  const addCell = (op: string | null, valueText: string, labelText: string, cls = ""): void => {
    if (op) chain.createSpan({ cls: "ep-roll-op", text: op });
    const cell = chain.createDiv({ cls: "ep-roll-cell" + (cls ? " " + cls : "") });
    cell.createDiv({ cls: "ep-roll-cellval", text: valueText });
    cell.createDiv({ cls: "ep-roll-celllab", text: labelText });
    requestAnimationFrame(() => cell.addClass("ep-in"));
  };

  const dieLabel = formatDice({ count: 1, sides: job.spec.sides });
  const resolve = () => {
    resolved = true;
    done();
    if (!pinned) later(close, 1400);
  };

  /** Dice settle one after another; then the parts; then the total. */
  let keptShown = 0;
  const settleFrom = (i: number): void => {
    if (i >= job.faces.length) {
      let delay = PART_MS;
      for (const part of job.parts) {
        later(() => addCell("+", fmtMod(part.value), part.label), delay);
        delay += PART_MS;
      }
      later(() => {
        addCell("=", String(job.total), i18n.t("roll.partTotal"), "ep-roll-totalcell");
        resolve();
      }, delay);
      return;
    }
    const dropped = i === job.dropIndex;
    if (i < dies.length) {
      dies[i].el.removeClass("ep-rolling");
      dies[i].el.addClass("ep-settled");
      if (dropped) dies[i].el.addClass("ep-roll-drop");
      dies[i].num.setText(String(job.faces[i]));
    }
    if (dropped) {
      addCell(null, String(job.faces[i]), i18n.t("roll.partDrop"), "ep-roll-dropped");
    } else {
      addCell(keptShown > 0 ? "+" : null, String(job.faces[i]), dieLabel);
      keptShown++;
    }
    later(() => settleFrom(i + 1), SETTLE_MS);
  };

  let spin = 0;
  const spins = Math.max(1, Math.floor(job.spins) || 1);
  interval = window.setInterval(() => {
    for (const d of dies) d.num.setText(String(1 + Math.floor(Math.random() * job.spec.sides)));
    spin++;
    if (spin >= spins) {
      window.clearInterval(interval);
      settleFrom(0);
    }
  }, TICK_MS);
}
