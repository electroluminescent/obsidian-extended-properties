/**
 * The expression engine — one generic, pure math evaluator shared by derived
 * properties, the `formula` value type, per-influence expressions and (later)
 * conditional visibility and validation messages.
 *
 * Grammar (Pratt-parsed):
 *
 *   expr   := or
 *   or     := and ("||" and)*
 *   and    := cmp ("&&" cmp)*
 *   cmp    := add (("==" | "!=" | "<" | "<=" | ">" | ">=") add)*
 *   add    := mul (("+" | "-") mul)*
 *   mul    := unary (("*" | "/" | "%") unary)*
 *   unary  := ("-" | "!" | "+") unary | power
 *   power  := atom ("^" unary)?            (right-associative)
 *   atom   := number | name | name "(" args ")" | "(" expr ")"
 *   name   := identifier | "[" any chars "]"   (brackets quote names with spaces)
 *
 * References resolve through the caller's `resolve(name)`; functions not in the
 * builtin library fall back to `env.fn(name)` (the user-defined derivations).
 * `if(cond, a, b)` is lazy. Anything unresolved, NaN or non-finite makes the
 * whole evaluation return `undefined`, so a typo degrades to "—", never throws.
 *
 * Zero Obsidian imports — trivially unit-testable.
 */

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export type ExprNode =
  | { kind: "num"; value: number }
  | { kind: "str"; value: string }
  | { kind: "ref"; name: string }
  | { kind: "unary"; op: "-" | "!"; arg: ExprNode }
  | { kind: "binary"; op: BinOp; left: ExprNode; right: ExprNode }
  | { kind: "call"; name: string; args: ExprNode[] };

export type BinOp =
  | "+" | "-" | "*" | "/" | "%" | "^"
  | "==" | "!=" | "<" | "<=" | ">" | ">="
  | "&&" | "||";

/** Evaluation environment: property resolver plus optional user-function lookup. */
export interface ExprEnv {
  /** Resolve a referenced name to a number, or undefined when unknown. */
  resolve(name: string): number | undefined;
  /** Resolve a referenced name to a string value (conditional visibility). */
  resolveStr?(name: string): string | undefined;
  /** Resolve a non-builtin function name (e.g. a user derivation). */
  fn?(name: string): ((args: number[]) => number | undefined) | undefined;
  /** Aggregate `sum`/`avg`/`count`/`min`/`max` of `key` over all notes of `type`. */
  agg?(fn: string, type: string, key: string): number | undefined;
  /** The value of `key` on the note linked in this note's `linkProp` property. */
  lookup?(linkProp: string, key: string): number | undefined;
}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type Tok =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "name"; v: string }
  | { t: "op"; v: BinOp | "!" }
  | { t: "("; v?: undefined }
  | { t: ")"; v?: undefined }
  | { t: ","; v?: undefined }
  | { t: "eof"; v?: undefined };

const TWO = new Set(["==", "!=", "<=", ">=", "&&", "||"]);

