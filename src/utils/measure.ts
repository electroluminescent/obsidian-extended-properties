/**
 * Working out what a typed value means.
 *
 * A numeric field takes arithmetic - `12*3`, `(8+4)/2` - and measurements with
 * their units - `1'2" - 5cm`, `3 lb + 12 oz`. Every measurement is converted
 * into the unit that quantity is kept in (the user's setting), leaving plain
 * arithmetic, which the expression engine already knows how to evaluate.
 *
 * Pure: the unit table and the expression engine are both pure, and so is this.
 */

import { evalExpr, parseExpr } from "../core/expr";
import { aliasesByLength, preferredUnit, unitByAlias, type Quantity } from "./units";

/** A number with a unit attached, as it was typed. */
const NUMBER = /(\d+(?:\.\d+)?|\.\d+)\s*/y;

/**
 * Rewrite every measurement in `text` as a plain number in its quantity's
 * preferred unit, leaving operators, brackets and bare numbers alone.
 *
 * Feet and inches need no separator: `5'6"` is five feet plus six inches, the
 * way it is written everywhere, so a unit directly followed by another number
 * is added rather than treated as two terms.
 */
export function toPlainMath(text: string, units?: Record<string, string>): string {
  const aliases = aliasesByLength();
  let out = "";
  let i = 0;
  let lastWasMeasure = false;
  while (i < text.length) {
    NUMBER.lastIndex = i;
    const m = NUMBER.exec(text);
    if (!m) {
      const ch = text[i];
      // Anything that is not part of a measurement passes through, and ends
      // any run of them (so "5' 6\" + 2" is one measurement plus two).
      if (!/\s/.test(ch)) lastWasMeasure = false;
      out += ch;
      i++;
      continue;
    }
    const num = Number(m[1]);
    i = NUMBER.lastIndex;
    // The longest alias that follows, if any.
    let hit: { alias: string; quantity: Quantity; factor: number } | null = null;
    for (const { alias, unit } of aliases) {
      if (text.slice(i, i + alias.length).toLowerCase() !== alias.toLowerCase()) continue;
      // A word unit must end here: "3 mint" is not three minutes.
      const after = text[i + alias.length] ?? "";
      if (/[a-z]/i.test(alias[alias.length - 1]) && /[a-z0-9]/i.test(after)) continue;
      hit = { alias, quantity: unit.quantity, factor: unit.factor };
      break;
    }
    if (!hit) {
      out += (lastWasMeasure ? " + " : "") + String(num);
      lastWasMeasure = false;
      continue;
    }
    const to = preferredUnit(hit.quantity, units);
    const converted = (num * hit.factor) / to.factor;
    // A measurement straight after another (5'6") adds to it.
    out += (lastWasMeasure ? " + " : "") + String(converted);
    i += hit.alias.length;
    lastWasMeasure = true;
  }
  return out;
}

/**
 * What a typed value works out to, or undefined if it does not work out at
 * all. An empty field is nothing rather than zero, so a caller can tell "no
 * value" from "0".
 */
export function evalMeasure(text: string, units?: Record<string, string>): number | undefined {
  const raw = text.trim();
  if (!raw) return undefined;
  const plain = toPlainMath(raw, units);
  const ast = parseExpr(plain);
  if (!ast) return undefined;
  const n = evalExpr(ast, { resolve: () => undefined });
  return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

/**
 * The units a particular field reads in. A property that names its own unit
 * ("ft", "kg") is kept in that one, whatever the vault-wide setting says for
 * that quantity - the number stored belongs to the property, so the property's
 * own unit wins. Every other quantity still follows the settings.
 *
 * A unit the table does not know ("XP", "%") changes nothing.
 */
export function unitsForField(units: Record<string, string> | undefined, fieldUnit?: string): Record<string, string> | undefined {
  const u = fieldUnit ? unitByAlias(fieldUnit) : undefined;
  return u ? { ...(units ?? {}), [u.quantity]: u.id } : units;
}

/** Whether `text` is anything more than a plain number. */
export function needsEval(text: string): boolean {
  return !/^\s*-?(\d+(\.\d+)?|\.\d+)\s*$/.test(text);
}

/** Every unit alias that may be typed, for a field's placeholder or help. */
export function knownUnitAlias(text: string): boolean {
  return !!unitByAlias(text);
}
