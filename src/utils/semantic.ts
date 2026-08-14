/**
 * What colour a word means.
 *
 * Four places to look, in order, and each is cheap:
 *   1. the palette's own words - whatever the user pinned by hand
 *   2. the words that ship with the plugin (`semantic-anchors`)
 *   3. the same, after the word is cut back to its stem ("poisons" -> "poison")
 *   4. the optional table, if the vault has it installed
 * and, where the palette asks for it, a stable hue derived from the word
 * itself - meaningless, but consistent, so a vocabulary nobody has taught the
 * plugin still comes out in steady colours rather than none.
 *
 * No model runs here and nothing is fetched: the wide table is built ahead of
 * time (see `scripts/build-semantic.mjs`) and read from a file if it is
 * present. Pure, and unit-tested without a DOM.
 */

import { anchors } from "./semantic-anchors";
import { fromOklch } from "./palette";

/** The optional wide table, once something has handed it over. */
let wide: Map<string, string> | null = null;

/** Install the optional table (the plugin reads it from its own folder). */
export function setSemanticTable(words: Record<string, string> | null): void {
  wide = words ? new Map(Object.entries(words)) : null;
}

/** Whether the wide table is installed, for the settings to report. */
export function semanticTableSize(): number {
  return wide?.size ?? 0;
}

/**
 * A word cut back to something the tables are likely to hold: plurals,
 * participles and the commoner endings. Deliberately crude - it only has to
 * be right often enough to be worth trying before giving up.
 */
export function stem(word: string): string[] {
  const w = word.toLowerCase().trim();
  const out: string[] = [];
  const add = (s: string): void => {
    if (s.length > 2 && s !== w && !out.includes(s)) out.push(s);
  };
  if (w.endsWith("ies")) add(w.slice(0, -3) + "y");
  if (w.endsWith("es")) add(w.slice(0, -2));
  if (w.endsWith("s")) add(w.slice(0, -1));
  if (w.endsWith("ing")) {
    add(w.slice(0, -3));
    add(w.slice(0, -3) + "e");
  }
  if (w.endsWith("ed")) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
  }
  if (w.endsWith("ly")) add(w.slice(0, -2));
  if (w.endsWith("ness")) add(w.slice(0, -4));
  if (w.endsWith("ful")) add(w.slice(0, -3));
  return out;
}

/** A number for a word, the same one every time, anywhere. */
export function wordHash(word: string): number {
  let h = 2166136261;
  const w = word.toLowerCase();
  for (let i = 0; i < w.length; i++) {
    h ^= w.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * A colour derived from the word itself: no meaning at all, but steady - the
 * same word is the same colour in every note and on every machine.
 */
export function hashColor(word: string, lightness = 0.72, chroma = 0.13): string {
  return fromOklch(lightness, chroma, wordHash(word) % 360);
}

export interface SemanticOptions {
  /** What to do with a word none of the tables knows. */
  fallback?: "table" | "hash" | "none";
  lightness?: number;
  chroma?: number;
}

/**
 * The colour a word means, or undefined where nothing here knows it and the
 * palette has not asked for a colour to be invented.
 */
export function semanticColor(word: string, o: SemanticOptions = {}): string | undefined {
  const w = word.toLowerCase().trim();
  if (!w) return undefined;
  const known = anchors();
  const look = (k: string): string | undefined => known.get(k) ?? wide?.get(k);
  const direct = look(w);
  if (direct) return direct;
  for (const s of stem(w)) {
    const hit = look(s);
    if (hit) return hit;
  }
  // A phrase takes the colour of the first word in it that means anything.
  if (/\s/.test(w)) {
    for (const part of w.split(/\s+/)) {
      const hit = look(part) ?? stem(part).map(look).find(Boolean);
      if (hit) return hit;
    }
  }
  return o.fallback === "hash" ? hashColor(w, o.lightness, o.chroma) : undefined;
}
