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
import { conflictingKeys } from "./merge";

/** How long after our own write a metadata event counts as an echo (ms). */
const ECHO_WINDOW_MS = 600;

/** Coalescing debounce for queued writes (ms) - short enough to feel live. */
const WRITE_DEBOUNCE_MS = 300;
/** Hard cap so a long continuous burst (a slider drag) still flushes (ms). */
const WRITE_MAXWAIT_MS = 1000;
/** An external mtime advance beyond this since a batch began is a conflict (ms). */
const CONFLICT_EPS_MS = 400;

/**
 * Sticky notice with two actions, shown when a file changed on disk (sync,
 * another pane) while a queued frontmatter write was still pending. Built with
 * plain DOM so it needs no Obsidian element helpers.
 */
function writeConflictNotice(
  i18n: I18n,
  fileName: string,
  onKeepMine: () => void,
  onTakeTheirs: () => void,
  conflictKeys: string[] = []
): void {
  const frag = activeDocument.createDocumentFragment();
  const msg = activeDocument.createElement("div");
  msg.className = "ep-conflict-msg";
  msg.textContent = i18n.t("conflict.message", { note: fileName });
  frag.appendChild(msg);
  if (conflictKeys.length) {
    const keys = activeDocument.createElement("div");
    keys.className = "ep-conflict-keys";
    keys.textContent = i18n.t("conflict.keys", { keys: conflictKeys.join(", ") });
    frag.appendChild(keys);
  }
  const row = activeDocument.createElement("div");
  row.className = "ep-conflict-actions";
  const mine = activeDocument.createElement("button");
  mine.className = "mod-warning";
  mine.textContent = i18n.t("conflict.keepMine");
  const theirs = activeDocument.createElement("button");
  theirs.textContent = i18n.t("conflict.takeTheirs");
  row.appendChild(mine);
  row.appendChild(theirs);
  frag.appendChild(row);
  let notice: Notice;
  mine.onclick = () => {
    notice.hide();
    onKeepMine();
  };
  theirs.onclick = () => {
    notice.hide();
    onTakeTheirs();
  };
  notice = new Notice(frag, 0);
}

interface UndoRecord { path: string; key: string; old: unknown }

/** Callbacks the owning view supplies. */
export interface NoteModelHost {
  /** In-place refresh of rendered values. */
  onLightChange(): void;
  /** Full re-render (structure changed). */
  onFullChange(): void;
  /** Whether value changes should be captured for session undo. */
  captureUndo(): boolean;
  /** Whether the external-edit conflict guard is enabled (default true). */
  conflictGuard?(): boolean;
}

export class NoteModel {
  /** Raw frontmatter of the active note (shallow copy of the cache). */
  raw: Record<string, unknown> = {};
  /** Path of the note `raw` belongs to. */
  path: string | null = null;

  private lastWritePath: string | null = null;
  private lastWriteTime = 0;
  private undo = new Map<string, UndoRecord>();

  // Write queue (D4): per-file coalescing by key + conflict baseline.
  private pendingKeys = new Map<string, Set<string>>();
  private writeTimers = new Map<string, number>();
  private batchBase = new Map<string, number>();
  /** Frontmatter snapshot when each batch began - the ancestor for 3-way merge. */
  private batchBaseFm = new Map<string, Record<string, unknown>>();
  private batchStart = new Map<string, number>();
  private conflictPaths = new Set<string>();

  constructor(private app: App, private i18n: I18n, private host: NoteModelHost) {}

  // -- loading ---------------------------------------------------------

