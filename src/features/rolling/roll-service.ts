/**
 * Per-view roll state: the active roll mode and a short result log.
 *
 * Shared through the view's {@link ServiceHub} so roll buttons (numeric
 * addon, skills rows, derived entries) and the roll log panel stay
 * decoupled — none of them know the others exist.
 *
 * Rolls are dice pools ({@link DiceSpec}): advantage/disadvantage add one
 * extra die to the pool and drop the single lowest/highest result, which
 * reduces to the classic d20 behavior for single-die pools. The dropped
 * die stays visible (dimmed) in the animation and its chain. Custom
 * chains may roll several pools at once via {@link RollOpts.extra}.
 * Every log entry carries a `redo` closure so the history is re-rollable.
 */

import { Notice } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { EPSettings } from "../../core/model";
import type { ViewService } from "../../core/registry";
import { fmtMod } from "../../utils/misc";
import { DEFAULT_DICE, DiceSpec, formatDice, rollPool } from "../../utils/dice";
import { playRollAnimation, RollAnimGroup, RollPart } from "./dice-anim";

export type { RollPart } from "./dice-anim";

/** Per-roll options (overriding the panel mode, labeled modifier parts…). */
export interface RollOpts {
  /** Labeled summands of the modifier (shown in the animation chain). */
  parts?: RollPart[];
  /** Roll mode for this roll only (defaults to the panel's mode). */
  mode?: RollMode;
  /** Keep the result card on screen (multi-rolls force this). */
  stay?: boolean;
  /** Additional dice pools rolled together with `spec` (custom chains). */
  extra?: DiceSpec[];
}

/** Hub key under which the service is registered. */
export const ROLL_SERVICE = "rolling.rolls";

export type RollMode = "normal" | "advantage" | "disadvantage";

export interface RollEntry {
  text: string;
  /** Short form: label and total only. */
  brief: string;
  tone: "normal" | "crit" | "fail";
  /** Re-run the roll that produced this entry. */
  redo?: () => void;
}

const LOG_LIMIT = 6;

export class RollService implements ViewService {
  mode: RollMode = "normal";
  log: RollEntry[] = [];
  private listeners = new Set<() => void>();

  constructor(private i18n: I18n, private settings?: EPSettings) {}

  /** The log is per-note; the mode survives note switches. */
  onFileChange(): void {
    this.log = [];
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  setMode(mode: RollMode): void {
    this.mode = mode;
    this.emit();
  }

  /**
   * Roll `spec` + `modifier` under the current (or overridden) mode; log
   * and toast the result once it resolves.
   * @param spec dice pool to roll (defaults to a single d20)
   */
  roll(label: string, modifier: number, spec: DiceSpec = { ...DEFAULT_DICE }, opts: RollOpts = {}): void {
    const mode = opts.mode ?? this.mode;
    // Advantage/disadvantage roll one extra die; advantage drops the
    // single lowest face, disadvantage the highest. All dice stay visible.
    const count = Math.max(1, spec.count) + (mode === "normal" ? 0 : 1);
    const faces: number[] = [];
    for (let i = 0; i < count; i++) faces.push(1 + Math.floor(Math.random() * spec.sides));
    let dropIndex = -1;
    if (mode !== "normal") {
      dropIndex = 0;
      for (let i = 1; i < faces.length; i++) {
        if (mode === "advantage" ? faces[i] < faces[dropIndex] : faces[i] > faces[dropIndex]) dropIndex = i;
      }
    }
    const kept = faces.filter((_, i) => i !== dropIndex);
    const primTotal = kept.reduce((a, b) => a + b, 0);

    // Extra pools (e.g. the dice-roller chain) roll alongside, mode-free.
    const groups: RollAnimGroup[] = [{ sides: spec.sides, faces, dropIndex }];
    let extraTotal = 0;
    let extraTxt = "";
    for (const ex of opts.extra ?? []) {
      const pool = rollPool(ex);
      groups.push({ sides: ex.sides, faces: pool.faces, dropIndex: -1 });
      extraTotal += pool.total;
      extraTxt += ` + ${formatDice(ex)}[${pool.faces.join(", ")}]`;
    }
    const total = primTotal + extraTotal + modifier;

    const tag =
      mode === "advantage"
        ? " " + this.i18n.t("roll.tagAdvantage")
        : mode === "disadvantage"
          ? " " + this.i18n.t("roll.tagDisadvantage")
          : "";
    // Detail: "14", "[3, 5] -> 8", or with a drop "[6, 8, 13, 9 | drop 13] -> 23".
    const detail =
      dropIndex >= 0
        ? `[${faces.join(", ")} | ${this.i18n.t("roll.partDrop")} ${faces[dropIndex]}] -> ${primTotal}`
        : spec.count > 1
          ? `[${faces.join(", ")}] -> ${primTotal}`
          : `${primTotal}`;
    // Crit/fail tone evaluates the kept dice of the primary pool only.
    const tone: RollEntry["tone"] =
      kept.every((f) => f === spec.sides) ? "crit" : kept.every((f) => f === 1) ? "fail" : "normal";

    const brief = `${label}${tag}: ${total}`;
    const redo = () => this.roll(label, modifier, spec, opts);

    // The result is committed (log + notice) only once the roll resolves —
    // immediately without animation, after the dice settle with it.
    const commit = () => {
      this.log.unshift({
        text: `${brief}   (${formatDice(spec)} ${detail}${extraTxt} ${fmtMod(modifier)})`,
        brief,
        tone,
        redo,
      });
      if (this.log.length > LOG_LIMIT) this.log.pop();
      this.emit();
      new Notice(brief, 4000);
    };
    if (this.settings?.diceAnim) {
      const parts =
        opts.parts ?? (modifier !== 0 ? [{ label: this.i18n.t("roll.partMod"), value: modifier }] : []);
      playRollAnimation(
        {
          label: `${label}${tag}`,
          groups,
          parts,
          total,
          spins: this.settings.diceAnimRolls ?? 10,
          stay: opts.stay || this.settings.diceAnimStay === true,
          block: this.settings.diceAnimBlock !== false,
          reroll: redo,
        },
        this.i18n,
        commit
      );
    } else {
      commit();
    }
  }
}