function tokenize(s: string): Tok[] | null {
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      i++;
      let str = "";
      while (i < s.length && s[i] !== q) str += s[i++];
      if (s[i] !== q) return null; // unterminated string literal
      i++;
      toks.push({ t: "str", v: str });
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let n = "";
      while (i < s.length && /[0-9.]/.test(s[i])) n += s[i++];
      if ((n.match(/\./g) || []).length > 1 || n === ".") return null;
      const v = parseFloat(n);
      if (!Number.isFinite(v)) return null;
      toks.push({ t: "num", v });
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let id = "";
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) id += s[i++];
      // Dotted continuation for modifier references: INT.s, intelligence.s
      while (s[i] === "." && /[A-Za-z_]/.test(s[i + 1] ?? "")) {
        id += s[i++];
        while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) id += s[i++];
      }
      toks.push({ t: "name", v: id });
      continue;
    }
    if (c === "[") {
      // Cross-note reference: [[Note]] optionally followed by .accessor.
      if (s[i + 1] === "[") {
        const close = s.indexOf("]]", i + 2);
        if (close < 0) return null;
        let name = s.slice(i, close + 2);
        i = close + 2;
        if (s[i] === ".") {
          i++;
          if (s[i] === "[") {
            const e2 = s.indexOf("]", i + 1);
            if (e2 < 0) return null;
            name += "." + s.slice(i + 1, e2);
            i = e2 + 1;
          } else {
            const am = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(s.slice(i));
            if (!am) return null;
            name += "." + am[0];
            i += am[0].length;
          }
        }
        toks.push({ t: "name", v: name });
        continue;
      }
      const end = s.indexOf("]", i + 1);
      if (end < 0) return null;
      const name = s.slice(i + 1, end).trim();
      if (!name) return null;
      toks.push({ t: "name", v: name });
      i = end + 1;
      continue;
    }
    const two = s.slice(i, i + 2);
    if (TWO.has(two)) {
      toks.push({ t: "op", v: two as BinOp });
      i += 2;
      continue;
    }
    if ("+-*/%^<>".includes(c)) {
      toks.push({ t: "op", v: c as BinOp });
      i++;
      continue;
    }
    if (c === "!") {
      toks.push({ t: "op", v: "!" });
      i++;
      continue;
    }
    if (c === "(") { toks.push({ t: "(" }); i++; continue; }
    if (c === ")") { toks.push({ t: ")" }); i++; continue; }
    if (c === ",") { toks.push({ t: "," }); i++; continue; }
    return null;
  }
  toks.push({ t: "eof" });
  return toks;
}

// ---------------------------------------------------------------------------
// Parser (Pratt)
// ---------------------------------------------------------------------------

/** Left binding power per infix operator. `^` is right-associative. */
const BP: Record<string, number> = {
  "||": 1, "&&": 2,
  "==": 3, "!=": 3, "<": 4, "<=": 4, ">": 4, ">=": 4,
  "+": 5, "-": 5, "*": 6, "/": 6, "%": 6, "^": 8,
};
const PREFIX_BP = 7; // below `^` so -2^2 = -(2^2)

/** Parse an expression; returns null on any syntax error. */
export function parseExpr(text: string): ExprNode | null {
  const toks = tokenize(text ?? "");
  if (!toks) return null;
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];

  try {
    const ast = parseBp(0);
    if (peek().t !== "eof") return null;
    return ast;
  } catch {
    return null;
  }

  function parseBp(minBp: number): ExprNode {
    let left = nud();
    for (;;) {
      const tok = peek();
      if (tok.t !== "op" || tok.v === "!") break;
      const lbp = BP[tok.v];
      if (lbp === undefined || lbp < minBp) break;
      next();
      const rbp = tok.v === "^" ? lbp : lbp + 1;
      const right = parseBp(rbp);
      left = { kind: "binary", op: tok.v, left, right };
    }
    return left;
  }

  function nud(): ExprNode {
    const tok = next();
    if (tok.t === "num") return { kind: "num", value: tok.v };
    if (tok.t === "str") return { kind: "str", value: tok.v };
    if (tok.t === "(") {
      const e = parseBp(0);
      if (next().t !== ")") throw 0;
      return e;
    }
    if (tok.t === "op" && (tok.v === "-" || tok.v === "+" || tok.v === "!")) {
      const arg = parseBp(PREFIX_BP);
      if (tok.v === "+") return arg;
      return { kind: "unary", op: tok.v, arg };
    }
    if (tok.t === "name") {
      if (peek().t === "(") {
        next();
        const args: ExprNode[] = [];
        if (peek().t !== ")") {
          args.push(parseBp(0));
          while (peek().t === ",") {
            next();
            args.push(parseBp(0));
          }
        }
        if (next().t !== ")") throw 0;
        return { kind: "call", name: tok.v, args };
      }
      return { kind: "ref", name: tok.v };
    }
    throw 0;
  }
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

class ExprError extends Error {}

/** A runtime value: numbers for math, strings for equality in conditions. */
type Val = number | string;

