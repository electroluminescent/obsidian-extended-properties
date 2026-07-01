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

  private snapshots(): FileSnap[] {
    if (!this.cache) {
      this.cache = new Map();
      for (const f of this.app.vault.getMarkdownFiles()) {
        this.cache.set(f.path, {
          file: f,
          fm: this.app.metadataCache.getFileCache(f)?.frontmatter as Record<string, unknown> | undefined,
        });
      }
    }
    return [...this.cache.values()];
  }

  /** Refresh one file's cached frontmatter (called on modify/rename/metadata-changed). */
  invalidateFile(file: TFile, oldPath?: string): void {
    if (!this.cache) return;
    if (oldPath && oldPath !== file.path) this.cache.delete(oldPath);
    this.cache.set(file.path, {
      file,
      fm: this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined,
    });
  }

  /** Drop one file (called on delete). */
  invalidatePath(path: string): void {
    this.cache?.delete(path);
  }

  /** Drop the whole cache — cheap escape hatch, rebuilt lazily on next read. */
  invalidateAll(): void {
    this.cache = null;
  }

  /** Numeric values of `key` across every note whose `Type` includes `typeKey`. */
  valuesByType(typeKey: string, key: string): number[] {
    const want = typeKey.trim().toLowerCase();
    const out: number[] = [];
    for (const { fm } of this.snapshots()) {
      if (!fm) continue;
      const tv = getCI(fm, "Type");
      const types = Array.isArray(tv)
        ? tv.map((x) => String(x).toLowerCase())
        : tv === undefined || tv === null
          ? []
          : [String(tv).toLowerCase()];
      if (!types.includes(want)) continue;
      const n = parseNumeric(getCI(fm, key));
      if (n !== null) out.push(n);
    }
    return out;
  }

  /** Value of `key` on the note linked in `sourcePath`'s `linkProp` property. */
  linkedValue(sourcePath: string, linkProp: string, key: string): number | undefined {
    const src = this.app.vault.getAbstractFileByPath(sourcePath);
    const sfm = src instanceof TFile
      ? (this.app.metadataCache.getFileCache(src)?.frontmatter as Record<string, unknown> | undefined)
      : undefined;
    if (!sfm) return undefined;
    const raw = getCI(sfm, linkProp);
    if (raw === undefined || raw === null || raw === "") return undefined;
    const target = linkTarget(String(Array.isArray(raw) ? raw[0] : raw));
    if (!target) return undefined;
    const dest = this.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (!dest) return undefined;
    const dfm = this.app.metadataCache.getFileCache(dest)?.frontmatter as Record<string, unknown> | undefined;
    return dfm ? parseNumeric(getCI(dfm, key)) ?? undefined : undefined;
  }

  /**
   * All property names known to the vault. Prefers the metadata managers;
   * falls back to scanning frontmatter of up to 1000 notes.
   */
  knownProps(): string[] {
    const names = new Set<string>();
    try {
      const mc: any = this.app.metadataCache;
      const infos = mc.getAllPropertyInfos?.();
      if (infos) for (const k of Object.keys(infos)) names.add(infos[k]?.name ?? k);
      const mt: any = (this.app as any).metadataTypeManager;
      if (mt?.properties) for (const k of Object.keys(mt.properties)) names.add(mt.properties[k]?.name ?? k);
    } catch {
      /* fall through to the scan */
    }
    if (names.size === 0) {
      for (const { fm } of this.snapshots().slice(0, 1000)) {
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

  /**
   * The value-type id corresponding to the property type assigned in
   * Obsidian's type manager, or null when unassigned/unknown.
   */
  obsidianType(key: string): string | null {
    try {
      const mt: any = (this.app as any).metadataTypeManager;
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
