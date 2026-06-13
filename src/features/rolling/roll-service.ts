/**
 * Per-view roll service.
 *
 * Every roll is evaluated as a {@link RollAst} (see `utils/dice-expr.ts`):
 * one representation for the simple `NdS + modifier` of a roll button and the
 * full notation a power user types into the dice roller (`2d6kh1 + 1d8 + DEX`).
 * {@link RollService.roll} keeps the old simple-spec call shape — it builds a
 * trivial AST and maps advantage/disadvantage onto a keep/drop node — so the
 * numeric addon, skills rows and derived entries are unchanged.
 *
 * Resolved rolls are recorded into the plugin-level {@link HistoryService} and
 * announced through the dice animation; the per-view `mode` is the default
 * advantage state for roll buttons (overridable per roll).
 */

import { App, Notice } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { EPSettings, RollRecord } from "../../core/model";
import type { ViewService } from "../../core/registry";
import { abbrFor } from "../../core/influences";
import { fmtMod, genId } from "../../utils/misc";
import { DEFAULT_DICE, DiceSpec } from "../../utils/dice";
import {
  CritRules, DiceNode, evalRoll, RollAst, RollEnv, RollResult, RollTerm, serializeRoll,
} from "../../utils/dice-expr";
import { rollFace } from "./karma";
import { playRollAnimation, RollAnimGroup, RollPart } from "./dice-anim";
import type { HistoryService } from "./history";

export type { RollPart } from "./dice-anim";

/** Per-roll options for the simple-spec {@link RollService.roll}. */
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

/** Per-roll options for {@link RollService.rollAst}. */
export interface RollAstOpts {
  /** Override the labeled summands shown in the chain (e.g. an influence breakdown). */
  parts?: RollPart[];
  /** Keep the result card on screen. */
  stay?: boolean;
  /** Tag appended to the label (e.g. the advantage/disadvantage marker). */
  tag?: string;
  /** Mode recorded with the history entry. */
  mode?: RollMode;
  /** Resolver for property references; defaults to the active note's frontmatter numbers. */
  resolve?: (name: string) => number | undefined;
  /** Override the re-roll closure stored for this entry. */
  reroll?: () => void;
}

/** Hub key under which the service is registered. */
export const ROLL_SERVICE = "rolling.rolls";

export type RollMode = "normal" | "advantage" | "disadvantage";

export class RollService implements ViewService {
  /** Default roll mode for this view (overridable per roll via {@link RollOpts.mode}). */
  mode: RollMode = "normal";

  /**
   * @param history plugin-level store every resolved roll is recorded into
   * @param app     used to attribute each record to the active note and resolve references
   */
  constructor(
    private i18n: I18n,
    private settings?: EPSettings,
    private history?: HistoryService,
    private app?: App
  ) {}

  /** {@link ViewService} hook. The history is plugin-level, so a note switch needs no per-view reaction. */
  onFileChange(): void {}

  /**
   * Roll `spec` + `modifier` under the current (or overridden) mode. Builds a
   * trivial AST: advantage/disadvantage become an extra die dropped low/high,
   * extra pools become extra dice terms, the modifier a number term.
   * @param spec dice pool to roll (defaults to a single d20)
   */
  roll(label: string, modifier: number, spec: DiceSpec = { ...DEFAULT_DICE }, opts: RollOpts = {}): void {
    const mode = opts.mode ?? this.mode;
    const primary: DiceNode = {
      kind: "dice",
      count: Math.max(1, spec.count) + (mode === "normal" ? 0 : 1),
      sides: spec.sides,
      ops: mode === "advantage" ? [{ t: "dl", n: 1 }] : mode === "disadvantage" ? [{ t: "dh", n: 1 }] : [],
    };
    const terms: RollTerm[] = [{ neg: false, node: primary }];
    for (const ex of opts.extra ?? [])
      terms.push({ neg: false, node: { kind: "dice", count: Math.max(1, ex.count), sides: ex.sides, ops: [] } });
    if (modifier) terms.push({ neg: modifier < 0, node: { kind: "num", value: Math.abs(modifier) } });

    this.rollAst(label, { terms }, {
      parts: opts.parts,
      stay: opts.stay,
      tag: this.modeTag(mode),
      mode,
      reroll: () => this.roll(label, modifier, spec, opts),
    });
  }

