/**
 * Vault-wide property queries.
 *
 * Wraps Obsidian's (partly undocumented) metadata APIs behind a small,
 * typed surface: known property names, value frequency, reverse lookups and
 * the Obsidian-assigned type of a property mapped onto our value-type ids.
 */

import { App, TFile } from "obsidian";
import { getCI, parseNumeric } from "../utils/misc";

/** The bare link target of a `[[Target|alias]]` / `[[Target#h]]` value. */
function linkTarget(raw: string): string {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}

/** The `Type` values of a frontmatter block, lower-cased. */
function typesOf(fm: Record<string, unknown>): string[] {
  const tv = getCI(fm, "Type");
  return Array.isArray(tv)
    ? tv.map((x) => String(x).toLowerCase())
    : tv === undefined || tv === null
      ? []
      : [String(tv).toLowerCase()];
}

interface FileSnap {
  file: TFile;
  fm: Record<string, unknown> | undefined;
}

export class PropertyIndex {
  constructor(private app: App) {}

  /**
   * Per-file frontmatter snapshot cache. Every query above used to call
   * `vault.getMarkdownFiles()` + `metadataCache.getFileCache()` fresh, which
   * means a single cross-note `sum()/avg()/prop()` reference re-scanned the
   * whole vault synchronously on every sidebar render. The cache is built
   * lazily on first read and kept in sync by {@link invalidateFile} /
   * {@link invalidateAll}, which `main.ts` wires to the vault's modify,
   * delete, rename and `metadataCache.changed` events.
   */
  private cache: Map<string, FileSnap> | null = null;
  /**
   * Type-bucket index (N1): lower-cased `Type` value -> paths of the notes
   * carrying it. Built with the snapshot cache and maintained by the same
   * invalidation events, it serves {@link rowsByType} and the aggregate
   * candidate sets, so per-type reads cost O(notes of that type) instead of
   * scanning every snapshot in the vault.
   */
  private buckets = new Map<string, Set<string>>();
  /**
   * Memoized aggregate candidate values (N1), keyed `type\u0000key` (both
   * lower-cased). Invalidated whenever any note of that type changes -
   * including notes *entering or leaving* the type: a `Type`-list change
   * dirties both the old and new buckets' aggregates.
   */
  private aggValues = new Map<string, number[]>();

  private ensure(): Map<string, FileSnap> {
    if (!this.cache) {
      this.cache = new Map();
      this.buckets.clear();
      this.aggValues.clear();
      for (const f of this.app.vault.getMarkdownFiles()) {
        const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
        this.cache.set(f.path, { file: f, fm });
        this.bucketAdd(f.path, fm);
      }
    }
    return this.cache;
  }

  private snapshots(): Iterable<FileSnap> {
    // An iterator, not a copied array - queries run per render, so avoiding
    // the per-call allocation matters on large vaults.
    return this.ensure().values();
  }

  private bucketAdd(path: string, fm?: Record<string, unknown>): void {
    if (!fm) return;
    for (const t of typesOf(fm)) {
      let b = this.buckets.get(t);
      if (!b) this.buckets.set(t, (b = new Set()));
      b.add(path);
    }
  }

  private bucketRemove(path: string, fm?: Record<string, unknown>): void {
    if (!fm) return;
    for (const t of typesOf(fm)) this.buckets.get(t)?.delete(path);
  }

  /** Drop every memoized aggregate of the given (lower-cased) types. */
  private dirtyTypes(types: Iterable<string>): void {
    for (const t of types) {
      const prefix = t + "\u0000";
      for (const k of [...this.aggValues.keys()]) if (k.startsWith(prefix)) this.aggValues.delete(k);
    }
  }

  /** Refresh one file's cached frontmatter (called on modify/rename/metadata-changed). */
  invalidateFile(file: TFile, oldPath?: string): void {
    if (!this.cache) return;
    if (oldPath && oldPath !== file.path) this.invalidatePath(oldPath);
    const old = this.cache.get(file.path);
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (old) this.bucketRemove(file.path, old.fm);
    this.cache.set(file.path, { file, fm });
    this.bucketAdd(file.path, fm);
    // Dirty the aggregates of every type the note belonged to OR now belongs
    // to - the broader dependency N1 tracks (bucket moves hit both sides).
    this.dirtyTypes(new Set([...(old?.fm ? typesOf(old.fm) : []), ...(fm ? typesOf(fm) : [])]));
  }

  /** Drop one file (called on delete). */
  invalidatePath(path: string): void {
    if (!this.cache) return;
    const old = this.cache.get(path);
    if (old) {
      this.bucketRemove(path, old.fm);
      this.dirtyTypes(old.fm ? typesOf(old.fm) : []);
    }
    this.cache.delete(path);
  }

  /** Drop the whole cache - cheap escape hatch, rebuilt lazily on next read. */
  invalidateAll(): void {
    this.cache = null;
    this.buckets.clear();
    this.aggValues.clear();
  }

  /**
   * Numeric values of `key` across every note whose `Type` includes
   * `typeKey`. Memoized (N1): repeated reads return the cached array until a
   * note of that type - or one entering/leaving it - invalidates. Callers
   * must treat the result as read-only.
   */
  valuesByType(typeKey: string, key: string): number[] {
    const want = typeKey.trim().toLowerCase();
    const ck = want + "\u0000" + key.toLowerCase();
    const hit = this.aggValues.get(ck);
    if (hit) return hit;
    const cache = this.ensure();
    const out: number[] = [];
    for (const path of this.buckets.get(want) ?? []) {
      const fm = cache.get(path)?.fm;
      if (!fm) continue;
      const n = parseNumeric(getCI(fm, key));
      if (n !== null) out.push(n);
    }
    this.aggValues.set(ck, out);
    return out;
  }

