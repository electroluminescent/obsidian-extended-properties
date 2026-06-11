/**
 * Per-view roll state: the active roll mode and a short result log.
 *
 * Shared through the view's {@link ServiceHub} so the roll buttons (numeric
 * addon, computed entries, saves/skills blocks) and the roll log panel stay
 * decoupled — none of them know the others exist.
 */

import { Notice } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { ViewService } from "../../core/registry";
import { fmtMod } from "../../utils/misc";
import { RollMode, rollByMode } from "./rules";

/** Hub key under which the service is registered. */
export const ROLL_SERVICE = "dnd5e.rolls";

export interface RollEntry { text: string; tone: "normal" | "crit" | "fail" }

const LOG_LIMIT = 6;

export class RollService implements ViewService {
  mode: RollMode = "normal";
  log: RollEntry[] = [];
  private listeners = new Set<() => void>();

  constructor(private i18n: I18n) {}

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

  /** Roll d20 + `modifier` under the current mode; log and toast the result. */
  roll(label: string, modifier: number): void {
    const { rolls, used } = rollByMode(this.mode);
    const total = used + modifier;
    const tag =
      this.mode === "advantage"
        ? " " + this.i18n.t("dnd.tagAdvantage")
        : this.mode === "disadvantage"
          ? " " + this.i18n.t("dnd.tagDisadvantage")
          : "";
    const dice = rolls.length > 1 ? `[${rolls.join(", ")}] -> ${used}` : `${used}`;
    const tone: RollEntry["tone"] = used === 20 ? "crit" : used === 1 ? "fail" : "normal";
    this.log.unshift({ text: `${label}${tag}: ${total}   (d20 ${dice} ${fmtMod(modifier)})`, tone });
    if (this.log.length > LOG_LIMIT) this.log.pop();
    this.emit();
    new Notice(`${label}${tag}: ${total}`, 4000);
  }
}
