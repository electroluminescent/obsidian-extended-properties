/**
 * The dice-roll animation: a dimmed overlay where the rolled dice (their
 * isometric icons) tumble in 3D while the face values cycle a configurable
 * number of times before settling on the real results. Once settled, the
 * modifier slides in and the final total pops — the caller's `done`
 * callback (log + notice) only fires after the roll has fully resolved
 * (or the user clicks the overlay to skip).
 *
 * Honors `prefers-reduced-motion` by resolving instantly.
 */

import { setIcon } from "obsidian";
import type { DiceSpec } from "../../utils/dice";
import { diceIconId } from "../../ui/render/dice-icons";
import { fmtMod } from "../../utils/misc";

/** Visual cap — huge pools still roll, but only this many dice render. */
const MAX_DICE_SHOWN = 12;
/** Milliseconds between face cycles. */
const TICK_MS = 80;

export interface RollAnimJob {
  /** Headline above the dice (roll label incl. adv/dis tag). */
  label: string;
  spec: DiceSpec;
  /** Final face per die (the pool that was kept). */
  faces: number[];
  modifier: number;
  total: number;
  /** How many times the faces cycle before settling. */
  spins: number;
}

export function playRollAnimation(job: RollAnimJob, done: () => void): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    done();
    return;
  }

  const overlay = document.body.createDiv({ cls: "ep-roll-overlay" });
  const box = overlay.createDiv({ cls: "ep-roll-box" });
  box.createDiv({ cls: "ep-roll-label", text: job.label });
  const diceRow = box.createDiv({ cls: "ep-roll-dice" });
  const sum = box.createDiv({ cls: "ep-roll-sum" });

  const shown = Math.min(job.faces.length, MAX_DICE_SHOWN);
  const dies: { el: HTMLElement; num: HTMLElement }[] = [];
  for (let i = 0; i < shown; i++) {
    const el = diceRow.createDiv({ cls: "ep-roll-die ep-rolling" });
    const ic = el.createDiv({ cls: "ep-roll-die-ico" });
    setIcon(ic, diceIconId(job.spec.sides));
    const num = el.createDiv({ cls: "ep-roll-die-num" });
    dies.push({ el, num });
  }

  let timer = 0;
  let t1 = 0;
  let t2 = 0;
  let t3 = 0;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearInterval(timer);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    window.clearTimeout(t3);
    overlay.addClass("ep-closing");
    window.setTimeout(() => overlay.remove(), 160);
    done();
  };
  // Click anywhere to skip — the result still commits.
  overlay.onclick = finish;

  const diceTotal = job.faces.reduce((a, b) => a + b, 0);
  const settle = () => {
    window.clearInterval(timer);
    dies.forEach((d, i) => {
      d.el.removeClass("ep-rolling");
      d.el.addClass("ep-settled");
      d.num.setText(String(job.faces[i]));
    });
    t1 = window.setTimeout(() => {
      if (finished) return;
      const breakdown =
        job.faces.length > 1 && job.faces.length <= MAX_DICE_SHOWN
          ? `${job.faces.join(" + ")} = ${diceTotal}`
          : String(diceTotal);
      sum.createSpan({ text: breakdown });
      if (job.modifier !== 0) {
        const m = sum.createSpan({ cls: "ep-roll-mod", text: fmtMod(job.modifier) });
        requestAnimationFrame(() => m.addClass("ep-in"));
      }
      const tot = sum.createSpan({ cls: "ep-roll-total", text: "= " + job.total });
      t2 = window.setTimeout(() => {
        if (finished) return;
        tot.addClass("ep-in");
        t3 = window.setTimeout(finish, 950);
      }, job.modifier !== 0 ? 380 : 120);
    }, 300);
  };

  let spin = 0;
  const spins = Math.max(1, Math.floor(job.spins) || 1);
  timer = window.setInterval(() => {
    for (const d of dies) d.num.setText(String(1 + Math.floor(Math.random() * job.spec.sides)));
    spin++;
    if (spin >= spins) settle();
  }, TICK_MS);
}
