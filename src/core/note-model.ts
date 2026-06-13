/**
 * Per-view frontmatter state for the active note.
 *
 * Owns the in-memory copy of the note's properties (`raw`), writes changes
 * back through Obsidian's `processFrontMatter`, suppresses the echo events
 * those writes trigger, and records an undo trail while edit mode is active.
 */

import { App, Notice, TFile } from "obsidian";
import type { I18n } from "../i18n/i18n";
import { getList, getNum, getStr } from "../utils/misc";

/** How long after our own write a metadata event counts as an echo (ms). */
const ECHO_WINDOW_MS = 600;

interface UndoRecord { path: string; key: string; old: unknown }

/** Callbacks the owning view supplies. */
export interface NoteModelHost {
  /** In-place refresh of rendered values. */
  onLightChange(): void;
  /** Full re-render (structure changed). */
  onFullChange(): void;
  /** Whether value changes should be captured for session undo. */
  captureUndo(): boolean;
}

export class NoteModel {
  /** Raw frontmatter of the active note (shallow copy of the cache). */
  raw: Record<string, unknown> = {};
  /** Path of the note `raw` belongs to. */
  path: string | null = null;

  private lastWritePath: string | null = null;
  private lastWriteTime = 0;
  private undo = new Map<string, UndoRecord>();

  constructor(private app: App, private i18n: I18n, private host: NoteModelHost) {}

  // -- loading ---------------------------------------------------------

  /** Load `raw` from the metadata cache for `file`. */
  load(file: TFile): void {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
    this.raw = fm ? { ...fm } : {};
    this.path = file.path;
  }

  /** Whether a metadata-changed event for `file` is an echo of our own write. */
  isEcho(file: TFile): boolean {
    return this.lastWritePath === file.path && Date.now() - this.lastWriteTime < ECHO_WINDOW_MS;
  }

  // -- typed readers -----------------------------------------------------

  num(key: string, def: number): number { return getNum(this.raw, key, def); }
  str(key: string): string { return getStr(this.raw, key); }
  list(key: string): string[] { return getList(this.raw, key); }

  /** True when the key is missing, null, "" or an empty list. */
  isEmpty(key?: string): boolean {
    if (!key) return true;
    const v = this.raw[key];
    return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
  }

  /** The note's `Type` property as a list (case-insensitive key match). */
  noteTypes(): string[] {
    for (const k of Object.keys(this.raw)) {
      if (k.toLowerCase() === "type") {
        const v = this.raw[k];
        return Array.isArray(v) ? v.map((x) => String(x)) : v === undefined || v === null ? [] : [String(v)];
      }
    }
    return [];
  }

  // -- writing ----------------------------------------------------------

  /**
   * Set one property and persist it.
   * @param full re-render instead of in-place value refresh
   */
  set(file: TFile, key: string, value: unknown, full = false): void {
    this.recordUndo(file, key);
    if (value === undefined) delete this.raw[key];
    else this.raw[key] = value;
    if (full) this.host.onFullChange();
    else this.host.onLightChange();
    this.persist(file, key);
  }

  /** Set several properties at once (single frontmatter write, full re-render). */
  setMany(file: TFile, entries: Record<string, unknown>): void {
    for (const key of Object.keys(entries)) this.recordUndo(file, key);
    Object.assign(this.raw, entries);
    this.host.onFullChange();
    this.stampWrite(file);
    this.app.fileManager
      .processFrontMatter(file, (fm) => {
        for (const k of Object.keys(entries)) fm[k] = this.raw[k];
      })
      .then(() => (this.lastWriteTime = Date.now()))
      .catch((err) => new Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }

  private persist(file: TFile, key: string): void {
    this.stampWrite(file);
    this.app.fileManager
      .processFrontMatter(file, (fm) => {
        const cur = this.raw[key];
        if (cur === undefined) delete fm[key];
        else fm[key] = cur;
      })
      .then(() => (this.lastWriteTime = Date.now()))
      .catch((err) => new Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }

  private stampWrite(file: TFile): void {
    this.lastWritePath = file.path;
    this.lastWriteTime = Date.now();
  }

  // -- session undo (edit mode) --------------------------------------------

  private recordUndo(file: TFile, key: string): void {
    if (!this.host.captureUndo()) return;
    const id = file.path + " " + key;
    if (!this.undo.has(id)) this.undo.set(id, { path: file.path, key, old: this.raw[key] });
  }

  hasUndo(): boolean {
    return this.undo.size > 0;
  }

  clearUndo(): void {
    this.undo.clear();
  }

  /** Write all captured original values back to their files. */
  revertUndo(): void {
    const byFile = new Map<string, { key: string; old: unknown }[]>();
    for (const { path, key, old } of this.undo.values()) {
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path)!.push({ key, old });
    }
    for (const [path, changes] of byFile) {
      const f = this.app.vault.getAbstractFileByPath(path);
      if (f instanceof TFile) {
        this.app.fileManager.processFrontMatter(f, (fm) => {
          for (const { key, old } of changes) {
            if (old === undefined) delete fm[key];
            else fm[key] = old;
          }
        });
      }
    }
  }
}

/**
 * A lightweight, file-keyed read/write facade over note frontmatter — the
 * stateless counterpart to {@link NoteModel}, used where there is no active
 * view (inline rolls and properties in note bodies). Reads come straight from
 * the metadata cache; writes are coalesced per file (a short debounce) and
 * applied through `processFrontMatter`, the same safe write path the view uses.
 */
export class NoteFacade {
  private timers = new Map<string, number>();
  private pending = new Map<string, Map<string, unknown>>();

  constructor(private app: App, private i18n: I18n) {}

  /** Shallow copy of a file's frontmatter (empty object when none). */
  raw(file: TFile): Record<string, unknown> {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
    return fm ? { ...fm } : {};
  }

  /** Raw value of `key` (case-insensitive), or undefined. */
  get(file: TFile, key: string): unknown {
    const raw = this.raw(file);
    const k = Object.keys(raw).find((x) => x.toLowerCase() === key.toLowerCase());
    return k === undefined ? undefined : raw[k];
  }

  num(file: TFile, key: string, def = 0): number {
    return getNum(this.raw(file), key, def);
  }
  str(file: TFile, key: string): string {
    return getStr(this.raw(file), key);
  }
  list(file: TFile, key: string): string[] {
    return getList(this.raw(file), key);
  }

  /** Queue a frontmatter write (debounced per file; `undefined` removes the key). */
  set(file: TFile, key: string, value: unknown): void {
    let m = this.pending.get(file.path);
    if (!m) {
      m = new Map();
      this.pending.set(file.path, m);
    }
    m.set(key, value);
    const prev = this.timers.get(file.path);
    if (prev) window.clearTimeout(prev);
    this.timers.set(file.path, window.setTimeout(() => this.flush(file), 250));
  }

  private flush(file: TFile): void {
    this.timers.delete(file.path);
    const m = this.pending.get(file.path);
    if (!m) return;
    this.pending.delete(file.path);
    this.app.fileManager
      .processFrontMatter(file, (fm) => {
        for (const [k, v] of m) {
          if (v === undefined) delete fm[k];
          else fm[k] = v;
        }
      })
      .catch((err) => new Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }
}
