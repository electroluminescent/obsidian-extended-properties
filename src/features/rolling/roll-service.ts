/**
 * Per-view roll state: the active roll mode and a short result log.
 *
 * Shared through the view's {@link ServiceHub} so roll buttons (numeric
 * addon, skills rows, derived entries) and the roll log panel stay
 * decoupled — none of them know the others exist.
 *
 * Rolls are dice pools ({@link DiceSpec}): advantage/disadvantage roll the
 * whole pool twice and keep the better/worse total, which reduces to the
 * classic d20 behavior for single-die pools.
 */

import { Notice } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { EPSettings } from "../../core/model";
import type { ViewService } from "../../core/registry";
import { fmtMod } from "../../utils/misc";
import { DEFAULT_DICE, DicePool, DiceSpec, formatDice, isMaxPool, isMinPool, rollPool } from "../../utils/dice";
import { playRollAnimation } from "./dice-anim";

/** Hub key under which the service is registered. */
export const ROLL_SERVICE = "rolling.rolls";

export type RollMode = "normal" | "advantage" | "disadvantage";

export interface RollEntry { text: string; tone: "normal" | "crit" | "fail" }

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
   * Roll `spec` + `modifier` under the current mode; log and toast the result.
   * @param spec dice pool to roll (defaults to a single d20)
   */
  roll(label: string, modifier: number, spec: DiceSpec = { ...DEFAULT_DICE }): void {
    const pools: DicePool[] = [rollPool(spec)];
    if (this.mode !== "normal") pools.push(rollPool(spec));
    const used =
      pools.length === 1
        ? pools[0]
        : this.mode === "advantage"
          ? pools.reduce((a, b) => (b.total > a.total ? b : a))
          : pools.reduce((a, b) => (b.total < a.total ? b : a));
    const total = used.total + modifier;

    const tag =
      this.mode === "advantage"
        ? " " + this.i18n.t("roll.tagAdvantage")
        : this.mode === "disadvantage"
          ? " " + this.i18n.t("roll.tagDisadvantage")
          : "";
    // Detail mirrors the classic format: "14", "[14, 8] -> 14", "[3, 5] -> 8".
    const detail =
      pools.length > 1
        ? `[${pools.map((p) => p.total).join(", ")}] -> ${used.total}`
        : spec.count > 1
          ? `[${used.faces.join(", ")}] -> ${used.total}`
          : `${used.total}`;
    const tone: RollEntry["tone"] = isMaxPool(spec, used) ? "crit" : isMinPool(used) ? "fail" : "normal";

    // The result is committed (log + notice) only once the roll resolves —
    // immediately without animation, after the dice settle with it.
    const commit = () => {
      this.log.unshift({ text: `${label}${tag}: ${total}   (${formatDice(spec)} ${detail} ${fmtMod(modifier)})`, tone });
      if (this.log.length > LOG_LIMIT) this.log.pop();
      this.emit();
      new Notice(`${label}${tag}: ${total}`, 4000);
    };
    if (this.settings?.diceAnim) {
      playRollAnimation(
        {
          label: `${label}${tag}`,
          spec,
          faces: used.faces,
          modifier,
          total,
          spins: this.settings.diceAnimRolls ?? 10,
        },
        commit
      );
    } else {
      commit();
    }
  }
}
