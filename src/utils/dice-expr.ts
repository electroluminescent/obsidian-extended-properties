/**
 * Dice expression engine: one textual/structural representation for any roll.
 *
 * A roll is a signed sum of terms; each term is a dice group, an integer, or
 * a property reference. Dice groups carry modifiers:
 *
 *   keep/drop   `kh` `kl` `dh` `dl` (optional count, default 1) — e.g. `4d6kh3`
 *   explode     `!` (on max) or `!N` (on ≥ N)
 *   reroll      `rN` (reroll ≤ N, recursive) or `roN` (reroll ≤ N once)
 *   success     `>=N` `>N` `<=N` `<N` `=N` — value becomes the count of hits
 *
 * Examples: `2d6kh1 + 1d8 + DEX + 3`, `4d6dl1`, `10d6>=5`, `1d10!`, `2d20kl1`
 * (= disadvantage). `d%` is shorthand for d100.
 *
 * Pure module — zero Obsidian imports — so it is trivially unit-testable. The
 * RNG and the property resolver are injected; the same resolver A1 will own
 * later can be passed straight in (here it is a name → number lookup).
 */

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

export type KeepKind = "kh" | "kl" | "dh" | "dl";

export type DiceOp =
  | { t: KeepKind; n: number }
  | { t: "explode"; on: number } // on < 0 → explode on the die's max face
  | { t: "reroll"; max: number; once: boolean }
  | { t: "success"; cmp: ">=" | ">" | "<=" | "<" | "="; v: number };

export interface DiceNode {
  kind: "dice";
  count: number;
  sides: number;
  ops: DiceOp[];
}
export interface NumNode {
  kind: "num";
  value: number;
}
export interface RefNode {
  kind: "ref";
  name: string;
}
export type RollNode = DiceNode | NumNode | RefNode;

/** A signed summand of the roll. */
export interface RollTerm {
  neg: boolean;
  node: RollNode;
}
export interface RollAst {
  terms: RollTerm[];
}

// ---------------------------------------------------------------------------
// Evaluation results
// ---------------------------------------------------------------------------

/** One resolved dice group. `dropped[i]` parallels `faces[i]`. */
export interface DiceGroupResult {
  sides: number;
  faces: number[];
  dropped: boolean[];
  /** Sum of kept faces, or — for a success group — the count of hits. */
  value: number;
  success: boolean;
}
/** A non-dice summand (a flat number, or a resolved property reference). */
export interface RollPartResult {
  /** Present when this summand came from a property reference. */
  ref?: string;
  value: number;
}
export interface RollResult {
  groups: DiceGroupResult[];
  parts: RollPartResult[];
  total: number;
  tone: "normal" | "crit" | "fail";
}

/** Crit/fail policy, read from settings; sane defaults when omitted. */
export interface CritRules {
  /** Minimum face on a `sides`-die that counts toward a crit (default = sides). */
  critFrom(sides: number): number;
  /** Face that, shown on every kept primary die, is a fail — or null to disable. */
  failAt: number | null;
}
export interface RollEnv {
  /** Roll a single die: 1..sides. */
  roll1(sides: number): number;
  /** Resolve a property reference to a number (undefined = unknown → 0). */
  resolve?(name: string): number | undefined;
  crit?: CritRules;
}