/** Truthiness for boolean operators: non-zero numbers, non-empty strings. */
const truthy = (v: Val): boolean => (typeof v === "number" ? v !== 0 : v.trim().length > 0);

/** Coerce to a finite number or throw (a non-numeric string fails the term). */
function toNum(v: Val): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v.trim());
  if (!Number.isFinite(n)) throw new ExprError("not numeric: " + v);
  return n;
}

/** Equality — case-insensitive, trimmed string compare when either side is a string. */
function eqVal(a: Val, b: Val): boolean {
  if (typeof a === "string" || typeof b === "string")
    return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
  return a === b;
}

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, true: 1, false: 0 };

const FN1: Record<string, (n: number) => number> = {
  floor: Math.floor, ceil: Math.ceil, round: Math.round, abs: Math.abs, sign: Math.sign,
  sqrt: Math.sqrt, cbrt: Math.cbrt, exp: Math.exp, ln: Math.log,
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
};

const AGG = new Set(["sum", "avg", "count", "min", "max"]);
const strArg = (n: ExprNode | undefined): string => (n && n.kind === "str" ? n.value : "");

function evalNode(node: ExprNode, env: ExprEnv): Val {
  switch (node.kind) {
    case "num":
      return node.value;
    case "str":
      return node.value;
    case "ref": {
      const lc = node.name.toLowerCase();
      if (lc in CONSTS) return CONSTS[lc];
      const v = env.resolve(node.name);
      if (v !== undefined && Number.isFinite(v)) return v;
      const sv = env.resolveStr?.(node.name);
      if (sv !== undefined) return sv;
      throw new ExprError("unresolved: " + node.name);
    }
    case "unary":
      if (node.op === "!") return truthy(evalNode(node.arg, env)) ? 0 : 1;
      return -toNum(evalNode(node.arg, env));
    case "binary":
      return evalBinary(node, env);
    case "call":
      return evalCall(node, env);
  }
}

function evalBinary(node: Extract<ExprNode, { kind: "binary" }>, env: ExprEnv): Val {
  const { op } = node;
  // Boolean operators short-circuit on truthiness (numbers and strings).
  if (op === "&&") return truthy(evalNode(node.left, env)) && truthy(evalNode(node.right, env)) ? 1 : 0;
  if (op === "||") return truthy(evalNode(node.left, env)) || truthy(evalNode(node.right, env)) ? 1 : 0;
  const a = evalNode(node.left, env);
  const b = evalNode(node.right, env);
  // Equality is string-aware (case-insensitive) when either operand is a
  // string — e.g. `Class == "Wizard"`; everything else coerces to number.
  if (op === "==") return eqVal(a, b) ? 1 : 0;
  if (op === "!=") return eqVal(a, b) ? 0 : 1;
  const x = toNum(a);
  const y = toNum(b);
  switch (op) {
    case "+": return x + y;
    case "-": return x - y;
    case "*": return x * y;
    case "/": return x / y;
    case "%": return x % y;
    case "^": return Math.pow(x, y);
    case "<": return x < y ? 1 : 0;
    case "<=": return x <= y ? 1 : 0;
    case ">": return x > y ? 1 : 0;
    case ">=": return x >= y ? 1 : 0;
  }
  throw new ExprError("op: " + op);
}

