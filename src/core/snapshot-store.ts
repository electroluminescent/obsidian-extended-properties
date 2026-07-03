/**
 * Configuration history snapshots (roadmap L1).
 *
 * Writes timestamped JSON snapshots of the plugin's customization state (types,
 * layouts, derivation blocks, short forms, defaults, styling - everything a
 * user arranges) to a `snapshots/` subfolder of the layout vault folder, so a
 * layout or settings change can be rolled back from inside the vault. Note
 * *values* themselves live in the notes (and already have the vault's own sync
 * / git history); these snapshots protect the plugin configuration.
 *
 * Defensive throughout - a snapshot is insurance and must never throw into the
 * load path. The pure name/prune helpers are unit-tested.
 */
import { App, Notice } from "obsidian";
import type { I18n } from "../i18n/i18n";
import { cleanFolder } from "./layout-store";

const SCHEMA = 1;
const PREFIX = "ep-snapshot-";

/** A filesystem- and sort-stable stem for a snapshot taken at `d`. */
export function snapshotStem(d: Date = new Date()): string {
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return (
    PREFIX +
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

/**
 * Given snapshot file names, return the ones to delete so that only the newest
 * `keep` remain. Names embed a zero-padded timestamp, so lexicographic order is
 * chronological.
 */
export function pruneList(names: string[], keep: number): string[] {
  const snaps = names.filter((n) => n.includes(PREFIX)).sort();
  if (keep <= 0) return snaps;
  return snaps.slice(0, Math.max(0, snaps.length - keep));
}

export interface SnapshotMeta {
  /** Full vault path of the snapshot file. */
  path: string;
  /** Base name (sortable). */
  name: string;
}

interface SnapshotEnvelope {
  ep: "extended-properties-snapshot";
  schema: number;
  time: number;
  app?: string;
  data: unknown;
}

export class SnapshotStore {
  constructor(private app: App, private i18n: I18n, private folder: () => string, private appVersion?: string) {}

  private dir(): string {
    return (cleanFolder(this.folder()) || "_extended-properties") + "/snapshots";
  }

  /** Write a snapshot of `data`; prune to the newest `keep`. Returns its path or null. */
  async save(data: unknown, keep = 20): Promise<string | null> {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    const path = `${dir}/${snapshotStem()}.json`;
    const env: SnapshotEnvelope = {
      ep: "extended-properties-snapshot",
      schema: SCHEMA,
      time: Date.now(),
      app: this.appVersion,
      data,
    };
    try {
      if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
      await adapter.write(path, JSON.stringify(env, null, 2));
      await this.prune(keep);
      return path;
    } catch (e) {
      console.error("Extended Properties: snapshot save failed", e);
      new Notice(this.i18n.t("snapshot.saveFailed"));
      return null;
    }
  }

  /** All snapshots, newest first. */
  async list(): Promise<SnapshotMeta[]> {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!(await adapter.exists(dir))) return [];
      const listing = await adapter.list(dir);
      return listing.files
        .filter((f) => f.includes(PREFIX) && f.endsWith(".json"))
        .map((f) => ({ path: f, name: f.split("/").pop() ?? f }))
        .sort((a, b) => b.name.localeCompare(a.name));
    } catch (e) {
      console.error("Extended Properties: snapshot list failed", e);
      return [];
    }
  }

  /** Parsed `data` payload of a snapshot, or null if unreadable. */
  async read(path: string): Promise<unknown | null> {
    try {
      const env = JSON.parse(await this.app.vault.adapter.read(path)) as Partial<SnapshotEnvelope>;
      return env && env.ep === "extended-properties-snapshot" ? env.data ?? null : null;
    } catch (e) {
      console.error("Extended Properties: snapshot read failed", e);
      new Notice(this.i18n.t("snapshot.readFailed"));
      return null;
    }
  }

  /** Delete all but the newest `keep` snapshots. */
  async prune(keep: number): Promise<void> {
    const adapter = this.app.vault.adapter;
    const dir = this.dir();
    try {
      if (!(await adapter.exists(dir))) return;
      const listing = await adapter.list(dir);
      const names = listing.files.map((f) => f.split("/").pop() ?? f);
      const toDelete = pruneList(names, keep);
      for (const name of toDelete) {
        const full = `${dir}/${name}`;
        if (await adapter.exists(full)) await adapter.remove(full);
      }
    } catch (e) {
      console.error("Extended Properties: snapshot prune failed", e);
    }
  }
}