  /** Load `raw` from the metadata cache for `file`. */
  load(file: TFile): void {
    // Persist any queued writes for the note we're leaving before switching.
    if (this.path && this.path !== file.path) this.flushPending(this.path);
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
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
   * Set one property; the UI updates now, the file write is queued (debounced).
   * @param full re-render instead of in-place value refresh
   */
  set(file: TFile, key: string, value: unknown, full = false): void {
    this.recordUndo(file, key);
    if (value === undefined) delete this.raw[key];
    else this.raw[key] = value;
    if (full) this.host.onFullChange();
    else this.host.onLightChange();
    this.queueWrite(file, key);
  }

  /** Set several properties at once (coalesced into one queued write, full re-render). */
  setMany(file: TFile, entries: Record<string, unknown>): void {
    for (const key of Object.keys(entries)) this.recordUndo(file, key);
    Object.assign(this.raw, entries);
    this.host.onFullChange();
    for (const key of Object.keys(entries)) this.queueWrite(file, key);
  }

  /** Queue `key` for a coalesced, debounced write of `raw[key]` to `file`. */
  private queueWrite(file: TFile, key: string): void {
    const path = file.path;
    let keys = this.pendingKeys.get(path);
    if (!keys) {
      keys = new Set();
      this.pendingKeys.set(path, keys);
      this.batchBase.set(path, file.stat?.mtime ?? 0);
      this.batchBaseFm.set(path, { ...((this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {}) });
      this.batchStart.set(path, Date.now());
    }
    keys.add(key);
    if (this.conflictPaths.has(path)) return; // suspended until the user resolves
    const prev = this.writeTimers.get(path);
    if (prev) window.clearTimeout(prev);
    const elapsed = Date.now() - (this.batchStart.get(path) ?? Date.now());
    const wait = Math.max(0, Math.min(WRITE_DEBOUNCE_MS, WRITE_MAXWAIT_MS - elapsed));
    this.writeTimers.set(path, window.setTimeout(() => void this.flushFile(file), wait));
  }

  private async flushFile(file: TFile): Promise<void> {
    const path = file.path;
    const timer = this.writeTimers.get(path);
    if (timer) window.clearTimeout(timer);
    this.writeTimers.delete(path);
    const keys = this.pendingKeys.get(path);
    if (!keys || keys.size === 0) {
      this.clearBatch(path);
      return;
    }
    const base = this.batchBase.get(path) ?? 0;
    const cur = file.stat?.mtime ?? 0;
    const guard = this.host.conflictGuard ? this.host.conflictGuard() : true;
    // The note changed on disk after our batch began, and it isn't our own echo.
    if (guard && base && cur - base > CONFLICT_EPS_MS && !this.isEcho(file)) {
      // Three-way merge: only the keys both sides changed differently are real
      // conflicts. If none, write our keys onto their file - their other edits
      // are preserved because we never touch keys we didn't change.
      const theirs = (this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {};
      const baseFm = this.batchBaseFm.get(path) ?? {};
      const conflicts = conflictingKeys(baseFm, theirs, this.raw, [...keys]);
      if (conflicts.length === 0) {
        const n = keys.size;
        await this.applyWrites(file, [...keys]);
        new Notice(this.i18n.t("conflict.merged", { note: file.basename, n: String(n) }));
        return;
      }
      this.promptConflict(file, conflicts);
      return; // keys retained; the prompt decides
    }
    await this.applyWrites(file, [...keys]);
  }

  private async applyWrites(file: TFile, keys: string[]): Promise<void> {
    this.clearBatch(file.path);
    this.stampWrite(file);
    try {
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        for (const k of keys) {
          const cur = this.raw[k];
          if (cur === undefined) delete fm[k];
          else fm[k] = cur;
        }
      });
      this.lastWriteTime = Date.now();
    } catch (err) {
      new Notice(this.i18n.t("notice.saveFailed", { error: String(err) }));
    }
  }

  private promptConflict(file: TFile, conflicts: string[] = []): void {
    const path = file.path;
    if (this.conflictPaths.has(path)) return;
    this.conflictPaths.add(path);
    writeConflictNotice(
      this.i18n,
      file.basename,
      () => {
        // Keep mine: overwrite with everything queued (including edits made while open).
        this.conflictPaths.delete(path);
        const keys = this.pendingKeys.get(path);
        if (keys && keys.size) void this.applyWrites(file, [...keys]);
        else this.clearBatch(path);
      },
      () => {
        // Take theirs: drop our pending edits and reload from disk.
        this.conflictPaths.delete(path);
        this.clearBatch(path);
        const af = this.app.vault.getAbstractFileByPath(path);
        if (af instanceof TFile) this.load(af);
        this.host.onFullChange();
      },
      conflicts
    );
  }

  /** Force-write any pending changes immediately (file switch / unload). */
  flushPending(path?: string): void {
    const paths = path ? [path] : [...this.pendingKeys.keys()];
    for (const p of paths) {
      if (this.conflictPaths.has(p)) continue; // leave conflicted files to the user
      const keys = this.pendingKeys.get(p);
      if (!keys || keys.size === 0) {
        this.clearBatch(p);
        continue;
      }
      const af = this.app.vault.getAbstractFileByPath(p);
      if (af instanceof TFile) void this.applyWrites(af, [...keys]);
      else this.clearBatch(p);
    }
  }

  private clearBatch(path: string): void {
    const t = this.writeTimers.get(path);
    if (t) window.clearTimeout(t);
    this.writeTimers.delete(path);
    this.pendingKeys.delete(path);
    this.batchBase.delete(path);
    this.batchBaseFm.delete(path);
    this.batchStart.delete(path);
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

  /**
   * Write all captured original values back to their files. Resolves when
   * every write has landed (or failed with a notice), so callers can reload
   * afterwards. Deliberately NOT stamped as our own write: the metadata
   * echo is what refreshes the view once the cache reflects the revert.
   */
  async revertUndo(): Promise<void> {
    const byFile = new Map<string, { key: string; old: unknown }[]>();
    for (const { path, key, old } of this.undo.values()) {
      if (!byFile.has(path)) byFile.set(path, []);
      byFile.get(path)!.push({ key, old });
    }
    await Promise.all(
      [...byFile].map(async ([path, changes]) => {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (!(f instanceof TFile)) return;
        try {
          await this.app.fileManager.processFrontMatter(f, (fm) => {
            for (const { key, old } of changes) {
              if (old === undefined) delete fm[key];
              else fm[key] = old;
            }
          });
        } catch (err) {
          new Notice(this.i18n.t("notice.saveFailed", { error: String(err) }));
        }
      })
    );
  }
}

/**
 * A lightweight, file-keyed read/write facade over note frontmatter - the
 * stateless counterpart to {@link NoteModel}, used where there is no active
 * view (inline rolls and properties in note bodies). Reads come straight from
 * the metadata cache; writes are coalesced per file (a short debounce) and
 * applied through `processFrontMatter`, the same safe write path the view uses.
 */
export class NoteFacade {
  private timers = new Map<string, number>();
  private pending = new Map<string, Map<string, unknown>>();
  /** File mtime captured when each pending batch began (conflict baseline). */
  private bases = new Map<string, number>();
  /** Frontmatter snapshot when each batch began - the ancestor for 3-way merge. */
  private baseFm = new Map<string, Record<string, unknown>>();
  /** When we last wrote each file, to ignore our own echo (ms). */
  private lastWriteAt = new Map<string, number>();
  /** Paths with an open conflict prompt (auto-flush suspended). */
  private conflicts = new Set<string>();

  constructor(private app: App, private i18n: I18n, private guard?: () => boolean) {}

  /** Shallow copy of a file's frontmatter (empty object when none). */
  raw(file: TFile): Record<string, unknown> {
    const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
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
      this.bases.set(file.path, file.stat?.mtime ?? 0);
      this.baseFm.set(file.path, { ...((this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {}) });
    }
    m.set(key, value);
    if (this.conflicts.has(file.path)) return; // suspended until the user resolves
    const prev = this.timers.get(file.path);
    if (prev) window.clearTimeout(prev);
    this.timers.set(file.path, window.setTimeout(() => this.flush(file), WRITE_DEBOUNCE_MS));
  }

  private flush(file: TFile): void {
    this.timers.delete(file.path);
    const m = this.pending.get(file.path);
    if (!m || m.size === 0) {
      this.pending.delete(file.path);
      this.bases.delete(file.path);
      this.baseFm.delete(file.path);
      return;
    }
    const base = this.bases.get(file.path) ?? 0;
    const cur = file.stat?.mtime ?? 0;
    const guard = this.guard ? this.guard() : true;
    const echoed = Date.now() - (this.lastWriteAt.get(file.path) ?? 0) < ECHO_WINDOW_MS;
    if (guard && base && cur - base > CONFLICT_EPS_MS && !echoed) {
      // Three-way merge (see NoteModel.flushFile): auto-merge unless both sides
      // changed the same key differently.
      const theirs = (this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {};
      const baseFm = this.baseFm.get(file.path) ?? {};
      const mine: Record<string, unknown> = {};
      for (const [k, v] of m) mine[k] = v;
      const conflicts = conflictingKeys(baseFm, theirs, mine, [...m.keys()]);
      if (conflicts.length === 0) {
        const n = m.size;
        this.write(file);
        new Notice(this.i18n.t("conflict.merged", { note: file.basename, n: String(n) }));
        return;
      }
      this.conflicts.add(file.path);
      writeConflictNotice(
        this.i18n,
        file.basename,
        () => {
          this.conflicts.delete(file.path);
          this.write(file);
        },
        () => {
          this.conflicts.delete(file.path);
          this.pending.delete(file.path);
          this.bases.delete(file.path);
          this.baseFm.delete(file.path);
        },
        conflicts
      );
      return;
    }
    this.write(file);
  }

  /**
   * Force-write every pending batch immediately (plugin unload). Mirrors
   * {@link NoteModel.flushPending}: writes land without the conflict check -
   * there is no one left to prompt - except files with an open conflict
   * prompt, which stay suspended for the user's decision.
   */
  flushAll(): void {
    for (const path of [...this.pending.keys()]) {
      if (this.conflicts.has(path)) continue;
      const t = this.timers.get(path);
      if (t) window.clearTimeout(t);
      this.timers.delete(path);
      const af = this.app.vault.getAbstractFileByPath(path);
      if (af instanceof TFile) this.write(af);
      else {
        this.pending.delete(path);
        this.bases.delete(path);
        this.baseFm.delete(path);
      }
    }
  }

  private write(file: TFile): void {
    const m = this.pending.get(file.path);
    if (!m) return;
    this.pending.delete(file.path);
    this.baseFm.delete(file.path);
    this.lastWriteAt.set(file.path, Date.now());
    this.bases.set(file.path, file.stat?.mtime ?? 0);
    this.app.fileManager
      .processFrontMatter(file, (fm) => {
        for (const [k, v] of m) {
          if (v === undefined) delete fm[k];
          else fm[k] = v;
        }
      })
      .then(() => this.lastWriteAt.set(file.path, Date.now()))
      .catch((err) => new Notice(this.i18n.t("notice.saveFailed", { error: String(err) })));
  }
}
