/**
 * In-memory vault fake for the seam tests (F6): an App-shaped object with a
 * frontmatter store, TFile handles, `processFrontMatter`, and a helper to
 * simulate external edits (sync, another pane) by replacing frontmatter and
 * advancing the mtime - enough to run the write-queue, merge and flush flows
 * end to end without Obsidian.
 */

import { TFile } from "obsidian"; // the test stub class

export class SeamFile extends TFile {
  stat = { mtime: 10_000 };
  constructor(public path: string) {
    super();
  }
  get basename(): string {
    return this.path.replace(/^.*\//, "").replace(/\.md$/, "");
  }
}

export class SeamApp {
  store = new Map<string, { file: SeamFile; fm: Record<string, unknown> }>();
  /** How many times `processFrontMatter` actually wrote. */
  writes = 0;

  /** Create a note with frontmatter; returns its file handle. */
  note(path: string, fm: Record<string, unknown> = {}): SeamFile {
    const file = new SeamFile(path);
    this.store.set(path, { file, fm: { ...fm } });
    return file;
  }

  /** Current frontmatter of a note. */
  fm(path: string): Record<string, unknown> | undefined {
    return this.store.get(path)?.fm;
  }

  /** Simulate an external edit: replace frontmatter and advance the mtime. */
  external(path: string, fm: Record<string, unknown>, dmtime = 1000): void {
    const rec = this.store.get(path);
    if (!rec) throw new Error("no such file: " + path);
    rec.fm = { ...fm };
    rec.file.stat.mtime += dmtime;
  }

  vault = {
    getMarkdownFiles: (): TFile[] => [...this.store.values()].map((r) => r.file),
    getAbstractFileByPath: (p: string): TFile | null => this.store.get(p)?.file ?? null,
  };

  metadataCache = {
    getFileCache: (f: SeamFile): { frontmatter?: Record<string, unknown> } | null => {
      const rec = this.store.get(f.path);
      return rec ? { frontmatter: rec.fm } : null;
    },
  };

  fileManager = {
    processFrontMatter: async (f: SeamFile, fn: (fm: Record<string, unknown>) => void): Promise<void> => {
      const rec = this.store.get(f.path);
      if (!rec) throw new Error("no such file: " + f.path);
      fn(rec.fm);
      rec.file.stat.mtime += 10;
      this.writes++;
    },
  };
}

/** A minimal i18n: tests assert on data, not on strings. */
export const fakeI18n = { t: (k: string) => k } as unknown as import("../../src/i18n/i18n").I18n;
