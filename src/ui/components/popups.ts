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
    if (leftPx + w > window.innerWidth - 4) pop.style.left = Math.max(4, anchorLeft - w - 4) + "px";
    const h = pop.offsetHeight;
    const top = parseFloat(pop.style.top || "0");
    if (top + h > window.innerHeight - 4) pop.style.top = Math.max(4, window.innerHeight - h - 4) + "px";
  }

  /** Dismiss when clicking outside the popups and their anchor. */
  private dismissOnOutsideClick(anchor: HTMLElement): void {
    const h = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (this.popups.some((p) => p.contains(t)) || anchor.contains(t)) return;
      this.closeAll();
      document.removeEventListener("mousedown", h);
    };
    window.setTimeout(() => document.addEventListener("mousedown", h), 0);
  }

  // -- add-property menu --------------------------------------------------

  /** Candidates grouped for the add menu. */
  private addCandidates(): { onNote: { key: string }[]; onSidebar: { key: string }[]; others: { key: string }[] } {
    const view = this.view;
    const shown = new Set<string>();
    for (const sec of view.layout.sections)
      for (const e of sec.entries) if (e.kind === "prop" && e.key) shown.add(e.key.toLowerCase());
    const all = new Set<string>([
      ...Object.keys(view.note.raw).filter((k) => k.toLowerCase() !== "position"),
      ...view.props.knownProps(),
    ]);
    const onNote: { key: string }[] = [], onSidebar: { key: string }[] = [], others: { key: string }[] = [];
    for (const k of all) {
      if (view.note.raw[k] !== undefined) onNote.push({ key: k });
      else if (shown.has(k.toLowerCase())) onSidebar.push({ key: k });
      else others.push({ key: k });
    }
    const srt = (a: { key: string }[]) => a.sort((x, y) => x.key.localeCompare(y.key));
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
    const pop = document.body.createDiv({ cls: "ep-popup ep-addmenu" });
    this.popups.push(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = r.left + "px";
    pop.style.top = r.bottom + 2 + "px";
    pop.style.minWidth = "220px";

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
      const grp = (title: string, arr: { key: string }[]) => {
        const f = arr.filter((c) => !q || c.key.toLowerCase().includes(q));
        if (!f.length) return;
        listEl.createDiv({ cls: "ep-pop-group", text: title });
        for (const c of f.slice(0, 60)) addRow(c);
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

    search.oninput = () => render();
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
    window.setTimeout(() => search.focus(), 0);
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
    const side = document.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    const r = row.getBoundingClientRect();
    side.style.left = r.right + 2 + "px";
    side.style.top = r.top + "px";
    side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: multi ? t("add.pickValues", { key }) : key });

    const body = side.createDiv({ cls: "ep-side-body" });
    const sel = new Set<string>();
    const vals = view.props.valuesFor(key);
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = multi ? t("add.customValue") : t("add.typeValue");
    let addBtn: HTMLButtonElement | null = null;
    const updateCount = () => {
      if (addBtn) addBtn.setText(t("add.addN", { n: sel.size + (custom.value.trim() ? 1 : 0) }));
    };
    const commit = (single?: string) => {
      if (multi) {
        const arr = [...sel];
        if (custom.value.trim()) arr.push(custom.value.trim());
        this.addEntryWithValue(file, section, key, arr, target);
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
      if (multi) {
        const cb = it.createEl("input");
        cb.type = "checkbox";
        it.createSpan({ text: v });
        it.onclick = (e) => {
          if ((e.target as HTMLElement) !== cb) cb.checked = !cb.checked;
          if (cb.checked) sel.add(v);
          else sel.delete(v);
          updateCount();
        };
      } else {
        it.createSpan({ text: v });
        it.onclick = () => commit(v);
      }
    }
    if (!vals.length) body.createDiv({ cls: "ep-empty-sub", text: t("add.noValues") });
    custom.oninput = () => updateCount();
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        commit();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    if (multi) {
      addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addN", { n: 0 }) });
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
    const w = document.body.createDiv({ cls: "ep-popup ep-noteswin" });
    this.popups.push(w);
    this.notesWin = w;
    const r = anchor.getBoundingClientRect();
    w.style.left = r.right + 4 + "px";
    w.style.top = r.top + "px";
    w.style.minWidth = "160px";
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
    const side = document.body.createDiv({ cls: "ep-popup ep-side" });
    this.popups.push(side);
    side.style.left = left + "px";
    side.style.top = top + "px";
    side.style.minWidth = "170px";
    side.createDiv({ cls: "ep-side-title", text: t("list.addTo", { key }) });
    const body = side.createDiv({ cls: "ep-side-body" });
    const sel = new Set<string>();
    const opts = view.props.valuesFor(key).filter((o) => !cur.some((c) => c.toLowerCase() === o.toLowerCase()));
    const custom = side.createEl("input", { cls: "ep-edit-input ep-side-custom" });
    custom.type = "text";
    custom.placeholder = t("add.customValue");
    let addBtn: HTMLButtonElement;
    const updateCount = () => addBtn.setText(t("add.addN", { n: sel.size + (custom.value.trim() ? 1 : 0) }));
    for (const v of opts) {
      const it = body.createDiv({ cls: "ep-pop-row" });
      const cb = it.createEl("input");
      cb.type = "checkbox";
      it.createSpan({ text: v });
      it.onclick = (e) => {
        if ((e.target as HTMLElement) !== cb) cb.checked = !cb.checked;
        if (cb.checked) sel.add(v);
        else sel.delete(v);
        updateCount();
      };
    }
    if (!opts.length) body.createDiv({ cls: "ep-empty-sub", text: t("list.noMoreValues") });
    custom.oninput = () => updateCount();
    custom.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addBtn.click();
      }
    };
    const foot = side.createDiv({ cls: "ep-side-foot" });
    addBtn = foot.createEl("button", { cls: "mod-cta", text: t("add.addN", { n: 0 }) });
    addBtn.onclick = () => {
      const add = [...sel];
      if (custom.value.trim()) add.push(custom.value.trim());
      if (add.length) view.note.set(file, key, [...cur, ...add]);
      this.closeAll();
    };
    this.fitToViewport(side, left, left);
    this.dismissOnOutsideClick(side);
  }
}
