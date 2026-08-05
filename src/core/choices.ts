/**
 * Where a field's offered values come from, and whether it may hold anything
 * else. Pure - no Obsidian - so both the sidebar editors and the tests can ask
 * the same questions.
 *
 * A note-linking field answers to `ui/components/suggest` instead: its options
 * are notes in a folder, not strings.
 */

import type { Choices } from "./model";

/** The values a text field offers, in the order they should be shown. */
export function optionsFor(
  choices: Choices | undefined,
  allowed: string[] | undefined,
  pool: string[]
): string[] {
  if (choices?.from !== "allowed") return pool;
  // An allowed-values field offers exactly its list, in the order written.
  return allowed ?? [];
}

/**
 * Whether `v` may be committed to a field offering `options`. An empty value
 * always may: clearing a property is not the same as giving it a wrong value,
 * and "required" is the constraint that speaks to emptiness.
 */
export function valueAllowed(v: string, options: string[], strict?: boolean): boolean {
  if (!strict) return true;
  const t = v.trim();
  if (t === "") return true;
  return options.some((o) => o.trim().toLowerCase() === t.toLowerCase());
}
