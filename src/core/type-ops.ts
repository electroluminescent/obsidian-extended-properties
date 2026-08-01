/**
 * Renaming a note type.
 *
 * A type is a *value*, not an object: the note's type property carries it, and
 * everything the plugin knows about the type hangs off the lower-cased value -
 * the layout, the icon, and any macro scoped to it. Renaming therefore means
 * moving all of that from one key to another, which is what lets a vault adopt
 * a property it already uses (`category: sim`) without rebuilding its layouts.
 *
 * The note files are deliberately NOT touched here: rewriting frontmatter is
 * asynchronous, needs the vault, and is optional (a rename may be *aligning*
 * the plugin to values the notes already have). The caller decides.
 */

import type { EPSettings } from "./model";

/** What a rename did. "merged" = the target already existed. */
export type RenameOutcome = "renamed" | "merged" | "invalid";

/** Which layout survives when the new name is already taken. */
export type MergeChoice = "replace" | "keep";

/** The display name registered for a lower-cased key, if any. */
export function typeNamed(settings: EPSettings, key: string): string | undefined {
  const k = key.trim().toLowerCase();
  return settings.types.find((t) => t.toLowerCase() === k);
}

/**
 * Rename `from` to `to`, carrying its layout, icon and scoped macros.
 *
 * - A case-only change ("sims" -> "Sims") just restyles the display name; every
 *   key stays as it is, because keys are lower-cased.
 * - When `to` is already a type, the two merge: `replace` keeps the renamed
 *   type's layout, `keep` keeps the one already under that name. Either way the
 *   old key is gone afterwards and only one type remains.
 */
export function renameType(
  settings: EPSettings,
  from: string,
  to: string,
  merge: MergeChoice = "replace"
): RenameOutcome {
  const fromKey = from.trim().toLowerCase();
  const name = to.trim();
  const toKey = name.toLowerCase();
  if (!fromKey || !toKey) return "invalid";

  const at = settings.types.findIndex((x) => x.toLowerCase() === fromKey);
  if (at < 0) return "invalid";

  // Case-only: the key is unchanged, so nothing has to move.
  if (fromKey === toKey) {
    settings.types[at] = name;
    return "renamed";
  }

  const clash = settings.types.findIndex((x) => x.toLowerCase() === toKey);
  const layout = settings.layouts[fromKey];
  const icon = settings.typeIcons?.[fromKey];

  if (clash >= 0) {
    if (merge === "replace") {
      if (layout) settings.layouts[toKey] = layout;
      if (icon) (settings.typeIcons ??= {})[toKey] = icon;
      settings.types[clash] = name;
    }
    settings.types.splice(at, 1);
  } else {
    settings.types[at] = name;
    if (layout) settings.layouts[toKey] = layout;
    if (icon) (settings.typeIcons ??= {})[toKey] = icon;
  }

  delete settings.layouts[fromKey];
  if (settings.typeIcons) delete settings.typeIcons[fromKey];
  // Macros follow the type they were scoped to, merge or not: their rolls are
  // about the properties of these notes, which have not changed.
  for (const m of settings.macros) if (m.typeKey === fromKey) m.typeKey = toKey;

  return clash >= 0 ? "merged" : "renamed";
}
