/**
 * Saved roll macros — "custom roll objects".
 *
 * A macro is a named roll: a chain of dice/number segments plus the roller's
 * mode and repeat count (the pre-AST representation, roadmap A3/A2). The same
 * execution path serves the roller widget's "Roll" button, a macro chip, and
 * a command-palette command, so all three behave identically.
 *
 * Pure helpers (no Obsidian imports) so they stay trivially testable; the
 * roll itself is delegated to the {@link RollService} the caller supplies.
 */

import type { I18n } from "../../i18n/i18n";
import type { EPSettings, RollMacro, RollSeg } from "../../core/model";
import { formatDice, parseDice, parseDiceOrDefault } from "../../utils/dice";
import type { RollMode, RollPart, RollService } from "./roll-service";

/** Coerce an arbitrary string to a roll mode. */
function asMode(mode: string | undefined): RollMode {
  return mode === "advantage" || mode === "disadvantage" ? mode : "normal";
}

/**
 * Execute a segment chain through `svc`, exactly as the roller widget does:
 * the first dice group is the (mode-bearing) animated pool, further dice
 * groups roll alongside, and non-zero numbers join as labeled modifier parts.
 * `times > 1` rolls several cards that stay on screen.
 */
export function runRoll(
  svc: RollService,
  i18n: I18n,
  o: { segs: RollSeg[]; mode?: string; times?: number; label: string }
): void {
  const dice = (o.segs ?? []).filter((s) => s.dice !== undefined);
  const spec = parseDiceOrDefault(dice[0]?.dice);
  const extra = dice.slice(1).map((s) => parseDiceOrDefault(s.dice));
  const parts: RollPart[] = [];
  let modifier = 0;
  for (const s of o.segs ?? []) {
    if (typeof s.add === "number" && s.add !== 0) {
      parts.push({ label: i18n.t("roll.partMod"), value: s.add });
      modifier += s.add;
    }
  }
  const mode = asMode(o.mode);
  const n = Math.max(1, Math.min(20, o.times ?? 1));
  for (let i = 0; i < n; i++) {
    svc.roll(n > 1 ? `${o.label} #${i + 1}` : o.label, modifier, spec, {
      parts,
      extra,
      mode,
      stay: n > 1,
    });
  }
}

/** Run a saved macro. */
export function runMacro(svc: RollService, i18n: I18n, m: RollMacro): void {
  runRoll(svc, i18n, {
    segs: m.segs ?? [],
    mode: m.mode,
    times: m.times,
    label: m.name || i18n.t("roller.title"),
  });
}

/** Macros that apply to a note type: global (no scope) plus ones scoped to it. */
export function applicableMacros(settings: EPSettings, typeKey: string | null): RollMacro[] {
  const list = Array.isArray(settings.macros) ? settings.macros : [];
  return list.filter((m) => !m.typeKey || (!!typeKey && m.typeKey === typeKey));
}

/** Canonical text form of a segment chain, e.g. "2d6 + 1d8 + 3 - 1". */
export function segsToText(segs: RollSeg[]): string {
  const tokens: string[] = [];
  for (const s of segs ?? []) {
    if (s.dice !== undefined) {
      const d = parseDice(s.dice);
      tokens.push(d ? formatDice(d) : s.dice);
    } else if (typeof s.add === "number") {
      tokens.push(String(s.add));
    }
  }
  let txt = "";
  tokens.forEach((tok, i) => {
    if (i === 0) txt = tok;
    else if (tok.startsWith("-")) txt += " - " + tok.slice(1);
    else txt += " + " + tok;
  });
  return txt;
}

/**
 * Parse a chain text ("2d6 + 1d8 + 3 - 1") into segments. Returns null on any
 * malformed term so callers can show a validation error and keep the old value.
 * Signs apply to flat numbers; dice terms keep their canonical notation.
 */
export function textToSegs(text: string): RollSeg[] | null {
  const compact = (text ?? "").replace(/\s+/g, "");
  if (!compact) return [];
  const tokens = compact.match(/[+-]?[^+-]+/g);
  if (!tokens) return null;
  const segs: RollSeg[] = [];
  for (const raw of tokens) {
    let tok = raw;
    let sign = 1;
    if (tok.startsWith("+")) tok = tok.slice(1);
    else if (tok.startsWith("-")) {
      sign = -1;
      tok = tok.slice(1);
    }
    if (!tok) return null;
    const d = parseDice(tok);
    if (d) {
      segs.push({ dice: formatDice(d) });
      continue;
    }
    const num = Number(tok);
    if (Number.isFinite(num)) {
      segs.push({ add: sign * num });
      continue;
    }
    return null;
  }
  return segs;
}
