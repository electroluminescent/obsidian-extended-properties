/**
 * The dice-roll animation.
 *
 * Rolls render as cards on a shared layer, so several rolls (e.g. a
 * right-click multi-roll) can resolve side by side. A roll may carry
 * several dice pools (custom chains roll different die types at once);
 * every die tumbles, then settles one after another, appending its value
 * to the addition chain — modifier parts and the total follow. The
 * dropped advantage/disadvantage die stays visible, dimmed and struck.
 *
 * The layer optionally dims and blocks the background (plugin setting).
 * Once every active roll has resolved, a small window at the bottom
 * center offers dismiss-all plus a distribution slider: it snaps across
 * the distinct results (starting at the centermost), shows how many
 * rolls landed at-or-above vs below that value, and stacks one mini die
 * per roll in 6-high columns, animating between the groups as the
 * slider moves.
 *
 * Clicking a card toggles keeping it; right-click offers copy value /
 * copy chain / reroll / dismiss / dismiss all. The caller's `done`
 * (log + notice) fires exactly when the roll resolves.
 *
 * Honors `prefers-reduced-motion` by resolving instantly.
 */

import { Menu, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
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

/** One dice pool of a roll (custom chains may carry several). */
export interface RollAnimGroup {
  sides: number;
  /** Every rolled face, in roll order (incl. extra/dropped/rerolled-away dice). */
  faces: number[];
  /** Parallel to `faces`: true = the die was dropped or rerolled away (dimmed, struck). */
  dropped: boolean[];
}

export interface RollAnimJob {
  /** Headline above the dice (roll label incl. adv/dis tag). */
  label: string;
  groups: RollAnimGroup[];
  /** Labeled modifier parts (their values sum to the total modifier). */
  parts: RollPart[];
  total: number;
  /** How many times the faces cycle before settling. */
  spins: number;
  /** Keep the card on screen after resolving (clicking always toggles). */
  stay: boolean;
  /** Dim the background and block interaction while cards are up. */
  block: boolean;
  /** Re-run the roll that produced this card ("reroll" in the menu). */
  reroll?: () => void;
}

let layer: HTMLElement | null = null;
let summaryEl: HTMLElement | null = null;
let summarySig = "";
let summaryIndex = 0;
/** Close handlers of all live cards, for dismiss-all. */
const closers = new Set<() => void>();
/** Resolved, still-visible rolls (feed the bottom summary window). */
const lives = new Map<object, { total: number; sides: number; reroll?: () => void }>();
/** Cards still tumbling — the summary waits for them. */
let pending = 0;

export function closeAllRolls(): void {
  for (const close of [...closers]) close();
}

function getLayer(block: boolean): HTMLElement {
  if (!layer || !layer.isConnected) {
    layer = document.body.createDiv({ cls: "ep-roll-layer" });
    // Cards live in a centered, vertically scrollable host.
    layer.createDiv({ cls: "ep-roll-cards" });
  }
  if (block) layer.addClass("ep-roll-block");
  return layer;
}

function cardsHost(block: boolean): HTMLElement {
  const l = getLayer(block);
  return (l.querySelector(".ep-roll-cards") as HTMLElement) ?? l;
}

function dropBox(box: HTMLElement): void {
  box.remove();
  if (layer && !layer.querySelector(".ep-roll-box")) {
    layer.remove();
    layer = null;
    summaryEl = null;
    summarySig = "";
  }
}

/** Bottom-center window: dismiss-all plus the result-distribution slider. */
function updateSummary(i18n: I18n): void {
  if (!layer) return;
  if (pending > 0 || lives.size === 0) {
    summaryEl?.remove();
    summaryEl = null;
    summarySig = "";
    return;
  }
  const rolls = [...lives.values()];
  const uniq = [...new Set(rolls.map((r) => r.total))].sort((a, b) => a - b);
  const sig = rolls.map((r) => r.total).sort((a, b) => a - b).join(",");
  if (sig !== summarySig) {
    summarySig = sig;
    // Start at the centermost result value.
    summaryIndex = Math.floor((uniq.length - 1) / 2);
  }
  summaryIndex = Math.max(0, Math.min(uniq.length - 1, summaryIndex));

  summaryEl?.remove();
  summaryEl = layer.createDiv({ cls: "ep-roll-summary" });
  const top = summaryEl.createDiv({ cls: "ep-roll-sum-top" });
  const valEl = top.createSpan({ cls: "ep-roll-sum-val" });
  const rerollAll = top.createEl("button", { cls: "ep-roll-sum-dismiss", text: i18n.t("roll.rerollAll") });
  rerollAll.onclick = () => {
    const redos = [...lives.values()].map((l) => l.reroll).filter((r): r is () => void => !!r);
    closeAllRolls();
    for (const r of redos) r();
  };
  const dismiss = top.createEl("button", { cls: "ep-roll-sum-dismiss", text: i18n.t("roll.closeAll") });
  dismiss.onclick = closeAllRolls;
  // The slider snaps across the distinct result values — no in-between.
  const slider = summaryEl.createEl("input", { cls: "ep-roll-sum-slider", type: "range" });
  slider.min = "0";
  slider.max = String(uniq.length - 1);
  slider.step = "1";
  slider.value = String(summaryIndex);
  slider.disabled = uniq.length < 2;
  // "<" sits on the left, "≥" on the right.
  const groupsRow = summaryEl.createDiv({ cls: "ep-roll-sum-groups" });
  const ltGroup = groupsRow.createDiv({ cls: "ep-roll-sum-group" });
  const ltHead = ltGroup.createDiv({ cls: "ep-roll-sum-head" });
  const ltGrid = ltGroup.createDiv({ cls: "ep-roll-sum-dice" });
  const geGroup = groupsRow.createDiv({ cls: "ep-roll-sum-group" });
  const geHead = geGroup.createDiv({ cls: "ep-roll-sum-head" });
  const geGrid = geGroup.createDiv({ cls: "ep-roll-sum-dice" });

  // One mini die per visible roll; it migrates between the two groups as
  // the slider moves (FLIP animation between positions).
  const els = rolls.map((r) => {
    const el = createDiv({ cls: "ep-roll-sum-die" });
    const ic = el.createDiv({ cls: "ep-roll-sum-ico" });
    setIcon(ic, diceIconId(r.sides));
    el.createDiv({ cls: "ep-roll-sum-num", text: String(r.total) });
    return { total: r.total, el };
  });
  els.sort((a, b) => b.total - a.total);

  const apply = (animate: boolean): void => {
    const v = uniq[summaryIndex];
    valEl.setText(String(v));
    const firsts = animate ? new Map(els.map((x) => [x.el, x.el.getBoundingClientRect()])) : null;
    let ge = 0;
    let lt = 0;
    for (const x of els) {
      if (x.total >= v) {
        geGrid.appendChild(x.el);
        ge++;
      } else {
        ltGrid.appendChild(x.el);
        lt++;
      }
    }
    geHead.setText(`≥ ${v} · ${ge}`);
    ltHead.setText(`< ${v} · ${lt}`);
    if (firsts) {
      for (const x of els) {
        const a = firsts.get(x.el);
        if (!a) continue;
        const b = x.el.getBoundingClientRect();
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (!dx && !dy) continue;
        x.el.style.transition = "none";
        x.el.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          x.el.style.transition = "";
          x.el.style.transform = "";
        });
      }
    }
  };
  slider.oninput = () => {
    summaryIndex = parseInt(slider.value) || 0;
    apply(true);
  };
  apply(false);
}