  /** Evaluate and resolve a full roll AST: animate, toast, and record it. */
  rollAst(label: string, ast: RollAst, opts: RollAstOpts = {}): void {
    const karmic = this.settings?.karmicRolls === true;
    const env: RollEnv = {
      roll1: (sides) => rollFace(sides, karmic),
      resolve: opts.resolve ?? this.noteResolver(),
      crit: this.critRules(),
    };
    const res = evalRoll(ast, env);
    const tag = opts.tag ?? "";
    const total = res.total;
    const groups: RollAnimGroup[] = res.groups.map((g) => ({ sides: g.sides, faces: g.faces, dropped: g.dropped }));
    const parts: RollPart[] =
      opts.parts ??
      res.parts
        .filter((p) => p.ref !== undefined || p.value !== 0)
        .map((p) => ({ label: p.ref ? this.refLabel(p.ref) : this.i18n.t("roll.partMod"), value: p.value }));

    const notation = serializeRoll(ast);
    const brief = `${label}${tag}: ${total}`;
    const redo = opts.reroll ?? (() => this.rollAst(label, ast, opts));

    const commit = () => {
      const file = this.app?.workspace.getActiveFile();
      const rec: RollRecord = {
        id: genId(),
        time: Date.now(),
        note: file?.path ?? null,
        noteName: file?.basename,
        label: `${label}${tag}`,
        text: `${brief}   (${this.detailText(res)})`,
        brief,
        total,
        mode: opts.mode ?? "normal",
        tone: res.tone,
        dice: notation,
      };
      this.history?.append(rec, redo);
      new Notice(brief, 4000);
    };

    if (this.settings?.diceAnim) {
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

  // -- helpers ---------------------------------------------------------------

  private modeTag(mode: RollMode): string {
    return mode === "advantage"
      ? " " + this.i18n.t("roll.tagAdvantage")
      : mode === "disadvantage"
        ? " " + this.i18n.t("roll.tagDisadvantage")
        : "";
  }

  /** Short form for a property reference shown in the chain (reuses modifier short forms). */
  private refLabel(name: string): string {
    return this.settings ? abbrFor(this.settings, name) : name;
  }

  /** Resolve a reference against the active note's frontmatter numbers (pre-A1 resolver). */
  private noteResolver(): (name: string) => number | undefined {
    const app = this.app;
    return (name) => {
      const file = app?.workspace.getActiveFile();
      if (!file || !app) return undefined;
      const fm = app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
      if (!fm) return undefined;
      const key = Object.keys(fm).find((k) => k.toLowerCase() === name.toLowerCase());
      if (key === undefined) return undefined;
      const v = Number(fm[key]);
      return Number.isFinite(v) ? v : undefined;
    };
  }

  /** Crit/fail policy from settings: per-die crit thresholds plus the fail-on-1 toggle. */
  private critRules(): CritRules {
    const ranges = this.settings?.critRanges ?? {};
    const failOnOne = this.settings?.failOnOne !== false;
    return {
      critFrom: (sides) => {
        const r = ranges[String(sides)];
        return typeof r === "number" && r >= 1 ? r : sides;
      },
      failAt: failOnOne ? 1 : null,
    };
  }

  /** Readable breakdown for the log: per-group faces (dropped parenthesized) plus the modifier parts. */
  private detailText(res: RollResult): string {
    const segs: string[] = [];
    for (const g of res.groups) {
      if (g.faces.length === 1 && !g.success && !g.dropped[0]) {
        segs.push(String(g.value));
        continue;
      }
      const inner = g.faces.map((f, k) => (g.dropped[k] ? `(${f})` : String(f))).join(", ");
      segs.push(`[${inner}]${g.success ? " => " : " -> "}${g.value}`);
    }
    let txt = segs.join(" + ");
    for (const p of res.parts) {
      if (p.ref === undefined && p.value === 0) continue;
      txt += ` ${fmtMod(p.value)}${p.ref ? " " + this.refLabel(p.ref) : ""}`;
    }
    return txt;
  }
}
