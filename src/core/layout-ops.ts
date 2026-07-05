/**
 * Pure(ish) structural operations on layouts: moving, swapping and
 * reordering sections/entries, and grid row/column manipulation.
 *
 * These functions mutate the given layout but perform no persistence and no
 * rendering - callers (view, drag controller, menus) decide when to save and
 * re-render. Keeping the mutations here makes drag & drop and the menus thin
 * and the behavior unit-testable.
 */

import type { Entry, EPSettings, Layout, Section } from "./model";
import { genId } from "../utils/misc";

/**
 * Set the shared data type of a property key (v3.10: data types are
 * per-property, not per-layout - the same key renders as one type in every
 * note-Type layout, matching Obsidian's own one-type-per-key model).
 * Records the type in `settings.propTypes` (authoritative, keyed by
 * lower-cased key) and propagates it to every layout entry and inline entry
 * showing that key. Presentation options stay per-entry.
 */
export function setSharedDataType(settings: EPSettings, key: string, typeId: string): void {
  const kl = key.trim().toLowerCase();
  if (!kl || !typeId) return;
  if (!settings.propTypes) settings.propTypes = {};
  settings.propTypes[kl] = typeId;
  for (const lk of Object.keys(settings.layouts ?? {}))
    for (const s of settings.layouts[lk].sections ?? [])
      for (const e of s.entries ?? [])
        if (e.kind === "prop" && e.key && e.key.toLowerCase() === kl) e.dataType = typeId;
  for (const k of Object.keys(settings.inlineEntries ?? {})) {
    const e = settings.inlineEntries?.[k];
    if (e && e.kind === "prop" && e.key && e.key.toLowerCase() === kl) e.dataType = typeId;
  }
}

/** Create a blank grid filler entry. */
export function blankEntry(): Entry {
  return { id: genId(), kind: "blank" };
}

/** Move a section by `delta` positions. Returns false when out of range. */
export function moveSectionBy(layout: Layout, id: string, delta: number): boolean {
  const secs = layout.sections;
  const i = secs.findIndex((s) => s.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= secs.length) return false;
  const [s] = secs.splice(i, 1);
  secs.splice(j, 0, s);
  return true;
}

/** Move section `dragId` before/after section `targetId`. */
export function moveSectionTo(layout: Layout, dragId: string, targetId: string, after: boolean): boolean {
  if (dragId === targetId) return false;
  const secs = layout.sections;
  const from = secs.findIndex((s) => s.id === dragId);
  if (from < 0) return false;
  const [s] = secs.splice(from, 1);
  let idx = secs.findIndex((x) => x.id === targetId);
  if (idx < 0) idx = secs.length;
  if (after) idx += 1;
  secs.splice(idx, 0, s);
  return true;
}

/** Move an entry between sections, optionally relative to a target entry. */
export function moveEntryTo(
  layout: Layout,
  dragId: string,
  fromSec: string,
  toSec: string,
  targetEntryId: string | null,
  after: boolean
): boolean {
  const src = layout.sections.find((s) => s.id === fromSec);
  const dst = layout.sections.find((s) => s.id === toSec);
  if (!src || !dst) return false;
  const i = src.entries.findIndex((en) => en.id === dragId);
  if (i < 0) return false;
  const [en] = src.entries.splice(i, 1);
  let idx = targetEntryId ? dst.entries.findIndex((x) => x.id === targetEntryId) : dst.entries.length;
  if (idx < 0) idx = dst.entries.length;
  if (after) idx += 1;
  dst.entries.splice(idx, 0, en);
  return true;
}

/** Swap two entries (possibly across sections) in place. */
export function swapEntries(layout: Layout, aId: string, bId: string): boolean {
  let aS: Section | undefined, bS: Section | undefined, ai = -1, bi = -1;
  for (const sec of layout.sections) {
    const i = sec.entries.findIndex((e) => e.id === aId);
    if (i >= 0) { aS = sec; ai = i; }
    const j = sec.entries.findIndex((e) => e.id === bId);
    if (j >= 0) { bS = sec; bi = j; }
  }
  if (!aS || !bS || ai < 0 || bi < 0) return false;
  const t = aS.entries[ai];
  aS.entries[ai] = bS.entries[bi];
  bS.entries[bi] = t;
  return true;
}

/**
 * Move an entry out of its grid cell, leaving a blank filler behind, and
 * append it to the end of the same section (grid "tear-off" gesture).
 */
