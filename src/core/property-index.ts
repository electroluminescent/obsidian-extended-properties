/**
 * Vault-wide property queries.
 *
 * Wraps Obsidian's (partly undocumented) metadata APIs behind a small,
 * typed surface: known property names, value frequency, reverse lookups and
 * the Obsidian-assigned type of a property mapped onto our value-type ids.
 */

import { App } from "obsidian";

export class PropertyIndex {
  constructor(private app: App) {}

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
      for (const f of this.app.vault.getMarkdownFiles().slice(0, 1000)) {
        const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
        if (fm) for (const k of Object.keys(fm)) names.add(k);
      }
    }
    return [...names];
  }

  /** Smallest and largest numeric value of `key` across all notes. */
  numberRange(key: string): { min: number; max: number } | null {
    let min = Infinity;
    let max = -Infinity;
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = this.app.metadataCache.getFileCache(f)?.frontmatter?.[key];
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
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = this.app.metadataCache.getFileCache(f)?.frontmatter?.[key];
      if (Array.isArray(v)) v.forEach((x) => set.add(String(x)));
      else if (v !== undefined && v !== null && v !== "") set.add(String(v));
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }

  /** Basenames of notes whose `key` contains `value`. */
  notesWithValue(key: string, value: string): string[] {
    const out: string[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const v = this.app.metadataCache.getFileCache(f)?.frontmatter?.[key];
      const has = Array.isArray(v)
        ? v.some((x) => String(x) === value)
        : v !== undefined && v !== null && String(v) === value;
      if (has) out.push(f.basename);
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
