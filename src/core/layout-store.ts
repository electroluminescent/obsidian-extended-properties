/**
 * Optional vault-file persistence for per-type sidebar layouts (roadmap D2).
 *
 * When enabled, each note type's layout is stored as one JSON file in a vault
 * folder, so configuration syncs / diffs / shares with the vault instead of
 * living only in `data.json`. It is opt-in and additive: `settings.layouts`
 * stays the in-memory source of truth, these files mirror it and win on load,
 * and `data.json` keeps a copy as a backup. Every operation is defensive - a
 * missing folder or a hand-corrupted file fails per file with a notice, never
 * an exception that could break the plugin.
 */
import { App, Notice } from "obsidian";
import type { I18n } from "../i18n/i18n";
import type { Layout } from "./model";

const ENVELOPE_SCHEMA = 1;
/** How long after our own write a vault event counts as an echo (ms). */
const ECHO_MS = 1500;
const DEFAULT_FOLDER = "_extended-properties";

/** Trim a vault folder path and strip leading/trailing slashes. */
export function cleanFolder(f: string): string {
  return (f || "").trim().replace(/^[/\\]+|[/\\]+$/g, "");
}
/** A filesystem-safe file stem for a (lower-cased) type key. */
function safeStem(typeKey: string): string {
  return typeKey.replace(/[\\/:*?"<>|]/g, "_").slice(0, 80) || "type";
}
function isLayout(x: unknown): x is Layout {
  return !!x && typeof x === "object" && Array.isArray((x as Layout).sections);
}

interface Envelope {
  ep: "extended-properties-layout";
  schema: number;
  type: string;
  typeName?: string;
  layout: Layout;
}

export class LayoutStore {
  private timers = new Map<string, number>();
  private lastWrite = new Map<string, number>();
  /** Last JSON written per file, to skip no-op rewrites (avoids sync churn). */
  private lastContent = new Map<string, string>();

  constructor(
    private app: App,
    private i18n: I18n,
    private folder: () => string,
    private getLayout: (key: string) => Layout | undefined,
    private getTypeName: (key: string) => string
  ) {}

  private dir(): string {
    return cleanFolder(this.folder()) || DEFAULT_FOLDER;
  }
  private pathFor(typeKey: string): string {
    return `${this.dir()}/${safeStem(typeKey.toLowerCase())}.json`;
  }

  /** True when `path` was just written by us (ignore its vault echo). */
  isEcho(path: string): boolean {
    const t = this.lastWrite.get(path);
    return t !== undefined && Date.now() - t < ECHO_MS;
  }
  /** Whether `path` is a layout file in our folder. */
  owns(path: string): boolean {
    const d = this.dir().toLowerCase();
    const p = path.toLowerCase();
    return p.startsWith(d + "/") && p.endsWith(".json");
  }

  /** Read every layout file in the folder. Bad files are skipped with a notice. */
  async readAll(): Promise<Record<string, Layout>> {
    const out: Record<string, Layout> = {};
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!(await adapter.exists(dir))) return out;
      const listing = await adapter.list(dir);
      for (const f of listing.files) {
        if (!f.toLowerCase().endsWith(".json")) continue;
        try {
          const env = JSON.parse(await adapter.read(f)) as Partial<Envelope>;
          if (typeof env.type === "string" && isLayout(env.layout)) out[env.type.toLowerCase()] = env.layout;
          else new Notice(this.i18n.t("layoutStore.badFile", { file: f }));
        } catch {
          new Notice(this.i18n.t("layoutStore.badFile", { file: f }));
        }
      }
    } catch (e) {
      console.error("Extended Properties: reading layout files failed", e);
    }
    return out;
  }

  /** Write one type's current layout immediately (skips a no-op rewrite). */
  private async writeNow(typeKey: string): Promise<void> {
    const layout = this.getLayout(typeKey.toLowerCase());
    if (!layout) return;
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    const path = this.pathFor(typeKey);
    const env: Envelope = {
      ep: "extended-properties-layout",
      schema: ENVELOPE_SCHEMA,
      type: typeKey.toLowerCase(),
      typeName: this.getTypeName(typeKey.toLowerCase()),
      layout,
    };
    const json = JSON.stringify(env, null, 2);
    if (this.lastContent.get(path) === json) return;
    try {
      if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
      this.lastWrite.set(path, Date.now());
      await adapter.write(path, json);
      this.lastWrite.set(path, Date.now());
      this.lastContent.set(path, json);
    } catch (e) {
      console.error("Extended Properties: writing layout file failed", e);
      new Notice(this.i18n.t("layoutStore.writeFailed", { type: this.getTypeName(typeKey.toLowerCase()) }));
    }
  }

  /** Debounced write of one type's layout. */
  write(typeKey: string): void {
    const key = typeKey.toLowerCase();
    const prev = this.timers.get(key);
    if (prev) window.clearTimeout(prev);
    this.timers.set(
      key,
      window.setTimeout(() => {
        this.timers.delete(key);
        void this.writeNow(key);
      }, 400)
    );
  }

  /** Write every given type's layout now (used when enabling vault mode). */
  async writeAll(types: string[]): Promise<void> {
    for (const t of types) await this.writeNow(t.toLowerCase());
  }

  /** Delete a type's layout file (used when a type is removed). */
  async remove(typeKey: string): Promise<void> {
    try {
      const path = this.pathFor(typeKey);
      const adapter = this.app.vault.adapter;
      this.lastWrite.set(path, Date.now());
      this.lastContent.delete(path);
      if (await adapter.exists(path)) await adapter.remove(path);
    } catch (e) {
      console.error("Extended Properties: removing layout file failed", e);
    }
  }

  /** Flush all pending debounced writes immediately (call on unload). */
  flushAll(): void {
    const keys = [...this.timers.keys()];
    for (const t of this.timers.values()) window.clearTimeout(t);
    this.timers.clear();
    for (const k of keys) void this.writeNow(k);
  }
}