export function moveLeavingBlank(layout: Layout, entryId: string, fromId: string): boolean {
  const sec = layout.sections.find((s) => s.id === fromId);
  if (!sec) return false;
  const i = sec.entries.findIndex((e) => e.id === entryId);
  if (i < 0) return false;
  const [en] = sec.entries.splice(i, 1);
  sec.entries.splice(i, 0, blankEntry());
  sec.entries.push(en);
  return true;
}

/**
 * Move `entryId` from section `fromId` into section `toId`, then order the
 * destination's entries to match `order` (ids as observed in the DOM after a
 * pointer drag). Unknown entries keep their relative order at the end.
 */
export function reorderByDomOrder(
  layout: Layout,
  entryId: string,
  fromId: string,
  toId: string,
  order: string[]
): boolean {
  const from = layout.sections.find((s) => s.id === fromId);
  const to = layout.sections.find((s) => s.id === toId);
  if (!from || !to) return false;
  const i = from.entries.findIndex((e) => e.id === entryId);
  if (i < 0) return false;
  const [en] = from.entries.splice(i, 1);
  const map = new Map<string, Entry>(to.entries.map((e) => [e.id, e]));
  map.set(en.id, en);
  const next: Entry[] = [];
  for (const id of order) {
    const e = map.get(id);
    if (e) { next.push(e); map.delete(id); }
  }
  for (const e of map.values()) next.push(e);
  to.entries = next;
  return true;
}

/**
 * Ensure prop entries exist somewhere in the layout for each of `keys`;
 * missing ones are prepended to `section` (with `defaults` applied) so
 * modifier sources referenced by templates become real, editable
 * properties. Returns the number of entries created.
 */
export function ensurePropEntries(
  layout: Layout,
  section: Section,
  keys: string[],
  defaults: Partial<Entry> = {}
): number {
  const have = new Set<string>();
  for (const s of layout.sections)
    for (const e of s.entries) if (e.kind === "prop" && e.key) have.add(e.key.toLowerCase());
  const toAdd: Entry[] = [];
  for (const k of keys) {
    if (!k || have.has(k.toLowerCase())) continue;
    have.add(k.toLowerCase());
    toAdd.push({ id: genId(), kind: "prop", key: k, dataType: "number", ...defaults });
  }
  section.entries.unshift(...toAdd);
  return toAdd.length;
}

// ---------------------------------------------------------------------------
// Grid row/column operations
// ---------------------------------------------------------------------------

/** Chunk a section's entries into grid rows, padding short rows with blanks. */
export function gridRows(section: Section, cols: number): Entry[][] {
  const rows: Entry[][] = [];
  const es = section.entries;
  for (let i = 0; i < es.length; i += cols) {
    const row = es.slice(i, i + cols);
    while (row.length < cols) row.push(blankEntry());
    rows.push(row);
  }
  return rows;
}

/** Insert a column at `idx` (grid: blanks per row; columns/list: just +1). */
export function addColumnAt(section: Section, idx: number, isGrid: boolean): void {
  if (!isGrid) {
    section.columns = (section.columns || 1) + 1;
    return;
  }
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  const ci = Math.max(0, Math.min(idx, cols));
  for (const row of rows) row.splice(ci, 0, blankEntry());
  section.columns = cols + 1;
  section.entries = rows.flat();
}

/** Remove the column at `colIdx` (grid drops cells; columns/list: just -1). */
export function removeColumnAt(section: Section, colIdx: number, isGrid: boolean): void {
  if (!isGrid) {
    section.columns = Math.max(1, (section.columns || 1) - 1);
    return;
  }
  const cols = section.columns || 1;
  if (cols <= 1) return;
  const rows = gridRows(section, cols);
  for (const row of rows) if (colIdx < row.length) row.splice(colIdx, 1);
  section.columns = cols - 1;
  section.entries = rows.flat();
}

/** Insert a blank grid row at `idx`. */
export function addRowAt(section: Section, idx: number): void {
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  const ri = Math.max(0, Math.min(idx, rows.length));
  rows.splice(ri, 0, Array.from({ length: cols }, () => blankEntry()));
  if (section.rows && section.rows > 0) section.rows = rows.length;
  section.entries = rows.flat();
}

/** Remove the grid row at `rowIdx`. */
export function removeRowAt(section: Section, rowIdx: number): void {
  const cols = section.columns || 1;
  const rows = gridRows(section, cols);
  if (rowIdx < 0 || rowIdx >= rows.length) return;
  rows.splice(rowIdx, 1);
  if (section.rows && section.rows > 0) section.rows = rows.length;
  section.entries = rows.flat();
}
