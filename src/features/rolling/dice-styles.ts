/**
 * Modular per-die roll animations.
 *
 * Each {@link DiceStyle} owns how a single die looks while rolling and how it
 * lands. `dice-anim.ts` builds one die element per rolled face, calls `tick()`
 * on the un-settled ones each frame, and `settle(value)` when a die lands — the
 * card layout, the addition chain, the conveyor and sound are all style-agnostic.
 *
 * Built-in styles:
 *   - classic — the die tumbles while its number cycles, then pops to the result
 *   - spin    — the die icon spins in place (number hidden) and reveals the result
 *   - 3d      — a tumbling numbered cube that lands facing the result
 */

import { setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { diceIconId } from "../../ui/render/dice-icons";
import { buildSolid, BOX } from "../../utils/polyhedra";

/** Live controller for one animated die. */
export interface DieView {
  /** Advance the rolling visuals one frame (cycle a face / tumble). */
  tick(): void;
  /** Land on `value`; `dropped` = this die was dropped/rerolled away. */
  settle(value: number, dropped: boolean): void;
  /** Optional: play the whole roll as one motion that lands on `value` over
   *  ~durationMs (the 3D style's decelerating spin). Styles without it fall
   *  back to the per-frame tick() tumble + settle(). */
  roll?(value: number, durationMs: number): void;
}

/** A selectable dice-roll animation. */
export interface DiceStyle {
  id: string;
  name: (i18n: I18n) => string;
  /** Build the die's contents into `el` (already classed `ep-roll-die`).
   *  `ss` is the 3D supersample (anti-alias) factor — 1 = off; only 3D uses it. */
  create(el: HTMLElement, sides: number, ss?: number): DieView;
}

const rnd = (sides: number): number => 1 + Math.floor(Math.random() * Math.max(1, sides));

/** Classic: pseudo-3D tumble with a cycling number, popping to the result. */
function classicView(el: HTMLElement, sides: number): DieView {
  el.addClass("ep-rolling");
  const ico = el.createDiv({ cls: "ep-roll-die-ico" });
  setIcon(ico, diceIconId(sides));
  const num = el.createDiv({ cls: "ep-roll-die-num" });
  return {
    tick: () => num.setText(String(rnd(sides))),
    settle: (v) => {
      el.removeClass("ep-rolling");
      el.addClass("ep-settled");
      num.setText(String(v));
    },
  };
}

const classic: DiceStyle = {
  id: "classic",
  name: (i) => i.t("roll.style.classic"),
  create: (el, sides) => classicView(el, sides),
};

/** Spin: the die icon spins (number hidden) and reveals the result on landing. */
const spin: DiceStyle = {
  id: "spin",
  name: (i) => i.t("roll.style.spin"),
  create(el, sides) {
    el.addClass("ep-spin");
    const ico = el.createDiv({ cls: "ep-roll-die-ico" });
    setIcon(ico, diceIconId(sides));
    const num = el.createDiv({ cls: "ep-roll-die-num" });
    return {
      tick: () => {
        /* the spin is CSS-driven; nothing to update per frame */
      },
      settle: (v) => {
        el.removeClass("ep-spin");
        el.addClass("ep-settled");
        num.setText(String(v));
      },
    };
  },
};

/**
 * 3D: a true polyhedron per die — tetrahedron (d4), cube (d6), octahedron (d8),
 * pentagonal trapezohedron (d10), dodecahedron (d12), icosahedron (d20). Each
 * solid is normalized to one size; faces are an edge layer with an inset fill
 * layer (so outlines always draw). It spins on a single axis, decelerating
 * quickly with a slight bounce, and lands with the result face front and upright
 * via that face's exact inverse rotation. Sizes without a solid (d100, custom)
 * fall back to the simple, reliable classic animation.
 */
const cube3d: DiceStyle = {
  id: "3d",
  name: (i) => i.t("roll.style.threeD"),
  create(el, sides, ss) {
    // Supersample (anti-alias) factor: build the solid SS× larger so each face's
    // clip-path rasterizes at SS× resolution, then scale the whole solid back
    // down by 1/SS — the GPU minifies the clipped faces with linear filtering,
    // smoothing the otherwise-jagged polygon edges. This MUST be scale3d (a
    // uniform 3D scale): a 2D scale() leaves z at the SS× depth, stretching the
    // solid and doubling the perspective foreshortening. With scale3d the SS×
    // geometry depth cancels too, so perspective and shape are unchanged. SS = 1
    // reproduces the original (no extra layers).
    const SS = ss && ss > 1 ? Math.floor(ss) : 1;
    const solid = buildSolid(sides, SS);
    if (!solid) return classicView(el, sides);
    el.addClass("ep-die3d");
    const wrap = el.createDiv({ cls: "ep-solid" });
    const k = (1 / SS).toFixed(4);
    const sc = SS > 1 ? `scale3d(${k}, ${k}, ${k}) ` : "";
    if (SS > 1) {
      // The face box (and its clip-path coords) are SS× big; size the stage to
      // match and pre-apply the downscale so it never flashes at full size.
      wrap.style.width = wrap.style.height = `${BOX * SS}px`;
      wrap.style.transform = sc.trim();
    }
    const faceEls = solid.map((f, k) => {
      const fe = wrap.createDiv({ cls: "ep-solid-face" });
      fe.style.transform = f.place;
      const edge = fe.createDiv({ cls: "ep-solid-edge" });
      edge.style.clipPath = f.clip;
      const fill = fe.createDiv({ cls: "ep-solid-fill" });
      fill.style.clipPath = f.clipInner;
      // The number is a sibling of the (clipped) fill so it's never clipped, and
      // rotated so its top points at the face's pointiest vertex / edge midpoint.
      const num = fe.createDiv({ cls: "ep-solid-num", text: String(k + 1) });
      // em resolves before the 1/SS downscale, so size the digit SS× to keep it.
      if (SS > 1) num.style.fontSize = `${(1.05 * SS).toFixed(3)}em`;
      num.style.transform = `rotate(${f.numRot.toFixed(1)}deg)`;
      return fe;
    });
    const idxOf = (v: number): number => (v >= 1 && v <= solid.length ? v - 1 : 0);
    const landed = (idx: number): string =>
      `${sc}rotateZ(${solid[idx].landUp.toFixed(1)}deg) ${solid[idx].land}`;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return {
      // The motion is one continuous decelerating spin kicked off by roll();
      // there's nothing to update per frame (no more jarring re-orientations).
      tick: () => {
        /* no per-frame work */
      },
      roll: (v, durationMs) => {
        const idx = idxOf(v);
        // One spin axis (a single "vector"), weighted toward a tumbling roll
        // rather than a flat in-plane spin (smaller Z component).
        const ax = Math.random() * 2 - 1;
        const ay = Math.random() * 2 - 1;
        const az = (Math.random() * 2 - 1) * 0.35;
        const L = Math.hypot(ax, ay, az) || 1;
        const pre = `${sc}rotate3d(${(ax / L).toFixed(3)}, ${(ay / L).toFixed(3)}, ${(az / L).toFixed(3)}, `;
        const post = `deg) rotateZ(${solid[idx].landUp.toFixed(1)}deg) ${solid[idx].land}`;
        const tf = (ang: number): string => `${pre}${ang}${post}`;
        const end = tf(0); // exact landing pose (result face front, upright)
        if (reduce) {
          wrap.style.transform = end; // no motion for reduced-motion users
          return;
        }
        const spins = 3 + Math.floor(Math.random() * 2); // 3–4 full turns
        const dur = Math.max(450, Math.min(1600, durationMs || 700));
        wrap.style.transform = tf(360 * spins); // wound-up start (no pre-animation flash)
        wrap.animate(
          [
            // Decelerate quickly from the wound-up spin down onto the face…
            { transform: tf(360 * spins), offset: 0, easing: "cubic-bezier(.12,.75,.16,1)" },
            // …carry a touch past it (the bounce)…
            { transform: tf(-9), offset: 0.86, easing: "cubic-bezier(.33,0,.5,1)" },
            // …then settle back exactly on the face.
            { transform: end, offset: 1 },
          ],
          { duration: dur, fill: "forwards" }
        );
      },
      settle: (v) => {
        const idx = idxOf(v);
        // roll() already lands the die (fill: forwards); set the pose too so it's
        // correct even if roll() was skipped, and brighten the landed face.
        wrap.style.transform = landed(idx);
        faceEls[idx]?.addClass("ep-solid-on");
        el.addClass("ep-settled");
      },
    };
  },
};

const STYLES: Record<string, DiceStyle> = { classic, spin, "3d": cube3d };

/** All styles, in display order (for the settings dropdown). */
export const DICE_STYLES: DiceStyle[] = [classic, spin, cube3d];

/** Resolve a style id to its definition, falling back to classic. */
export function pickDiceStyle(id?: string): DiceStyle {
  return (id !== undefined && STYLES[id]) || classic;
}