/** Hard caps so a pathological expression can never hang the render pass. */
const MAX_DICE = 500;
const MAX_ITERS = 200;

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/** Parse a dice expression; returns null on any malformed input. */
export function parseRoll(text: string): RollAst | null {
  const s = (text ?? "").trim();
  if (!s) return { terms: [] };
  let i = 0;

  const ws = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };

  const parseOps = (): DiceOp[] => {
    const ops: DiceOp[] = [];
    for (;;) {
      const rest = s.slice(i);
      let m: RegExpExecArray | null;
      if ((m = /^(kh|kl|dh|dl)(\d+)?/i.exec(rest))) {
        ops.push({ t: m[1].toLowerCase() as KeepKind, n: m[2] ? parseInt(m[2]) : 1 });
      } else if ((m = /^!(\d+)?/.exec(rest))) {
        ops.push({ t: "explode", on: m[1] ? parseInt(m[1]) : -1 });
      } else if ((m = /^(ro|r)(\d+)/i.exec(rest))) {
        ops.push({ t: "reroll", max: parseInt(m[2]), once: m[1].toLowerCase() === "ro" });
      } else if ((m = /^(>=|<=|>|<|=)(\d+)/.exec(rest))) {
        ops.push({ t: "success", cmp: m[1] as ">=" | ">" | "<=" | "<" | "=", v: parseInt(m[2]) });
      } else break;
      i += m[0].length;
    }
    return ops;
  };

  const parseRef = (): RollNode | null => {
    ws();
    if (s[i] === "[") {
      const end = s.indexOf("]", i + 1);
      if (end < 0) return null;
      const name = s.slice(i + 1, end).trim();
      i = end + 1;
      return name ? { kind: "ref", name } : null;
    }
    const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(s.slice(i));
    if (m) {
      i += m[0].length;
      return { kind: "ref", name: m[0] };
    }
    return null;
  };

  const parseNode = (): RollNode | null => {
    ws();
    const start = i;
    let digits = "";
    while (i < s.length && /\d/.test(s[i])) digits += s[i++];
    if (i < s.length && (s[i] === "d" || s[i] === "D")) {
      i++; // consume 'd'
      let sides = 0;
      if (s[i] === "%") {
        sides = 100;
        i++;
      } else {
        let sd = "";
        while (i < s.length && /\d/.test(s[i])) sd += s[i++];
        if (!sd) {
          // Not dice (e.g. an identifier like "dex"): backtrack to a reference.
          i = start;
          return parseRef();
        }
        sides = parseInt(sd);
      }
      const count = digits ? parseInt(digits) : 1;
      if (count < 1 || sides < 2) return null;
      return { kind: "dice", count, sides, ops: parseOps() };
    }
    if (digits) return { kind: "num", value: parseInt(digits) };
    return parseRef();
  };

  const terms: RollTerm[] = [];
  ws();
  let neg = false;
  if (s[i] === "+" || s[i] === "-") {
    neg = s[i] === "-";
    i++;
  }
  for (;;) {
    const node = parseNode();
    if (!node) return null;
    terms.push({ neg, node });
    ws();
    if (i >= s.length) break;
    if (s[i] === "+" || s[i] === "-") {
      neg = s[i] === "-";
      i++;
      continue;
    }
    return null; // unexpected trailing input
  }
  return { terms };
}

// ---------------------------------------------------------------------------
// Serializer (canonical text)
// ---------------------------------------------------------------------------

export function serializeNode(n: RollNode, mapRef?: (name: string) => string): string {
  if (n.kind === "num") return String(n.value);
  if (n.kind === "ref") {
    if (mapRef) return mapRef(n.name);
    return /[^A-Za-z0-9_]/.test(n.name) ? `[${n.name}]` : n.name;
  }
  let s = (n.count > 1 ? n.count : "") + "d" + n.sides;
  for (const op of n.ops) {
    if (op.t === "kh" || op.t === "kl" || op.t === "dh" || op.t === "dl") s += op.t + (op.n !== 1 ? op.n : "");
    else if (op.t === "explode") s += "!" + (op.on > 0 ? op.on : "");
    else if (op.t === "reroll") s += (op.once ? "ro" : "r") + op.max;
    else if (op.t === "success") s += op.cmp + op.v;
  }
  return s;
}