  /**
   * Files (with their cached frontmatter) whose `Type` includes `typeKey` -
   * the row projection the type table view renders. Served from the type
   * bucket (N1), so the cost is O(notes of the type), not O(vault).
   */
  rowsByType(typeKey: string): { file: TFile; fm: Record<string, unknown> }[] {
    const want = typeKey.trim().toLowerCase();
    const out: { file: TFile; fm: Record<string, unknown> }[] = [];
    if (!want) return out;
    const cache = this.ensure();
    for (const path of this.buckets.get(want) ?? []) {
      const snap = cache.get(path);
      if (snap?.fm) out.push({ file: snap.file, fm: snap.fm });
    }
    return out;
  }

  /** Value of `key` on the note linked in `sourcePath`'s `linkProp` property. */
  linkedValue(sourcePath: string, linkProp: string, key: string): number | undefined {
    const src = this.app.vault.getAbstractFileByPath(sourcePath);
    const sfm = src instanceof TFile
      ? (this.app.metadataCache.getFileCache(src)?.frontmatter)
      : undefined;
    if (!sfm) return undefined;
    const raw = getCI(sfm, linkProp);
    if (raw === undefined || raw === null || raw === "") return undefined;
    const target = linkTarget(String(Array.isArray(raw) ? raw[0] : raw));
    if (!target) return undefined;
    const dest = this.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (!dest) return undefined;
    const dfm = this.app.metadataCache.getFileCache(dest)?.frontmatter;
    return dfm ? parseNumeric(getCI(dfm, key)) ?? undefined : undefined;
  }

  /**
   * All property names known to the vault. Prefers the metadata managers;
   * falls back to scanning frontmatter of up to 1000 notes.
   */
  knownProps(): string[] {
    const names = new Set<string>();
    try {
      const mc = this.app.metadataCache as { getAllPropertyInfos?: () => Record<string, { name?: string }> | undefined };
      const infos = mc.getAllPropertyInfos?.();
      if (infos) for (const k of Object.keys(infos)) names.add(infos[k]?.name ?? k);
      const mt = (this.app as { metadataTypeManager?: { getAssignedType?: (k: string) => string | undefined; properties?: Record<string, { name?: string; type?: string }> } }).metadataTypeManager;
      if (mt?.properties) for (const k of Object.keys(mt.properties)) names.add(mt.properties[k]?.name ?? k);
    } catch {
      /* fall through to the scan */
    }
    if (names.size === 0) {
      let scanned = 0;
      for (const { fm } of this.snapshots()) {
        if (++scanned > 1000) break;
        if (fm) for (const k of Object.keys(fm)) names.add(k);
      }
    }
    return [...names];
  }

  /** Smallest and largest numeric value of `key` across all notes. */
  numberRange(key: string): { min: number; max: number } | null {
    let min = Infinity;
    let max = -Infinity;
    for (const { fm } of this.snapshots()) {
      const v = fm?.[key];
      if (v === null || v === undefined || v === "") continue;
      const n = Number(v);
      if (!Number.isFinite(n)) continue;
      if (n < min) min = n;
      if (n > max) max = n;
    }
    return min <= max ? { min, max } : null;
  }

  /** Distinct values used for `key` anywhere in the vault, sorted. */
  valuesFor(key: string): string[] {
    const set = new Set<string>();
    for (const { fm } of this.snapshots()) {
      const v = fm?.[key];
      if (Array.isArray(v)) v.forEach((x) => set.add(String(x)));
      else if (v !== undefined && v !== null && v !== "") set.add(String(v));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  /** Basenames of notes whose `key` contains `value`. */
  notesWithValue(key: string, value: string): string[] {
    const out: string[] = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm?.[key];
      const has = Array.isArray(v)
        ? v.some((x) => String(x) === value)
        : v !== undefined && v !== null && String(v) === value;
      if (has) out.push(file.basename);
    }
    return out;
  }

  /** Files whose `key` contains `value` (exact match) - pool scrubbing. */
  filesWithValue(key: string, value: string): TFile[] {
    const out: TFile[] = [];
    for (const { file, fm } of this.snapshots()) {
      const v = fm ? getCI(fm, key) : undefined;
      const has = Array.isArray(v)
        ? v.some((x) => String(x) === value)
        : v !== undefined && v !== null && String(v) === value;
      if (has) out.push(file);
    }
    return out;
  }

  /**
   * The value-type id corresponding to the property type assigned in
   * Obsidian's type manager, or null when unassigned/unknown.
   */
  obsidianType(key: string): string | null {
    try {
      const mt = (this.app as { metadataTypeManager?: { getAssignedType?: (k: string) => string | undefined; properties?: Record<string, { name?: string; type?: string }> } }).metadataTypeManager;
      const t: string | undefined = mt?.getAssignedType?.(key) ?? mt?.properties?.[key.toLowerCase()]?.type;
      if (!t) return null;
      if (t === "number") return "number";
      if (t === "checkbox") return "checkbox";
      if (t === "multitext" || t === "tags" || t === "aliases") return "list";
      return "text";
    } catch {
      return null;
    }
  }
}
