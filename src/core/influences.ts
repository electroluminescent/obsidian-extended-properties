/**
 * The influence engine — generic, user-editable modifier math.
 *
 * A numeric entry can be driven by the sum of one or more {@link Influence}s.
 * Each influence names a source property, a derivation (how the raw source
 * value becomes a contribution), a sign, and optionally a *toggle list
 * property* that switches the influence on/off per note — the generic form
 * of "proficiency": the influence applies when the entry's key (or alias)
 * is listed in that property.
 *
 * Derivations are plain data ({@link DerivationSetting}: name + formula in
 * `x`) persisted in settings, so even "ability modifier" and "proficiency
 * bonus" are ordinary, user-editable building blocks rather than hard-coded
 * rules. They are compiled into the derivation registry at startup and
 * whenever the settings change.
 *
 * Everything in this file is data and pure math; the UI lives in
 * `ui/render/modifier-addon.ts` and the "derived" value type.
 */

import type { TFile } from "obsidian";
import type { Entry, EPSettings, Layout } from "./model";
import { ext } from "./model";
import type { Registries } from "./registry";
import type { NoteModel } from "./note-model";
import { compileFormula } from "../utils/formula";
import { evalExpr, ExprNode, parseExpr, serializeExpr } from "./expr";

// ---------------------------------------------------------------------------
// Persisted shapes
// ---------------------------------------------------------------------------

/** One contributing term of a derived / modified number. */
export interface Influence {
  /** Source property key. Unset = the entry's own property. */
  source?: string;
  /**
   * Derivation id: "value" (as-is), the id of a settings-defined building
   * block, or "formula" for a per-influence expression.
   */
  mode?: string;
  /** Expression in `x` used when `mode` is "formula". */
  formula?: string;
  /**
   * Full expression (see `core/expr.ts`) referencing properties by name or
   * short form — e.g. `floor((STR + DEX) / 2) + max(PB, 2)`. When set it wins
   * over `source`/`mode`/`formula`; the term is `weight × expr`.
   */
  expr?: string;
  /** −1 subtracts the term from the sum; anything else adds it. */
  weight?: number;
  /**
   * Name of a list property that makes this term togglable (the way
   * proficiency works): the term only applies while the entry's key (or
   * alias) is contained in that list. A checkbox is rendered for it.
   */
  toggle?: string;
  /**
   * Hide this term's checkbox on the row (per source). The toggle list
   * still applies — only the button is suppressed.
   */
  hideToggle?: boolean;
  /**
   * Hide this term in the chain denotation (per source). The term still
   * counts toward the total — only the display is suppressed.
   */
  hideInChain?: boolean;
}

/** Entry fields persisted by the modifier system (via `ext<ModExt>`). */
export interface ModExt {
  /** Influences summed into the entry's modifier / derived value. */
  mods?: Influence[];
  /** Manual override replacing the computed sum (kept from v2 as-is). */
  rollOverride?: number;
  /** Render the modifier badge (denotation + total) on numeric entries. */
  showMod?: boolean;
}

/** A user-editable derivation building block persisted in settings. */
export interface DerivationSetting {
  id: string;
  name: string;
  /** Expression in `x` (see `utils/formula.ts` for the grammar). */
  formula: string;
}

/**
 * Default building blocks seeded into fresh settings. These are ordinary
 * formula entries — rename, edit or delete them in the settings tab.
 */
export function defaultDerivations(): DerivationSetting[] {
  return [
    { id: "abilityMod", name: "Ability modifier", formula: "floor((x - 10) / 2)" },
    { id: "profBonus", name: "Proficiency bonus", formula: "2 + floor((max(x, 1) - 1) / 4)" },
  ];
}

