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
import { buildSolid } from "../../utils/polyhedra";

/** Live controller for one animated die. */
export interface DieView {
  /** Advance the rolling visuals one frame (cycle a face / tumble). */
  tick(): void;
  /** Land on `value`; `dropped` = this die was dropped/rerolled away. */
  settle(value: number, dropped: boolean): void;
}

/** A selectable dice-roll animation. */
export interface DiceStyle {
  id: string;
  name: (i18n: I18n) => string;
  /** Build the die's contents into `el` (already classed `ep-roll-die`). */
  create(el: HTMLElement, sides: number): DieView;
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
 * layer (so outlines always draw). It tumbles through random orientations and,
 * on landing, rotates the result face to the front via that face's exact inverse
 * rotation (so the result reads upright). Sizes without a solid (d100, custom)
 * fall back to the simple, reliable classic animation.
 */
const cube3d: DiceStyle = {
  id: "3d",
  name: (i) => i.t("roll.style.threeD"),
  create(el, sides) {
    const solid = buildSolid(sides);
    if (!solid) return classicView(el, sides);
    el.addClass("ep-die3d");
    const wrap = el.createDiv({ cls: "ep-solid" });
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
      num.style.transform = `rotate(${f.numRot.toFixed(1)}deg)`;
      return fe;
    });
    return {
      tick: () => {
        const r = (): number => Math.floor(Math.random() * 360);
        wrap.style.transform = `rotateX(${r()}deg) rotateY(${r()}deg) rotateZ(${r()}deg)`;
      },
      settle: (v) => {
        const idx = v >= 1 && v <= solid.length ? v - 1 : 0;
        wrap.addClass("ep-solid-land");
        // land orients the result face to the front; the rotateZ then makes its
        // number read upright.
        wrap.style.transform = `rotateZ(${solid[idx].landUp.toFixed(1)}deg) ${solid[idx].land}`;
        faceEls[idx]?.addClass("ep-solid-on"); // brighten the landed face
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