function evalCall(node: Extract<ExprNode, { kind: "call" }>, env: ExprEnv): Val {
  const name = node.name;
  const lc = name.toLowerCase();
  if (lc === "if") {
    if (node.args.length !== 3) throw new ExprError("if needs 3 args");
    return truthy(evalNode(node.args[0], env)) ? evalNode(node.args[1], env) : evalNode(node.args[2], env);
  }
  // Cross-note aggregates: sum/avg/count/min/max("Type", "Key"). Detected by a
  // string first argument so numeric min/max(...) keep working.
  if (AGG.has(lc) && node.args[0]?.kind === "str") {
    const r = env.agg?.(lc, strArg(node.args[0]), strArg(node.args[1]));
    if (r === undefined || !Number.isFinite(r)) throw new ExprError("agg: " + name);
    return r;
  }
  // prop("LinkProp", "Key"): the note linked in this note's LinkProp, its Key.
  if ((lc === "prop" || lc === "lookup") && node.args[0]?.kind === "str") {
    const r = env.lookup?.(strArg(node.args[0]), strArg(node.args[1]));
    if (r === undefined || !Number.isFinite(r)) throw new ExprError("lookup: " + name);
    return r;
  }
  const a = node.args.map((x) => toNum(evalNode(x, env)));
  switch (lc) {
    case "min": return Math.min(...a);
    case "max": return Math.max(...a);
    case "clamp": return Math.min(Math.max(a[0], a[1]), a[2]);
    case "pow": return Math.pow(a[0], a[1]);
    case "log": return a.length >= 2 ? Math.log(a[0]) / Math.log(a[1]) : Math.log10(a[0]);
    case "today": return Math.floor(Date.now() / 86400000); // whole days since epoch
    case "days": return (a[1] ?? 0) - (a[0] ?? 0); // days from a to b (day-numbers)
  }
  if (lc in FN1) return FN1[lc](a[0]);
  const uf = env.fn?.(name);
  if (uf) {
    const r = uf(a);
    if (r === undefined || !Number.isFinite(r)) throw new ExprError("fn: " + name);
    return r;
  }
  throw new ExprError("unknown fn: " + name);
}

/** Evaluate `ast`; returns undefined on any unresolved reference or non-finite result. */
export function evalExpr(ast: ExprNode, env: ExprEnv): number | undefined {
  try {
    const v = evalNode(ast, env);
    const n = typeof v === "number" ? v : NaN; // a string result is "not a number" here
    return Number.isFinite(n) ? n : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Evaluate `ast` as a boolean condition (conditional visibility). Numbers are
 * truthy when non-zero, strings when non-empty. Returns undefined when the
 * condition cannot be evaluated (unresolved reference or type error) so callers
 * can default such entries to *visible* rather than hiding them.
 */
export function evalCondition(ast: ExprNode, env: ExprEnv): boolean | undefined {
  try {
    return truthy(evalNode(ast, env));
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Dependencies & serialization
// ---------------------------------------------------------------------------

/** Distinct reference names used in `ast` (constants pi/e/true/false excluded). */
export function deps(ast: ExprNode): string[] {
  const out = new Set<string>();
  const walk = (n: ExprNode): void => {
    if (n.kind === "ref") {
      if (!(n.name.toLowerCase() in CONSTS)) out.add(n.name);
    } else if (n.kind === "unary") walk(n.arg);
    else if (n.kind === "binary") {
      walk(n.left);
      walk(n.right);
    } else if (n.kind === "call") n.args.forEach(walk);
  };
  walk(ast);
  return [...out];
}

function quote(name: string): string {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) ? name : `[${name}]`;
}

/**
 * Render `ast` back to text. `mapRef` may rewrite reference names (used to show
 * the short-form denotation, e.g. `Dexterity` → `DEX`). Minimal parentheses.
 */
export function serializeExpr(ast: ExprNode, mapRef?: (name: string) => string): string {
  const ser = (n: ExprNode, parentBp: number): string => {
    switch (n.kind) {
      case "num":
        return String(n.value);
      case "str":
        return JSON.stringify(n.value);
      case "ref":
        return mapRef ? mapRef(n.name) : quote(n.name);
      case "unary":
        return n.op + ser(n.arg, PREFIX_BP);
      case "call":
        return n.name + "(" + n.args.map((a) => ser(a, 0)).join(", ") + ")";
      case "binary": {
        const bp = BP[n.op];
        const rbp = n.op === "^" ? bp : bp + 1;
        const s = `${ser(n.left, bp)} ${n.op} ${ser(n.right, rbp)}`;
        return bp < parentBp ? `(${s})` : s;
      }
    }
  };
  return ser(ast, 0);
}
