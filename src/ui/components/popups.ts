/**
 * Lightweight anchored popups (not modals):
 *
 * - the add-property menu (search + grouped candidates + create row),
 * - its hover side panel showing existing values for a key,
 * - the "notes using this value" window,
 * - the multi-value picker for list properties.
 *
 * The manager owns the open popup stack, outside-click dismissal, and
 * viewport edge flipping.
 */

import type { TFile } from "obsidian";
import type { ViewCtx } from "../../core/context";
import type { Section } from "../../core/model";
import { genId } from "../../utils/misc";
import { TextLinkSuggest } from "./suggest";

/** Insertion options shared by the add flows. */
export interface AddTarget {
  index?: number;
  replaceId?: string;
}

export class PopupManager {
  private popups: HTMLElement[] = [];
  private notesWin: HTMLElement | null = null;

  constructor(private view: ViewCtx) {}

  /** Close all open popups (with a short fade-out). */
  closeAll(): void {
    const old = this.popups;
    this.popups = [];
    this.notesWin = null;
    for (const p of old) {
      p.addClass("ep-closing");
      window.setTimeout(() => p.remove(), 140);
    }
  }

  /** Keep a popup on-screen, flipping left/up when it would overflow. */
  private fitToViewport(pop: HTMLElement, leftPx: number, anchorLeft: number): void {
    const w = pop.offsetWidth;
    if (leftPx + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, anchorLeft - w - 4) + "px" });
    const h = pop.offsetHeight;
    const top = parseFloat(pop.style.top || "0");
    if (top + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, window.innerHeight - h - 4) + "px" });
  }

  /** Dismiss when clicking outside the popups and their anchor. */
  private dismissOnOutsideClick(anchor: HTMLElement): void {
    const cleanup = () => {
      activeDocument.removeEventListener("mousedown", h);
      activeDocument.removeEventListener("keydown", esc, true);
    };
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Clicks inside Obsidian's own suggestion popup ([[ note autocomplete) must not dismiss us.
      if (t?.closest?.(".suggestion-container")) return;
      if (this.popups.some((p) => p.contains(t)) || anchor.contains(t)) return;
      cleanup();
      this.closeAll();
    };
    // Escape closes the popup (E1 keyboard accessibility).
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      cleanup();
      this.closeAll();
    };
    window.setTimeout(() => {
      activeDocument.addEventListener("mousedown", h);
      activeDocument.addEventListener("keydown", esc, true);
    }, 0);
  }

  // -- add-property menu --------------------------------------------------

  /** Candidates grouped for the add menu, each with its resolved data type. */
  private addCandidates(): {
    onNote: { key: string; typeName: string }[];
    onSidebar: { key: string; typeName: string }[];
    others: { key: string; typeName: string }[];
  } {
    const view = this.view;
    const shown = new Set<string>();
    for (const sec of view.layout.sections)
      for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    const all = new Set<string>([
      ...Object.keys(view.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...view.props.knownProps(),
    ]);
    const typed = (k: string): { key: string; typeName: string } => {
      const id = view.deriveType(k);
      const def = view.registries.valueTypes.get(id);
      return { key: k, typeName: def ? def.name(view.i18n) : id };
    };
    type Cand = { key: string; typeName: string };
    const onNote: Cand[] = [], onSidebar: Cand[] = [], others: Cand[] = [];
    for (const k of all) {
      if (view.note.raw[k] !== undefined) onNote.push(typed(k));
      else if (shown.has(k.toLowerCase())) onSidebar.push(typed(k));
      else others.push(typed(k));
    }
    // Within each group: by data type, then by key (the shared picker order).
    const srt = (a: Cand[]) =>
      a.sort((x, y) => x.typeName.localeCompare(y.typeName) || x.key.localeCompare(y.key));
    return { onNote: srt(onNote), onSidebar: srt(onSidebar), others: srt(others) };
  }

  private allKeys(): string[] {
    return [...new Set<string>([...Object.keys(this.view.note.raw), ...this.view.props.knownProps()])];
  }

  /** Create the entry (and optionally a value) and refresh. */
  private addEntryWithValue(file: TFile, section: Section, key: string, value: unknown, target?: AddTarget): void {
    const view = this.view;
    key = (key || "").trim();
    if (!key) return;
    const isList = Array.isArray(value);
    const entry = { id: genId(), kind: "prop", key, dataType: isList ? "list" : view.deriveType(key) };
    let idx = target?.index ?? section.entries.length;
    if (target?.replaceId) {
      const ri = section.entries.findIndex((e) => e.id === target.replaceId);
      if (ri >= 0) {
        section.entries.splice(ri, 1);
        idx = ri;
      }
    }
    section.entries.splice(Math.max(0, Math.min(idx, section.entries.length)), 0, entry);
    view.saveLayout();
    if (value !== undefined) view.note.set(file, key, value, true);
    else view.rerender();
  }

  /** Open the add-property popup anchored below `anchor`. */
  openAddMenu(anchor: HTMLElement, file: TFile, section: Section, target?: AddTarget): void {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-addmenu" });
    this.popups.push(pop);
    const r = anchor.getBoundingClientRect();
    pop.setCssStyles({ left: r.left + "px", top: r.bottom + 2 + "px", minWidth: "220px" });
    // Keep the menu fully inside the window: clamp horizontally, flip above
    // the anchor when it would overflow the bottom, clamp as a last resort.
    const fit = () => {
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      let left = r.left;
      let top = r.bottom + 2;
      if (left + w > window.innerWidth - 4) left = Math.max(4, window.innerWidth - w - 4);
      if (top + h > window.innerHeight - 4) top = r.top - h - 2;
      if (top < 4) top = Math.max(4, Math.min(r.bottom + 2, window.innerHeight - h - 4));
      pop.setCssStyles({ left: left + "px" });
      pop.setCssStyles({ top: top + "px" });
    };

    const search = pop.createEl("input", { cls: "ep-edit-input ep-addsearch" });
    search.type = "text";
    search.placeholder = t("add.searchPlaceholder", { section: section.title });
    const listEl = pop.createDiv({ cls: "ep-addlist" });
    const groups = this.addCandidates();

    const render = () => {
      listEl.empty();
      const q = search.value.trim().toLowerCase();
      const addRow = (c: { key: string }) => {
        const row = listEl.createDiv({ cls: "ep-pop-row" });
        row.createSpan({ text: c.key });
        if (view.hide.isHidden(c.key))
          row.createSpan({ cls: "ep-sug-badge ep-badge-hidden", text: t("add.hiddenBadge") });
        const isList = view.props.obsidianType(c.key) === "list" || Array.isArray(view.note.raw[c.key]);
        let timer = 0;
        row.onmouseenter = () => {
          timer = window.setTimeout(() => this.openValueSidePanel(row, file, section, c.key, isList, target), 450);
        };
        row.onmouseleave = () => window.clearTimeout(timer);
        row.onclick = () => {
          if (isList) {
            this.openValueSidePanel(row, file, section, c.key, true, target);
          } else {
            this.addEntryWithValue(file, section, c.key, undefined, target);
            this.closeAll();
          }
        };
      };
      const grp = (title: string, arr: { key: string; typeName: string }[]) => {
        const f = arr.filter((c) => !q || c.key.toLowerCase().includes(q));
        if (!f.length) return;
        listEl.createDiv({ cls: "ep-pop-group", text: title });
        // Sub-group by data type (the candidates arrive type-sorted).
        let lastType: string | null = null;
        for (const c of f.slice(0, 60)) {
          if (c.typeName !== lastType) {
            lastType = c.typeName;
            listEl.createDiv({ cls: "ep-pop-subgroup", text: c.typeName });
          }
          addRow(c);
        }
      };
      if (q && !this.allKeys().some((k) => k.toLowerCase() === q)) {
        const row = listEl.createDiv({ cls: "ep-pop-row ep-pop-create" });
        row.setText(t("add.create", { key: search.value.trim() }));
        row.onclick = () => {
          this.addEntryWithValue(file, section, search.value.trim(), undefined, target);
          this.closeAll();
        };
      }
      grp(t("add.groupOnNote"), groups.onNote);
      grp(t("add.groupOnSidebar"), groups.onSidebar);
      grp(t("add.groupOthers"), groups.others);
    };

    search.oninput = () => {
      render();
      fit();
    };
    search.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const v = search.value.trim();
        if (v) {
          this.addEntryWithValue(file, section, v, undefined, target);
          this.closeAll();
        }
      } else if (e.key === "Escape") {
        this.closeAll();
      }
    };
    render();
    fit();
    window.setTimeout(() => {
      fit();
      search.focus();
    }, 0);
    this.dismissOnOutsideClick(anchor);
  }

  /** Side panel listing existing values for `key` (multi-select for lists). */
  private openValueSidePanel(
    row: HTMLElement,
    file: TFile,
    section: Section,
    key: string,
    multi: boolean,
    target?: AddTarget
  ): void {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    while (this.popups.length > 1) this.popups.pop()?.remove();
    const side = activeDocument.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    const r = row.getBoundingClientRect();
    side.setCssStyles({ left: r.right + 2 + "px", top: r.top + "px", minWidth: "170px" });
    side.createDiv({ cls: "ep-side-title", text: multi ? t("add.pickValues", { key }) : key });

    const body = side.createDiv({ cls: "ep-side-body" });
    const vals = view.props.valuesFor(key);
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = multi ? t("add.customValue") : t("add.typeValue");
    new TextLinkSuggest(view.app, custom); // [[ note autocomplete
    // Multi (list property): clicking an existing value adds it IMMEDIATELY -
    // no checkbox/confirm round-trip. The first pick creates the entry with
    // that value; later picks append. Only a typed custom value still goes
    // through the Add button (Enter).
    let appended = false;
    const instantAdd = (v: string, it: HTMLElement): void => {
      if (appended) view.note.set(file, key, [...view.note.list(key), v]);
      else {
        this.addEntryWithValue(file, section, key, [v], target);
        appended = true;
      }
      it.remove();
      if (!body.querySelector(".ep-pop-row")) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    };
    const commit = (single?: string) => {
      if (multi) {
        const v = custom.value.trim();
        if (v) {
          if (appended) view.note.set(file, key, [...view.note.list(key), v]);
          else this.addEntryWithValue(file, section, key, [v], target);
        } else if (!appended) {
          this.addEntryWithValue(file, section, key, [], target);
        }
      } else {
        const v = single ?? custom.value.trim();
        this.addEntryWithValue(file, section, key, v === "" ? undefined : v, target);
      }
      this.closeAll();
    };
    for (const v of vals) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      let nt = 0;
      it.onmouseenter = () => {
        nt = window.setTimeout(() => this.openNotesWindow(it, key, v), 500);
      };
      it.onmouseleave = () => window.clearTimeout(nt);
      it.createSpan({ text: v });
      it.onclick = () => (multi ? instantAdd(v, it) : commit(v));
    }
    if (!vals.length) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    if (multi) {
      const addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addCustom") });
      addBtn.onclick = () => commit();
    } else {
      const ab = foot.createEl("button", { cls: "ep-mini-btn", text: t("add.addEmpty") });
      ab.onclick = () => {
        this.addEntryWithValue(file, section, key, undefined, target);
        this.closeAll();
      };
    }
    this.fitToViewport(side, r.right + 2, r.left);
  }

  /** Floating window listing notes that use `value` for `key`. */
  private openNotesWindow(anchor: HTMLElement, key: string, value: string): void {
    const view = this.view;
    if (this.notesWin) {
      this.notesWin.remove();
      const k = this.popups.indexOf(this.notesWin);
      if (k >= 0) this.popups.splice(k, 1);
    }
    const w = activeDocument.body.createDiv({ cls: "ep-popup ep-noteswin" });
    this.popups.push(w);
    this.notesWin = w;
    const r = anchor.getBoundingClientRect();
    w.setCssStyles({ left: r.right + 4 + "px", top: r.top + "px", minWidth: "160px" });
    w.createDiv({ cls: "ep-side-title", text: view.i18n.t("add.notesWith", { value }) });
    const body = w.createDiv({ cls: "ep-side-body" });
    const notes = view.props.notesWithValue(key, value);
    if (!notes.length) body.createDiv({ cls: "ep-empty-sub", text: view.i18n.t("add.noNotes") });
    for (const n of notes.slice(0, 100)) body.createDiv({ cls: "ep-pop-row", text: n });
    this.fitToViewport(w, r.right + 4, r.left);
  }

  // -- list value picker --------------------------------------------------

  /** Multi-select picker appending values to an existing list property. */
  openListValuePicker(left: number, top: number, file: TFile, key: string): void {
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    this.closeAll();
    const cur = view.note.list(key);
    const side = activeDocument.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    side.setCssStyles({ left: left + "px", top: top + "px", minWidth: "170px" });
    side.createDiv({ cls: "ep-side-title", text: t("list.addTo", { key }) });
    const body = side.createDiv({ cls: "ep-side-body" });
    const opts = view.props.valuesFor(key).filter((o) => !cur.some((c) => c.toLowerCase() === o.toLowerCase()));
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = t("add.customValue");
    new TextLinkSuggest(view.app, custom); // [[ note autocomplete
    // Existing values add IMMEDIATELY on click (the picker stays open for
    // more picks); only a typed custom value goes through the Add button.
    for (const v of opts) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      it.createSpan({ text: v });
      it.onclick = () => {
        view.note.set(file, key, [...view.note.list(key), v]);
        it.remove();
        if (!body.querySelector(".ep-pop-row"))
          body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
      };
    }
    if (!opts.length) body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
    let addBtn: HTMLButtonElement;
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addCustom") });
    addBtn.onclick = () => {
      const v = custom.value.trim();
      if (v) view.note.set(file, key, [...view.note.list(key), v]);
      this.closeAll();
    };
    this.fitToViewport(side, left, left);
    this.dismissOnOutsideClick(side);
  }
}