export function serializeRoll(ast: RollAst, mapRef?: (name: string) => string): string {
  let out = "";
  ast.terms.forEach((term, idx) => {
    const txt = serializeNode(term.node, mapRef);
    if (idx === 0) out = term.neg ? "-" + txt : txt;
    else out += (term.neg ? " - " : " + ") + txt;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

function cmpHit(face: number, cmp: string, v: number): boolean {
  switch (cmp) {
    case ">=": return face >= v;
    case ">": return face > v;
    case "<=": return face <= v;
    case "<": return face < v;
    case "=": return face === v;
  }
  return false;
}

function rollDice(node: DiceNode, env: RollEnv): DiceGroupResult {
  const sides = node.sides;
  const count = Math.min(MAX_DICE, Math.max(1, node.count));
  const reroll = node.ops.find((o) => o.t === "reroll") as Extract<DiceOp, { t: "reroll" }> | undefined;
  const explode = node.ops.find((o) => o.t === "explode") as Extract<DiceOp, { t: "explode" }> | undefined;
  const explodeOn = explode ? (explode.on < 0 ? sides : explode.on) : Infinity;

  const faces: number[] = [];
  const dropped: boolean[] = [];
  const counted: number[] = []; // indices eligible for keep/drop & success
  const push = (v: number, drop: boolean): number => {
    faces.push(v);
    dropped.push(drop);
    return faces.length - 1;
  };

  for (let d = 0; d < count; d++) {
    let v = env.roll1(sides);
    if (reroll) {
      if (reroll.once) {
        if (v <= reroll.max) {
          push(v, true);
          v = env.roll1(sides);
        }
      } else {
        let it = 0;
        while (v <= reroll.max && it++ < MAX_ITERS) {
          push(v, true);
          v = env.roll1(sides);
        }
      }
    }
    counted.push(push(v, false));
    // Explosions count as their own dice.
    let cur = v;
    let it = 0;
    while (cur >= explodeOn && faces.length < MAX_DICE && it++ < MAX_ITERS) {
      cur = env.roll1(sides);
      counted.push(push(cur, false));
    }
  }

  // Keep/drop operate over the counted (non-rerolled-away) faces, in order.
  let active = counted.slice();
  for (const op of node.ops) {
    if (op.t !== "kh" && op.t !== "kl" && op.t !== "dh" && op.t !== "dl") continue;
    const asc = active.slice().sort((a, b) => faces[a] - faces[b]);
    const n = Math.max(0, Math.min(asc.length, op.n));
    let dropIdx: number[] = [];
    if (op.t === "kh") dropIdx = asc.slice(0, asc.length - n); // keep highest n → drop the lowest rest
    else if (op.t === "kl") dropIdx = asc.slice(n); // keep lowest n → drop the highest rest
    else if (op.t === "dh") dropIdx = asc.slice(asc.length - n); // drop highest n
    else if (op.t === "dl") dropIdx = asc.slice(0, n); // drop lowest n
    for (const di of dropIdx) dropped[di] = true;
    active = active.filter((idx) => !dropped[idx]);
  }

  const keptFaces = counted.filter((idx) => !dropped[idx]).map((idx) => faces[idx]);
  const success = node.ops.find((o) => o.t === "success") as Extract<DiceOp, { t: "success" }> | undefined;
  const value = success
    ? keptFaces.filter((f) => cmpHit(f, success.cmp, success.v)).length
    : keptFaces.reduce((a, b) => a + b, 0);

  return { sides, faces, dropped, value, success: !!success };
}

const DEFAULT_CRIT: CritRules = { critFrom: (s) => s, failAt: 1 };

function computeTone(primary: DiceGroupResult | null, crit: CritRules): RollResult["tone"] {
  if (!primary) return "normal";
  const kept = primary.faces.filter((_, k) => !primary.dropped[k]);
  if (kept.length === 0) return "normal";
  const from = crit.critFrom(primary.sides);
  if (kept.every((f) => f >= from)) return "crit";
  if (crit.failAt != null && kept.every((f) => f === crit.failAt)) return "fail";
  return "normal";
}

/** Evaluate an AST, rolling dice via `env.roll1` and resolving refs via `env.resolve`. */
export function evalRoll(ast: RollAst, env: RollEnv): RollResult {
  const crit = env.crit ?? DEFAULT_CRIT;
  const groups: DiceGroupResult[] = [];
  const parts: RollPartResult[] = [];
  let total = 0;
  let primary: DiceGroupResult | null = null;

  for (const term of ast.terms) {
    const sign = term.neg ? -1 : 1;
    const node = term.node;
    if (node.kind === "num") {
      parts.push({ value: sign * node.value });
      total += sign * node.value;
    } else if (node.kind === "ref") {
      const r = env.resolve?.(node.name);
      const v = typeof r === "number" && Number.isFinite(r) ? r : 0;
      parts.push({ ref: node.name, value: sign * v });
      total += sign * v;
    } else {
      const g = rollDice(node, env);
      groups.push(g);
      total += sign * g.value;
      if (!primary && !g.success) primary = g; // tone reads the first non-pool dice group
    }
  }

  return { groups, parts, total, tone: computeTone(primary, crit) };
}
