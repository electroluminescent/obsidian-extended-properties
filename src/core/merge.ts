/**
 * Field-level three-way merge for frontmatter (roadmap L1).
 *
 * The D4 conflict guard previously offered only an all-or-nothing
 * *Keep mine / Take theirs* choice. With a captured "base" (the frontmatter as
 * it was when our edit batch began) we can do better: when our edits and the
 * external edit touch *different* keys, the two sets are merged automatically;
 * the prompt is reserved for keys both sides changed to genuinely different
 * values.
 *
 * Pure and Obsidian-free, so the rules are unit-tested directly.
 */

export type Frontmatter = Record<string, unknown>;

/**
 * Structural equality for frontmatter scalar/array values. Frontmatter values
 * are JSON-ish (string | number | boolean | null | arrays/objects of those),
 * so a stable JSON encoding is a sound comparison. `undefined` (a missing key)
 * and `null` compare equal so that "absent" and "explicitly null" don't appear
 * as a spurious change.
 */
export function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  const na = a === undefined ? null : a;
  const nb = b === undefined ? null : b;
  try {
    return JSON.stringify(na) === JSON.stringify(nb);
  } catch {
    return false;
  }
}

/**
 * Of the keys we changed (`keys`), which are true conflicts: the other side
 * changed the same key, relative to `base`, to a value different from ours.
 *
 * A key where only we changed it, or where they changed it to the same value we
 * did, is *not* a conflict - our write is safe and preserves their other edits.
 */
export function conflictingKeys(
  base: Frontmatter,
  theirs: Frontmatter,
  mine: Frontmatter,
  keys: string[]
): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const theyChanged = !valuesEqual(theirs[k], base[k]);
    const sameAsMine = valuesEqual(theirs[k], mine[k]);
    if (theyChanged && !sameAsMine) out.push(k);
  }
  return out;
}

export interface MergeResult {
  /** The merged frontmatter (our edits + their non-conflicting edits). */
  merged: Frontmatter;
  /** Keys both sides changed to different values (left at our value in `merged`). */
  conflicts: string[];
}

/**
 * Full three-way merge over the union of keys. Used for whole-object reasoning
 * and tests; the write paths use {@link conflictingKeys} plus a targeted write
 * of only the keys we changed (so untouched keys keep their on-disk formatting).
 *
 * Per key: if only one side changed it relative to `base`, that side wins; if
 * both changed it to the same value, that value wins; if both changed it to
 * different values it is a conflict (our value is kept in `merged`, the key is
 * reported in `conflicts`). Keys resolving to `undefined` are dropped.
 */
export function mergeFrontmatter(base: Frontmatter, mine: Frontmatter, theirs: Frontmatter): MergeResult {
  const merged: Frontmatter = {};
  const conflicts: string[] = [];
  const keys = new Set<string>([...Object.keys(base), ...Object.keys(mine), ...Object.keys(theirs)]);
  for (const k of keys) {
    const weChanged = !valuesEqual(mine[k], base[k]);
    const theyChanged = !valuesEqual(theirs[k], base[k]);
    let value: unknown;
    if (weChanged && theyChanged) {
      if (valuesEqual(mine[k], theirs[k])) value = mine[k];
      else {
        value = mine[k];
        conflicts.push(k);
      }
    } else if (weChanged) value = mine[k];
    else if (theyChanged) value = theirs[k];
    else value = base[k];
    if (value !== undefined) merged[k] = value;
  }
  return { merged, conflicts };
}
