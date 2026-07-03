/**
 * Integration tests over the Obsidian seam (F6): whole write-path flows run
 * against the in-memory vault fake — batch write coalescing, the three-way
 * auto-merge, the unload flushes, edit-session revert, and the roll-history
 * migration. Assertions are on observable outcomes (file contents, settings
 * state), never on stub internals.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// NoteModel/NoteFacade/HistoryService schedule through window timers.
(globalThis as { window?: unknown }).window = globalThis;

import { NoteFacade, NoteModel } from "../src/core/note-model";
import { HistoryService, type HistoryStore } from "../src/features/rolling/history";
import { defaultSettings } from "../src/core/settings";
import type { RollRecord } from "../src/core/model";
import { fakeI18n, SeamApp } from "./stubs/fake-app";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const facadeOf = (app: SeamApp, guard = true): NoteFacade =>
  new NoteFacade(app as never, fakeI18n, () => guard);

describe("NoteFacade (D4 write queue)", () => {
  it("coalesces a burst of sets into one debounced write", async () => {
    const app = new SeamApp();
    const f = app.note("a.md", { HP: 1 });
    const facade = facadeOf(app);
    facade.set(f, "HP", 2);
    facade.set(f, "MP", 5);
    facade.set(f, "HP", 3); // last value wins
    expect(app.writes).toBe(0); // nothing lands before the debounce
    await vi.advanceTimersByTimeAsync(500);
    expect(app.writes).toBe(1);
    expect(app.fm("a.md")).toMatchObject({ HP: 3, MP: 5 });
  });

  it("removes a key when set to undefined", async () => {
    const app = new SeamApp();
    const f = app.note("a.md", { HP: 1, Tag: "x" });
    const facade = facadeOf(app);
    facade.set(f, "Tag", undefined);
    await vi.advanceTimersByTimeAsync(500);
    expect("Tag" in app.fm("a.md")!).toBe(false);
    expect(app.fm("a.md")).toMatchObject({ HP: 1 });
  });

  it("flushAll lands pending writes immediately (unload path)", async () => {
    const app = new SeamApp();
    const f = app.note("a.md", { HP: 1 });
    const facade = facadeOf(app);
    facade.set(f, "HP", 9);
    facade.flushAll();
    await vi.advanceTimersByTimeAsync(0); // settle the async write
    expect(app.writes).toBe(1);
    expect(app.fm("a.md")!.HP).toBe(9);
  });

  it("auto-merges an external edit to a different key (three-way merge)", async () => {
    const app = new SeamApp();
    const f = app.note("b.md", { HP: 1, Note: "x" });
    const facade = facadeOf(app);
    facade.set(f, "HP", 7); // batch baseline: { HP: 1, Note: "x" }
    app.external("b.md", { HP: 1, Note: "edited elsewhere" }); // disjoint change
    await vi.advanceTimersByTimeAsync(500);
    // Both sides survive: our HP write, their Note edit.
    expect(app.fm("b.md")).toMatchObject({ HP: 7, Note: "edited elsewhere" });
  });

  it("with the guard off, the queued write simply overwrites", async () => {
    const app = new SeamApp();
    const f = app.note("c.md", { HP: 1 });
    const facade = facadeOf(app, false);
    facade.set(f, "HP", 7);
    app.external("c.md", { HP: 100 });
    await vi.advanceTimersByTimeAsync(500);
    expect(app.fm("c.md")!.HP).toBe(7);
  });
});

describe("NoteModel (sidebar write path)", () => {
  const hostOf = () => ({
    onLightChange: () => undefined,
    onFullChange: () => undefined,
    captureUndo: () => true,
    conflictGuard: () => true,
  });

  it("batches sets and flushes on demand (note switch / close path)", async () => {
    const app = new SeamApp();
    const f = app.note("m.md", { HP: 1, MP: 2 });
    const model = new NoteModel(app as never, fakeI18n, hostOf());
    model.load(f);
    model.set(f, "HP", 11);
    model.set(f, "MP", 12);
    expect(app.writes).toBe(0);
    model.flushPending();
    await vi.advanceTimersByTimeAsync(0);
    expect(app.writes).toBe(1);
    expect(app.fm("m.md")).toMatchObject({ HP: 11, MP: 12 });
  });

  it("revertUndo writes every captured original back and resolves when done", async () => {
    const app = new SeamApp();
    const f = app.note("u.md", { HP: 1, Name: "Ari" });
    const model = new NoteModel(app as never, fakeI18n, hostOf());
    model.load(f);
    model.set(f, "HP", 50);
    model.set(f, "Name", "Changed");
    await vi.advanceTimersByTimeAsync(500); // edits land
    expect(app.fm("u.md")).toMatchObject({ HP: 50, Name: "Changed" });
    await model.revertUndo();
    expect(app.fm("u.md")).toMatchObject({ HP: 1, Name: "Ari" });
  });
});

describe("HistoryService (roll-history store)", () => {
  const rec = (id: string, time = 1): RollRecord => ({
    id,
    time,
    note: null,
    label: "r",
    text: "1d20",
    brief: "r: 1",
    total: 1,
    mode: "normal",
    tone: "normal",
  });

  const makeStore = (initial: RollRecord[]): { store: HistoryStore; state: { data: RollRecord[] } } => {
    const state = { data: initial };
    return {
      state,
      store: {
        load: async () => state.data,
        save: (r: RollRecord[]) => {
          state.data = r;
        },
      },
    };
  };

  it("migrates legacy settings.rollHistory into the store once, deduplicated", async () => {
    const settings = defaultSettings();
    settings.rollHistory = [rec("a", 3), rec("b", 2)];
    const { store, state } = makeStore([rec("b", 2), rec("c", 1)]);
    let saved = 0;
    const h = new HistoryService(settings, () => saved++, store);
    await h.init();
    expect(settings.rollHistory).toEqual([]); // out of data.json
    expect(saved).toBeGreaterThan(0); // cleared key persisted
    expect(state.data.map((r) => r.id).sort()).toEqual(["a", "b", "c"]);
    expect(h.all().map((r) => r.id)).toEqual(["a", "b", "c"]); // newest first
  });

  it("appends persist to the store (debounced), not to settings", async () => {
    const settings = defaultSettings();
    const { store, state } = makeStore([]);
    const h = new HistoryService(settings, () => undefined, store);
    await h.init();
    h.append(rec("x"));
    expect(state.data.some((r) => r.id === "x")).toBe(false); // debounce pending
    await vi.advanceTimersByTimeAsync(2000);
    expect(state.data.some((r) => r.id === "x")).toBe(true);
    expect(settings.rollHistory).toEqual([]);
  });

  it("disabling persistence clears the store copy", async () => {
    const settings = defaultSettings();
    const { store, state } = makeStore([rec("a")]);
    const h = new HistoryService(settings, () => undefined, store);
    await h.init();
    h.setEnabled(false);
    await vi.advanceTimersByTimeAsync(0);
    expect(state.data).toEqual([]);
  });
});
