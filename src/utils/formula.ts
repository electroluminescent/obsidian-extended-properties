/**
 * A tiny, safe math-expression compiler for the "formula" value type.
 *
 * Grammar (recursive descent, no `eval`):
 *
 *     expr   := term (("+" | "-") term)*
 *     term   := factor (("*" | "/") factor)*
 *     factor := ("+" | "-") factor | base ("^" factor)*
 *     base   := number | "x" | "pi" | "e" | name "(" expr ("," expr)* ")" | "(" expr ")"
 *
 * Supported functions: sqrt, cbrt, abs, sin, cos, tan, asin, acos, atan, exp,
 * floor, ceil, round, sign, ln, log (log10 or log(value, base)), pow, min, max.
 */

/** Compiled single-variable function. */
export type Formula = (x: number) => number;

const UNARY: Record<string, (n: number) => number> = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs,
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  exp: Math.exp, floor: Math.floor, ceil: Math.ceil,
  round: Math.round, sign: Math.sign,
  ln: Math.log, log: (v) => Math.log10(v),
};

/**
 * Compile `expr` into a function of `x`.
 * Returns null when the expression is syntactically invalid or evaluates to
 * a non-number (probed at x = 1).
 */
export function compileFormula(expr: string): Formula | null {
  const s = expr;
  let i = 0;
  const ws = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  const peek = () => s[i];

  function parseExpr(): Formula {
    let n = parseTerm();
    ws();
    while (peek() === "+" || peek() === "-") {
      const op = s[i++];
      const r = parseTerm();
      const a = n;
      n = op === "+" ? (x) => a(x) + r(x) : (x) => a(x) - r(x);
      ws();
    }
    return n;
  }

  function parseTerm(): Formula {
    let n = parseFactor();
    ws();
    while (peek() === "*" || peek() === "/") {
      const op = s[i++];
      const r = parseFactor();
      const a = n;
      n = op === "*" ? (x) => a(x) * r(x) : (x) => a(x) / r(x);
      ws();
    }
    return n;
  }

  function parseFactor(): Formula {
    ws();
    if (peek() === "-") { i++; const f = parseFactor(); return (x) => -f(x); }
    if (peek() === "+") { i++; return parseFactor(); }
    let n = parseBase();
    ws();
    while (peek() === "^") {
      i++;
      const r = parseFactor();
      const a = n;
      n = (x) => Math.pow(a(x), r(x));
      ws();
    }
    return n;
  }

  function parseBase(): Formula {
    ws();
    const c = peek();
    if (c === "(") {
      i++;
      const e = parseExpr();
      ws();
      if (peek() === ")") i++; else throw 0;
      return e;
    }
    if (c !== undefined && /[0-9.]/.test(c)) {
      let num = "";
      while (i < s.length && /[0-9.]/.test(s[i])) num += s[i++];
      if ((num.match(/\./g) || []).length > 1 || num === ".") throw 0;
      const v = parseFloat(num);
      if (!Number.isFinite(v)) throw 0;
      return () => v;
    }
    if (c !== undefined && /[a-zA-Z_]/.test(c)) {
      let id = "";
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) id += s[i++];
      ws();
      if (peek() === "(") {
        i++;
        const args: Formula[] = [parseExpr()];
        ws();
        while (peek() === ",") { i++; args.push(parseExpr()); ws(); }
        if (peek() === ")") i++; else throw 0;
        const a0 = args[0];
        if (id === "log" && args.length === 2) { const b = args[1]; return (x) => Math.log(a0(x)) / Math.log(b(x)); }
        if (UNARY[id]) { const fn = UNARY[id]; return (x) => fn(a0(x)); }
        if (id === "pow") { const b = args[1]; return (x) => Math.pow(a0(x), b(x)); }
        if (id === "min") return (x) => Math.min(...args.map((a) => a(x)));
        if (id === "max") return (x) => Math.max(...args.map((a) => a(x)));
        throw 0;
      }
      if (id === "x") return (x) => x;
      if (id === "pi") return () => Math.PI;
      if (id === "e") return () => Math.E;
      throw 0;
    }
    throw 0;
  }

  try {
    ws();
    const fn = parseExpr();
    ws();
    if (i !== s.length) return null;
    const probe = fn(1);
    if (typeof probe !== "number" || Number.isNaN(probe)) return null;
    return fn;
  } catch {
    return null;
  }
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
