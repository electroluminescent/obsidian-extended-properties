/**
 * Saved roll macros — "custom roll objects" — and the bridge between the
 * roller widget's segment chips and the {@link RollAst} engine.
 *
 * A macro is a named roll: a chain of segments (dice notation, numbers,
 * property references) plus the roller's mode and repeat count. The same
 * executor backs the roller's "Roll" button, a macro chip, and a
 * command-palette command, so all three behave identically. Segments and
 * full expression text round-trip through the AST, so a chip chain and a
 * typed expression are two views of one thing.
 */

import type { I18n } from "../../i18n/i18n";
import type { EPSettings, RollMacro, RollSeg } from "../../core/model";
import { DiceNode, parseRoll, RollAst, RollTerm, serializeNode, serializeRoll } from "../../utils/dice-expr";
import type { RollMode, RollService } from "./roll-service";

/** Convert the roller's segment chain into a roll AST. */
export function segsToAst(segs: RollSeg[]): RollAst {
  const terms: RollTerm[] = [];
  for (const s of segs ?? []) {
    if (s.dice !== undefined) {
      const parsed = parseRoll(s.dice);
      const node: DiceNode =
        parsed && parsed.terms[0]?.node.kind === "dice"
          ? (parsed.terms[0].node as DiceNode)
          : { kind: "dice", count: 1, sides: 20, ops: [] };
      terms.push({ neg: !!s.neg, node });
    } else if (typeof s.add === "number") {
      terms.push(
        s.add < 0
          ? { neg: true, node: { kind: "num", value: -s.add } }
          : { neg: !!s.neg, node: { kind: "num", value: s.add } }
      );
    } else if (s.ref) {
      terms.push({ neg: !!s.neg, node: { kind: "ref", name: s.ref } });
    }
  }
  return { terms };
}

/** Convert a roll AST back into roller segments (chips). */
export function astToSegs(ast: RollAst): RollSeg[] {
  return ast.terms.map((t): RollSeg => {
    const n = t.node;
    if (n.kind === "dice") return { dice: serializeNode(n), neg: t.neg || undefined };
    if (n.kind === "num") return { add: t.neg ? -n.value : n.value };
    return { ref: n.name, neg: t.neg || undefined };
  });
}

/** Canonical text of a segment chain, e.g. "2d6kh1 + 1d8 + DEX + 3". */
export function segsToText(segs: RollSeg[]): string {
  return serializeRoll(segsToAst(segs));
}

/** Parse expression text into segments; null on malformed input. */
export function textToSegs(text: string): RollSeg[] | null {
  const ast = parseRoll(text);
  return ast ? astToSegs(ast) : null;
}

function asMode(mode: string | undefined): RollMode {
  return mode === "advantage" || mode === "disadvantage" ? mode : "normal";
}

/**
 * Execute a segment chain through `svc`, mapping advantage/disadvantage onto
 * the first dice group (one extra die, dropped low/high). `times > 1` rolls
 * several cards that stay on screen.
 */
export function runRoll(
  svc: RollService,
  i18n: I18n,
  o: { segs: RollSeg[]; mode?: string; times?: number; label: string }
): void {
  const mode = asMode(o.mode);
  const n = Math.max(1, Math.min(20, o.times ?? 1));
  const tag =
    mode === "advantage"
      ? " " + i18n.t("roll.tagAdvantage")
      : mode === "disadvantage"
        ? " " + i18n.t("roll.tagDisadvantage")
        : "";
  for (let i = 0; i < n; i++) {
    const ast = segsToAst(o.segs); // a fresh AST per roll
    if (mode !== "normal") {
      const first = ast.terms.find((t) => t.node.kind === "dice");
      if (first) {
        const dn = first.node as DiceNode;
        dn.count += 1;
        dn.ops = [...dn.ops, mode === "advantage" ? { t: "dl", n: 1 } : { t: "dh", n: 1 }];
      }
    }
    svc.rollAst(n > 1 ? `${o.label} #${i + 1}` : o.label, ast, { stay: n > 1, tag, mode });
  }
}

/** Run a saved macro. */
export function runMacro(svc: RollService, i18n: I18n, m: RollMacro): void {
  runRoll(svc, i18n, { segs: m.segs ?? [], mode: m.mode, times: m.times, label: m.name || i18n.t("roller.title") });
}

/** Macros that apply to a note type: global (no scope) plus ones scoped to it. */
export function applicableMacros(settings: EPSettings, typeKey: string | null): RollMacro[] {
  const list = Array.isArray(settings.macros) ? settings.macros : [];
  return list.filter((m) => !m.typeKey || (!!typeKey && m.typeKey === typeKey));
}