export function playRollAnimation(job: RollAnimJob, i18n: I18n, done: () => void): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    done();
    return;
  }

  pending++;
  const token = {};
  const box = cardsHost(job.block).createDiv({ cls: "ep-roll-box" });
  box.createDiv({ cls: "ep-roll-label", text: job.label });
  const diceRow = box.createDiv({ cls: "ep-roll-dice" });
  const chain = box.createDiv({ cls: "ep-roll-chain" });

  // Flatten the groups into one die sequence (each die keeps its group).
  const flat: { grp: RollAnimGroup; idx: number }[] = [];
  for (const grp of job.groups) grp.faces.forEach((_, idx) => flat.push({ grp, idx }));
  const shown = Math.min(flat.length, MAX_DICE_SHOWN);
  const dies: { el: HTMLElement; num: HTMLElement; sides: number }[] = [];
  for (let i = 0; i < shown; i++) {
    const el = diceRow.createDiv({ cls: "ep-roll-die ep-rolling" });
    const ic = el.createDiv({ cls: "ep-roll-die-ico" });
    setIcon(ic, diceIconId(flat[i].grp.sides));
    const num = el.createDiv({ cls: "ep-roll-die-num" });
    dies.push({ el, num, sides: flat[i].grp.sides });
  }

  const timers: number[] = [];
  let interval = 0;
  let pinned = job.stay;
  let resolved = false;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    if (!resolved) pending--;
    lives.delete(token);
    closers.delete(close);
    window.clearInterval(interval);
    for (const id of timers) window.clearTimeout(id);
    box.addClass("ep-closing");
    window.setTimeout(() => dropBox(box), 160);
    updateSummary(i18n);
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
    const kept: number[] = [];
    const drops: string[] = [];
    for (const grp of job.groups) {
      grp.faces.forEach((f, i) => {
        if (grp.dropped[i]) drops.push(`(${i18n.t("roll.partDrop")} ${f})`);
        else kept.push(f);
      });
    }
    let txt = kept.join(" + ");
    if (drops.length) txt += " " + drops.join(" ");
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
    menu.addItem((mi) => mi.setTitle(i18n.t("roll.closeAll")).setIcon("x-circle").onClick(closeAllRolls));
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

  const resolve = () => {
    resolved = true;
    pending--;
    lives.set(token, { total: job.total, sides: job.groups[0]?.sides ?? 20, reroll: job.reroll });
    done();
    updateSummary(i18n);
    // The auto-close must re-check pinning — clicking a card during this
    // window has to keep it (the old timer closed it regardless).
    if (!pinned) later(() => {
      if (!pinned) close();
    }, 1400);
  };

  /** Dice settle one after another; then the parts; then the total. */
  let keptShown = 0;
  const settleFrom = (i: number): void => {
    if (i >= flat.length) {
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
    const { grp, idx } = flat[i];
    const dropped = grp.dropped[idx];
    if (i < dies.length) {
      dies[i].el.removeClass("ep-rolling");
      dies[i].el.addClass("ep-settled");
      if (dropped) dies[i].el.addClass("ep-roll-drop");
      dies[i].num.setText(String(grp.faces[idx]));
    }
    if (dropped) {
      addCell(null, String(grp.faces[idx]), i18n.t("roll.partDrop"), "ep-roll-dropped");
    } else {
      addCell(keptShown > 0 ? "+" : null, String(grp.faces[idx]), formatDice({ count: 1, sides: grp.sides }));
      keptShown++;
    }
    later(() => settleFrom(i + 1), SETTLE_MS);
  };

  let spin = 0;
  const spins = Math.max(1, Math.floor(job.spins) || 1);
  interval = window.setInterval(() => {
    for (const d of dies) d.num.setText(String(1 + Math.floor(Math.random() * d.sides)));
    spin++;
    if (spin >= spins) {
      window.clearInterval(interval);
      settleFrom(0);
    }
  }, TICK_MS);
}
