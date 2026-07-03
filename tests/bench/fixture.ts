/**
 * Synthetic-vault fixture (N2): a fake App serving generated frontmatter to
 * PropertyIndex, instrumented so the scaling tests can assert on *work done*
 * (metadata-cache consultations, frontmatter property reads) instead of
 * flaky wall-clock time.
 */

import { TFile } from "obsidian"; // the test stub class

export class FakeTFile extends TFile {
  stat = { mtime: 0 };
  constructor(public path: string) {
    super();
  }
  get basename(): string {
    return this.path.replace(/^.*\//, "").replace(/\.md$/, "");
  }
}

export class FixtureApp {
  files = new Map<string, { file: FakeTFile; fm: Record<string, unknown> | undefined }>();
  /** How many times the metadata cache was consulted. */
  cacheReads = 0;
  /** How many frontmatter objects had properties read (via proxy traps). */
  fmReads = 0;

  /** Count property/key accesses on a frontmatter object. */
  private instrument(fm: Record<string, unknown>): Record<string, unknown> {
    const self = this;
    return new Proxy(fm, {
      get(t, p) {
        self.fmReads++;
        return t[p as string];
      },
      ownKeys(t) {
        self.fmReads++;
        return Reflect.ownKeys(t);
      },
    });
  }

  add(path: string, fm: Record<string, unknown> | undefined): FakeTFile {
    const file = new FakeTFile(path);
    this.files.set(path, { file, fm: fm ? this.instrument(fm) : undefined });
    return file;
  }

  /** Replace a note's frontmatter (simulates an edit; caller invalidates). */
  setFm(path: string, fm: Record<string, unknown>): void {
    const rec = this.files.get(path);
    if (rec) rec.fm = this.instrument(fm);
  }

  vault = {
    getMarkdownFiles: (): TFile[] => [...this.files.values()].map((x) => x.file),
    getAbstractFileByPath: (p: string): TFile | null => this.files.get(p)?.file ?? null,
  };

  metadataCache = {
    getFileCache: (f: FakeTFile): { frontmatter?: Record<string, unknown> } | null => {
      this.cacheReads++;
      const rec = this.files.get(f.path);
      return rec ? { frontmatter: rec.fm } : null;
    },
    getFirstLinkpathDest: (): null => null,
  };
}

/** Generate `notes` notes spread across `types`, with numeric properties. */
export function generateVault(app: FixtureApp, notes: number, types: string[]): void {
  for (let i = 0; i < notes; i++) {
    const type = types[i % types.length];
    app.add(`n/${i}.md`, {
      Type: [type],
      Level: (i % 20) + 1,
      HP: i % 100,
      Gold: i % 7,
      Name: "N" + i,
    });
  }
}
