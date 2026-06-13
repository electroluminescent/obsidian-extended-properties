/**
 * Plugin-level, persistent roll history.
 *
 * Ownership moved out of the per-view {@link RollService}: history belongs to
 * the plugin so every sidebar view (including desktop popouts, which share
 * the single plugin instance) sees the same log, and so it survives note
 * switches and reloads. Views subscribe; the roll service only appends.
 *
 * Records are serializable (no closures) and live in `settings.rollHistory`.
 * Writes are debounced so a burst of rolls (e.g. a multi-roll) doesn't thrash
 * `data.json`/sync; the flush also runs immediately on clear and on unload.
 * The in-session "re-roll" closures are kept in a side map keyed by record id
 * — they exist only for rolls made this session, never persisted.
 */

import type { I18n } from "../../i18n/i18n";
import type { EPSettings, RollRecord } from "../../core/model";

/** Default cap when the setting is missing/invalid. */
const DEFAULT_LIMIT = 500;
/** Debounce window for persisting after an append (ms). */
const FLUSH_MS = 1500;

export class HistoryService {
  /** Most-recent-first. The source of truth the panel renders from. */
  private entries: RollRecord[] = [];
  /** id → re-roll closure (this session only; not persisted). */
  private redos = new Map<string, () => void>();
  private listeners = new Set<() => void>();
  private flushTimer = 0;
  private dirty = false;

  constructor(private settings: EPSettings, private save: () => void) {
    const stored = Array.isArray(settings.rollHistory) ? settings.rollHistory : [];
    this.entries = stored.map((r) => ({ ...r }));
    this.prune();
  }

  private enabled(): boolean {
    return this.settings.rollHistoryEnabled !== false;
  }

  private limit(): number {
    const n = this.settings.rollHistoryLimit;
    return typeof n === "number" && n > 0 ? Math.min(5000, Math.floor(n)) : DEFAULT_LIMIT;
  }

  /** All entries (most-recent-first). */
  all(): RollRecord[] {
    return this.entries;
  }

  /** Entries, optionally limited to one note and/or a tail length. */
  query(o: { note?: string | null; limit?: number } = {}): RollRecord[] {
    let list = this.entries;
    if (o.note) list = list.filter((r) => r.note === o.note);
    return typeof o.limit === "number" ? list.slice(0, o.limit) : list;
  }

  /** Re-roll closure for a record made this session, if any. */
  redoFor(id: string): (() => void) | undefined {
    return this.redos.get(id);
  }

  /** Append a freshly resolved roll. `redo` re-runs it (kept in-session only). */
  append(rec: RollRecord, redo?: () => void): void {
    this.entries.unshift(rec);
    if (redo) this.redos.set(rec.id, redo);
    this.prune();
    this.dirty = true;
    this.emit();
    this.scheduleFlush();
  }

  /** Clear all entries, or just those of `note`. Persists immediately. */
  clear(note?: string | null): void {
    if (note) {
      this.entries = this.entries.filter((r) => r.note !== note);
    } else {
      this.entries = [];
      this.redos.clear();
    }
    this.dirty = true;
    this.emit();
    this.flushNow();
  }

  /** React to the on/off setting changing: flush when turned on, drop the persisted copy when off. */
  setEnabled(on: boolean): void {
    if (on) {
      this.dirty = true;
      this.flushNow();
    } else {
      this.settings.rollHistory = [];
      this.dirty = false;
      this.save();
    }
  }

  /** React to the limit setting changing: prune now and persist. */
  applyLimit(): void {
    this.prune();
    this.dirty = true;
    this.flushNow();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of [...this.listeners]) fn();
  }

  private prune(): void {
    const lim = this.limit();
    if (this.entries.length > lim) {
      const removed = this.entries.splice(lim);
      for (const r of removed) this.redos.delete(r.id);
    }
  }

  private scheduleFlush(): void {
    if (!this.enabled() || this.flushTimer) return;
    this.flushTimer = window.setTimeout(() => {
      this.flushTimer = 0;
      this.flush();
    }, FLUSH_MS);
  }

  /** Persist now, cancelling any pending debounce (clear, unload, setting change). */
  flushNow(): void {
    if (this.flushTimer) {
      window.clearTimeout(this.flushTimer);
      this.flushTimer = 0;
    }
    this.flush();
  }

  private flush(): void {
    if (!this.dirty) return;
    this.dirty = false;
    this.settings.rollHistory = this.enabled() ? this.entries.slice(0, this.limit()) : [];
    this.save();
  }

  /** Render the history (optionally one note's) as a Markdown table document. */
  exportMarkdown(i18n: I18n, note?: string | null): string {
    const rows = this.query({ note: note ?? undefined });
    const cell = (s: string) => (s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    const head =
      `| ${i18n.t("roll.export.time")} | ${i18n.t("roll.export.note")} | ${i18n.t("roll.export.label")}` +
      ` | ${i18n.t("roll.export.total")} | ${i18n.t("roll.export.mode")} | ${i18n.t("roll.export.detail")} |`;
    const sep = "| --- | --- | --- | ---: | --- | --- |";
    const body = rows.map((r) => {
      const time = new Date(r.time).toLocaleString();
      const noteName = cell(r.noteName || r.note || "");
      return `| ${cell(time)} | ${noteName} | ${cell(r.label)} | ${r.total} | ${cell(r.mode)} | ${cell(r.text)} |`;
    });
    return [`# ${i18n.t("roll.export.title")}`, "", head, sep, ...body, ""].join("\n");
  }
}
