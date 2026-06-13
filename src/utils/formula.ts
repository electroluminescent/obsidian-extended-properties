/**
 * The "formula" value type's single-variable compiler.
 *
 * Thin adapter over the shared expression engine (`core/expr.ts`): the same
 * grammar and function library, with the single free variable `x`. Kept as a
 * separate entry point because the numeric "formula" value type and the
 * settings derivation editor want a ready-to-call `(x) => number`.
 */

import { evalExpr, parseExpr } from "../core/expr";

/** Compiled single-variable function. */
export type Formula = (x: number) => number;

/**
 * Compile `expr` into a function of `x`.
 * Returns null when the expression is syntactically invalid or evaluates to a
 * non-finite number at x = 1 (so the settings editor can reject it inline).
 */
export function compileFormula(expr: string): Formula | null {
  const ast = parseExpr(expr);
  if (!ast) return null;
  const fn: Formula = (x) => {
    const v = evalExpr(ast, { resolve: (n) => (n.toLowerCase() === "x" ? x : undefined) });
    return v === undefined ? NaN : v;
  };
  const probe = fn(1);
  if (typeof probe !== "number" || !Number.isFinite(probe)) return null;
  return fn;
}

/**
 * Numerically invert `f` on [min, max]: find the x whose f(x) is closest to
 * `target`. Used so typing a value moves a formula-driven slider sensibly.
 */
export function invertFormula(f: Formula, target: number, min: number, max: number): number {
  const N = 400;
  let bestX = min, bestD = Infinity;
  for (let k = 0; k <= N; k++) {
    const x = min + ((max - min) * k) / N;
    const y = f(x);
    if (Number.isFinite(y)) {
      const d = Math.abs(y - target);
      if (d < bestD) { bestD = d; bestX = x; }
    }
  }
  return bestX;
}