/** Compile and register the settings-defined derivations. */
export function registerDerivations(registries: Registries, settings: EPSettings): void {
  for (const d of settings.derivations ?? []) {
    const f = compileFormula(d.formula);
    registries.derivations.add({
      id: d.id,
      name: () => d.name,
      apply: f ?? ((x: number) => x),
    });
  }
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/** What evaluation needs from the view (ViewCtx satisfies this). */
export interface InfluenceEnv {
  note: NoteModel;
  registries: Registries;
  settings: EPSettings;
  /**
   * Active layout — used to resolve *chained* modifiers: when a source
   * property is itself a derived entry, its influence sum is computed
   * recursively (up to `settings.modDepth` hops, default 8).
   */
  layout?: Layout;
}

/** Max influence chain depth (configurable in the plugin settings). */
function maxDepth(env: InfluenceEnv): number {
  const d = env.settings.modDepth;
  return typeof d === "number" && d >= 0 ? Math.floor(d) : 8;
}

/** Numeric value stored on the note for `key`, or null when absent. */
function numericRaw(env: InfluenceEnv, key: string): number | null {
  const v = env.note.raw[key];
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** The derived prop entry showing `key` in the active layout, if any. */
function findDerivedEntry(env: InfluenceEnv, key: string): Entry | null {
  if (!env.layout || !key) return null;
  const kl = key.toLowerCase();
  for (const s of env.layout.sections)
    for (const e of s.entries)
      if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl && e.dataType === "derived") return e;
  return null;
}

/** Token identifying one influence in the disabled-modifiers list. */
function offToken(entry: Entry, inf: Influence): string {
  return `${(entry.key as string) ?? ""}:${inf.source || (entry.key as string) || ""}`;
}

/**
 * Whether a list-less influence has been switched off for this note by
 * clicking its short form (stored in the disabled-modifiers property).
 */
export function influenceDisabled(env: InfluenceEnv, entry: Entry, inf: Influence): boolean {
  if (inf.toggle) return false; // list-toggled terms use their own list
  const prop = env.settings.modsOffProp || "Modifiers Off";
  const token = offToken(entry, inf).toLowerCase();
  return env.note.list(prop).some((x) => x.toLowerCase() === token);
}

/** Switch a list-less influence on/off for this note. */
export function setInfluenceDisabled(
  env: InfluenceEnv,
  file: TFile,
  entry: Entry,
  inf: Influence,
  off: boolean
): void {
  const prop = env.settings.modsOffProp || "Modifiers Off";
  const token = offToken(entry, inf);
  const cur = env.note.list(prop).filter((x) => x.toLowerCase() !== token.toLowerCase());
  const next = off ? [...cur, token] : cur;
  env.note.set(file, prop, next.length ? next : undefined);
}

/** Whether an influence is currently on for `entry` (list + click toggles). */
export function influenceActive(env: InfluenceEnv, entry: Entry, inf: Influence): boolean {
  if (!inf.toggle) return !influenceDisabled(env, entry, inf);
  const names = env.note.list(inf.toggle).map((x) => x.toLowerCase());
  const key = (entry.key ?? "").toLowerCase();
  const alias = ((entry.alias as string) ?? "").toLowerCase();
  return (!!key && names.includes(key)) || (!!alias && names.includes(alias));
}

/** Toggle a togglable influence for `entry` by editing its list property. */
export function setInfluenceActive(
  env: InfluenceEnv,
  file: TFile,
  entry: Entry,
  inf: Influence,
  on: boolean
): void {
  if (!inf.toggle || !entry.key) return;
  const key = entry.key;
  const alias = (entry.alias as string) ?? "";
  const without = env.note
    .list(inf.toggle)
    .filter(
      (x) =>
        x.toLowerCase() !== key.toLowerCase() &&
        (!alias || x.toLowerCase() !== alias.toLowerCase())
    );
  const next = on ? [...without, alias || key] : without;
  env.note.set(file, inf.toggle, next.length ? next : undefined);
}

/** Apply an influence's derivation to a raw source value. */
export function applyDerivation(env: InfluenceEnv, inf: Influence, raw: number): number {
  if (inf.mode === "formula") {
    const f = compileFormula(inf.formula ?? "x");
    return f ? f(raw) : raw;
  }
  const def = env.registries.derivations.get(inf.mode ?? "value");
  return def ? def.apply(raw) : raw;
}

/** User derivations exposed to expressions as one-argument functions. */
function buildFnEnv(env: InfluenceEnv): (name: string) => ((args: number[]) => number | undefined) | undefined {
  const derivs = env.settings.derivations ?? [];
  return (name) => {
    const d = derivs.find((x) => x.id.toLowerCase() === name.toLowerCase());
    if (!d) return undefined;
    const f = compileFormula(d.formula);
    if (!f) return undefined;
    return (args) => f(args[0] ?? 0);
  };
}

/**
 * One evaluation pass over a note's modifiers. Values are memoized by property
 * key and a visiting set detects reference cycles explicitly (the `modDepth`
 * setting remains only as a backstop for very deep legacy chains). Legacy
 * `mode`/`formula` terms evaluate exactly as before and never error; only
 * `expr` terms can fail (parse error / unknown reference / cycle), which makes
 * the whole entry resolve to `undefined` so the UI can show "—".
 */
class NoteEval {
  private cache = new Map<string, number | undefined>();
  private visiting = new Set<string>();
  /** Lower-cased keys found to participate in a cycle (for the error badge). */
  readonly cycles = new Set<string>();
  private parsed = new Map<string, ExprNode | null>();
  private readonly fnEnv: (name: string) => ((args: number[]) => number | undefined) | undefined;

  constructor(private env: InfluenceEnv) {
    this.fnEnv = buildFnEnv(env);
  }

  total(entry: Entry): number | undefined {
    return this.totalAt(entry, maxDepth(this.env));
  }

  term(entry: Entry, inf: Influence): number | undefined {
    return this.termAt(entry, inf, maxDepth(this.env));
  }

  private parseExprCached(expr: string): ExprNode | null {
    if (!this.parsed.has(expr)) this.parsed.set(expr, parseExpr(expr));
    return this.parsed.get(expr) ?? null;
  }

  private totalAt(entry: Entry, depth: number): number | undefined {
    const e = ext<ModExt>(entry);
    const key = (entry.key as string) || "";
    const kl = key.toLowerCase();
    // Per-note override: a number stored in a derived property's own value.
    if (entry.dataType === "derived" && key) {
      const stored = numericRaw(this.env, key);
      if (stored !== null) return stored;
    }
    if (e.rollOverride !== undefined) return e.rollOverride;
    if (kl) {
      if (this.visiting.has(kl)) {
        this.cycles.add(kl);
        return undefined;
      }
      if (this.cache.has(kl)) return this.cache.get(kl);
      this.visiting.add(kl);
    }
    let sum = 0;
    let bad = false;
    for (const inf of e.mods ?? []) {
      const term = this.termAt(entry, inf, depth);
      if (term === undefined) {
        bad = true;
        break;
      }
      sum += term;
    }
    if (kl) this.visiting.delete(kl);
    const res = bad ? undefined : sum;
    if (kl) this.cache.set(kl, res);
    return res;
  }

  private termAt(entry: Entry, inf: Influence, depth: number): number | undefined {
    if (!influenceActive(this.env, entry, inf)) return 0;
    const sign = inf.weight === -1 ? -1 : 1;
    if (inf.expr) {
      const ast = this.parseExprCached(inf.expr);
      if (!ast) return undefined;
      const v = evalExpr(ast, { resolve: (n) => this.refValue(n, depth), fn: this.fnEnv });
      return v === undefined ? undefined : sign * v;
    }
    const key = inf.source || (entry.key as string) || "";
    return sign * applyDerivation(this.env, inf, this.sourceValue(key, depth));
  }

  /** Legacy source resolution: never errors (absent → 0). */
  private sourceValue(key: string, depth: number): number {
    const stored = numericRaw(this.env, key);
    if (stored !== null) return stored;
    if (depth > 0) {
      const en = findDerivedEntry(this.env, key);
      if (en) return this.totalAt(en, depth - 1) ?? 0;
    }
    return this.env.note.num(key, 0);
  }

  /** Expression reference: known property → value (0 if absent); unknown → undefined. */
  private refValue(name: string, depth: number): number | undefined {
    const key = this.keyFor(name);
    if (key === null) return undefined;
    const stored = numericRaw(this.env, key);
    if (stored !== null) return stored;
    if (depth > 0) {
      const en = findDerivedEntry(this.env, key);
      if (en) return this.totalAt(en, depth - 1);
    }
    return this.env.note.num(key, 0);
  }

  /** Map a referenced name to a known property key — exact key first, then short form. */
  private keyFor(name: string): string | null {
    const nl = name.trim().toLowerCase();
    if (!nl) return null;
    for (const k of Object.keys(this.env.note.raw)) if (k.toLowerCase() === nl) return k;
    const layout = this.env.layout;
    if (layout) {
      for (const s of layout.sections)
        for (const en of s.entries) if (en.kind === "prop" && en.key && en.key.toLowerCase() === nl) return en.key;
      for (const s of layout.sections)
        for (const en of s.entries)
          if (en.kind === "prop" && en.key && abbrFor(this.env.settings, en.key).toLowerCase() === nl) return en.key;
    }
    return null;
  }
}

/** One influence's contribution to the sum (0 while toggled off or on error). */
export function influenceTerm(env: InfluenceEnv, entry: Entry, inf: Influence): number {
  return new NoteEval(env).term(entry, inf) ?? 0;
}

/**
 * The entry's effective modifier: per-note stored override (derived entries),
 * layout-wide override, or the (chain-resolved) influence sum. Returns 0 when
 * the expression fails — use {@link modifierInfo} to detect that for display.
 */
export function modifierTotal(env: InfluenceEnv, entry: Entry): number {
  return new NoteEval(env).total(entry) ?? 0;
}

/** A computed modifier plus whether (and why) it failed, for the "—" badge. */
export interface ModifierInfo {
  value: number | undefined;
  error: "cycle" | "expr" | null;
}

/** Like {@link modifierTotal} but reports failure (cycle or bad expression). */
export function modifierInfo(env: InfluenceEnv, entry: Entry): ModifierInfo {
  const ev = new NoteEval(env);
  const value = ev.total(entry);
  return { value, error: value === undefined ? (ev.cycles.size > 0 ? "cycle" : "expr") : null };
}

/** Whether a derived entry's value is overridden on the current note. */
export function hasNoteOverride(env: InfluenceEnv, entry: Entry): boolean {
  return entry.dataType === "derived" && !!entry.key && numericRaw(env, entry.key as string) !== null;
}

// ---------------------------------------------------------------------------
// Short forms
// ---------------------------------------------------------------------------

/** Default short form: the capitalized first three letters of the key. */
export function defaultAbbr(key: string): string {
  const word = (key ?? "").trim();
  return word.length > 3 ? word.slice(0, 3).toUpperCase() : word.toUpperCase();
}

/** Effective short form of a source property (settings override wins). */
export function abbrFor(settings: EPSettings, key: string): string {
  const kl = (key ?? "").toLowerCase();
  const abbrs = settings.sourceAbbrs ?? {};
  for (const k of Object.keys(abbrs)) if (k.toLowerCase() === kl) return abbrs[k];
  return defaultAbbr(key);
}

/**
 * Set or clear the short form of a source property. Setting the default
 * (or blank) removes the override so the property tracks renames again.
 */
export function setAbbr(settings: EPSettings, key: string, abbr: string | undefined): void {
  const kl = (key ?? "").toLowerCase();
  for (const k of Object.keys(settings.sourceAbbrs))
    if (k.toLowerCase() === kl) delete settings.sourceAbbrs[k];
  const v = (abbr ?? "").trim();
  if (v && v !== defaultAbbr(key)) settings.sourceAbbrs[key] = v;
}

/** An expression rendered with its references replaced by their short forms. */
export function exprDenotation(settings: EPSettings, expr: string): string {
  const ast = parseExpr(expr);
  return ast ? serializeExpr(ast, (name) => abbrFor(settings, name)) : expr;
}

/** Short form of one influence term (the source's abbr, or the expression). */
export function termDenotation(settings: EPSettings, entry: Entry, inf: Influence): string {
  return inf.expr ? exprDenotation(settings, inf.expr) : abbrFor(settings, inf.source || (entry.key as string) || "");
}

/** Plain-text denotation of an influence list, e.g. "INT + DEX − AGE". */
export function denotationText(settings: EPSettings, entry: Entry, mods: Influence[]): string {
  let out = "";
  mods.forEach((inf, i) => {
    const neg = inf.weight === -1;
    if (i > 0) out += neg ? " − " : " + ";
    else if (neg) out += "−";
    out += termDenotation(settings, entry, inf);
  });
  return out;
}

// ---------------------------------------------------------------------------
// Helpers for templates
// ---------------------------------------------------------------------------

/** All source property keys referenced by the influences of `entries`. */
export function influenceSources(entries: Entry[]): string[] {
  const out: string[] = [];
  for (const en of entries) {
    const mods = (en as Record<string, unknown>).mods;
    if (!Array.isArray(mods)) continue;
    for (const inf of mods as Influence[])
      if (inf && typeof inf === "object" && inf.source) out.push(inf.source);
  }
  return [...new Set(out)];
}
