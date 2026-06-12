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
import type { Entry, EPSettings } from "./model";
import { ext } from "./model";
import type { Registries } from "./registry";
import type { NoteModel } from "./note-model";
import { compileFormula } from "../utils/formula";

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
}

/** Whether a togglable influence is currently on for `entry`. */
export function influenceActive(env: InfluenceEnv, entry: Entry, inf: Influence): boolean {
  if (!inf.toggle) return true;
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

/** One influence's contribution to the sum (0 while toggled off). */
export function influenceTerm(env: InfluenceEnv, entry: Entry, inf: Influence): number {
  if (!influenceActive(env, entry, inf)) return 0;
  const key = inf.source || (entry.key as string) || "";
  const raw = env.note.num(key, 0);
  const sign = inf.weight === -1 ? -1 : 1;
  return sign * applyDerivation(env, inf, raw);
}

/** The entry's effective modifier: manual override, or the influence sum. */
export function modifierTotal(env: InfluenceEnv, entry: Entry): number {
  const e = ext<ModExt>(entry);
  if (e.rollOverride !== undefined) return e.rollOverride;
  return (e.mods ?? []).reduce((sum, inf) => sum + influenceTerm(env, entry, inf), 0);
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

/** Plain-text denotation of an influence list, e.g. "INT + DEX − AGE". */
export function denotationText(settings: EPSettings, entry: Entry, mods: Influence[]): string {
  let out = "";
  mods.forEach((inf, i) => {
    const neg = inf.weight === -1;
    if (i > 0) out += neg ? " − " : " + ";
    else if (neg) out += "−";
    out += abbrFor(settings, inf.source || (entry.key as string) || "");
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
