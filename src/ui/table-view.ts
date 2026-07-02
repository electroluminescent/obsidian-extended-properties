/**
 * Type table view (roadmap B3).
 *
 * A workspace view listing every note of a chosen type as rows, with chosen
 * frontmatter properties as columns. Sortable headers, a text filter, a column
 * pick-list and drag-to-resize columns — all persisted per type in
 * `settings.tableLayouts`. Rows click through to the note; cells render a
 * compact, type-aware widget (checkbox, rating, colour swatch, link, image,
 * number, list chips) and edit in place on double-click; rollable columns get a
 * die button that rolls via the plugin roll service. Rows virtualize so a type
 * with thousands of notes stays responsive.
 *
 * Data is a projection over the metadata cache, not a new store: rows are read
 * through the plugin-wide {@link PropertyIndex} snapshot cache (never a fresh
 * vault scan), refreshes are skipped for files that are not — and were not —
 * rows of the shown type, and cell edits write through the plugin's shared
 * {@link NoteFacade} so they get the same batching, conflict guard and
 * three-way merge as the sidebar and inline chips.
 */

import { ItemView, Menu, Notice, setIcon, TFile, WorkspaceLeaf } from "obsidian";
import type ExtendedPropertiesPlugin from "../main";
import type { Entry, TableLayout } from "../core/model";
import { getCI, parseNumeric } from "../utils/misc";
import { parseDiceOrDefault } from "../utils/dice";
import { TextLinkSuggest } from "./components/suggest";

export const VIEW_TYPE_TABLE = "extended-properties-table";

/** Value types rendered right-aligned and eligible for a roll button. */
const NUMERIC = new Set(["number", "decimal", "unit", "formula", "derived"]);
/** Below this row count we render every row; above it we virtualize. */
const VIRT_THRESHOLD = 150;
/** Assumed row height (px) for virtualization spacers. */
const ROW_H = 29;

interface Row {
  file: TFile;
  fm: Record<string, unknown>;
}

interface ColMeta {
  key: string;
  /** Resolved value-type id. */
  type: string;
  rollable: boolean;
  dice?: string;
  max?: number;
}

/** Compact text projection of a frontmatter value. */
function fmtCell(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return String(v);
}

/** Bare link target of `[[Target|alias]]` / `[[Target#h]]`, else the string itself. */
function linkTarget(raw: string): string {
  const m = /\[\[([^\]|#]+)/.exec(raw);
  return (m ? m[1] : raw).trim();
}

export class TableView extends ItemView {
  private typeKey = "";
  private filter = "";
  /** Paths rendered as rows of the current type (refresh scoping). */
  private shownPaths = new Set<string>();
  /** Active virtualization scroll listener, cleaned up between renders. */
  private scrollEl: HTMLElement | null = null;
  private scrollFn: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf, private plugin: ExtendedPropertiesPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_TABLE;
  }
  getDisplayText(): string {
    return this.plugin.i18n.t("table.title");
  }
  getIcon(): string {
    return "table";
  }

  async onOpen(): Promise<void> {
    const s = this.plugin.settings;
    const remembered =
      s.tableLastType && s.types.some((tp) => tp.toLowerCase() === s.tableLastType!.toLowerCase())
        ? s.tableLastType
        : s.types[0] ?? "";
    this.typeKey = remembered ?? "";
    this.render();
  }

  /**
   * Re-render on external metadata / workspace changes. When the changed file
   * is known, skip the rebuild unless that file is a row of the shown type —
   * or was one before the change (so losing the type removes the row).
   */
  refresh(file?: TFile): void {
    if (file && !this.shownPaths.has(file.path)) {
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
      const tv = fm ? getCI(fm, "Type") : undefined;
      const types = Array.isArray(tv)
        ? tv.map((x) => String(x).toLowerCase())
        : tv === undefined || tv === null
          ? []
          : [String(tv).toLowerCase()];
      if (!types.includes(this.typeKey.trim().toLowerCase())) return;
    }
    this.render();
  }

  private get body(): HTMLElement {
    return this.containerEl.children[1] as HTMLElement;
  }

  // -- data ------------------------------------------------------------------

  private rows(typeKey: string): Row[] {
    // Served from the PropertyIndex snapshot cache — a render (or a filter
    // keystroke) never re-scans every markdown file in the vault.
    return this.plugin.props.rowsByType(typeKey);
  }

  private layoutFor(typeKey: string): TableLayout {
    const s = this.plugin.settings;
    if (!s.tableLayouts) s.tableLayouts = {};
    const k = typeKey.toLowerCase();
    if (!s.tableLayouts[k]) s.tableLayouts[k] = { columns: this.defaultColumns(typeKey) };
    return s.tableLayouts[k];
  }

  private defaultColumns(typeKey: string): string[] {
    const layout = this.plugin.settings.layouts[typeKey.toLowerCase()];
    const keys: string[] = [];
    if (layout)
      for (const sec of layout.sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && !keys.includes(e.key)) keys.push(e.key);
    if (keys.length) return keys.slice(0, 6);
    const freq = new Map<string, number>();
    for (const r of this.rows(typeKey))
      for (const k of Object.keys(r.fm)) {
        const lk = k.toLowerCase();
        if (lk === "type" || lk === "position") continue;
        freq.set(k, (freq.get(k) ?? 0) + 1);
      }
    return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
  }

  /** Resolve type / rollability / dice / rating-max for each column. */
  private colMetas(cols: string[], rows: Row[]): ColMeta[] {
    const layout = this.plugin.settings.layouts[this.typeKey.toLowerCase()];
    const rolling = this.plugin.settings.features["rolling"] !== false;
    const findEntry = (key: string): Entry | undefined => {
      if (!layout) return undefined;
      for (const sec of layout.sections)
        for (const e of sec.entries)
          if (e.kind === "prop" && e.key && e.key.toLowerCase() === key.toLowerCase()) return e;
      return undefined;
    };
    return cols.map((key) => {
      const entry = findEntry(key);
      let type = entry?.dataType || this.plugin.props.obsidianType(key) || "";
      if (!type) {
        for (const r of rows) {
          const v = getCI(r.fm, key);
          if (v === undefined || v === null) continue;
          type = typeof v === "boolean" ? "checkbox" : typeof v === "number" ? "number" : Array.isArray(v) ? "list" : "text";
          break;
        }
        if (!type) type = "text";
      }
      const roll = entry ? (entry as Record<string, unknown>)["roll"] : undefined;
      const rollable = rolling && !!roll && (NUMERIC.has(type) || type === "rating");
      const dice = entry ? ((entry as Record<string, unknown>)["dice"] as string | undefined) : undefined;
      return { key, type, rollable, dice, max: entry?.max };
    });
  }

  // -- render ----------------------------------------------------------------

  private render(): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const s = this.plugin.settings;
    const c = this.body;
    this.detachScroll();
    c.empty();
    c.addClass("ep-table-view");

    if (!s.types.length) {
      c.createDiv({ cls: "ep-empty", text: t("table.noTypes") });
      return;
    }
    if (!this.typeKey || !s.types.some((tp) => tp.toLowerCase() === this.typeKey.toLowerCase()))
      this.typeKey = s.types[0];

    const bar = c.createDiv({ cls: "ep-table-bar" });
    const sel = bar.createEl("select", { cls: "dropdown ep-table-type" });
    for (const tp of s.types) {
      const o = sel.createEl("option", { text: tp });
      o.value = tp;
      if (tp.toLowerCase() === this.typeKey.toLowerCase()) o.selected = true;
    }
    sel.onchange = () => {
      this.typeKey = sel.value;
      s.tableLastType = sel.value;
      void this.plugin.saveSettings();
      this.render();
    };

    const colBtn = bar.createEl("button", { cls: "ep-table-btn", text: t("table.columns") });
    colBtn.onclick = (e) => this.openColumnsMenu(e as MouseEvent);

    const filt = bar.createEl("input", { cls: "ep-table-filter" });
    filt.type = "search";
    filt.placeholder = t("table.filter");
    filt.value = this.filter;

    const count = bar.createSpan({ cls: "ep-table-count" });
    const scroll = c.createDiv({ cls: "ep-table-scroll" });
    filt.oninput = () => {
      this.filter = filt.value;
      this.renderTable(scroll, count);
    };
    this.renderTable(scroll, count);
  }

  private renderTable(scroll: HTMLElement, count: HTMLElement): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    this.detachScroll();
    scroll.empty();
    const layout = this.layoutFor(this.typeKey);
    const cols = layout.columns;
    const rows = this.rows(this.typeKey);
    this.shownPaths = new Set(rows.map((r) => r.file.path));
    const metas = this.colMetas(cols, rows);

    let data = rows;
    const q = this.filter.trim().toLowerCase();
    if (q)
      data = data.filter(
        (r) =>
          r.file.basename.toLowerCase().includes(q) ||
          cols.some((k) => fmtCell(getCI(r.fm, k)).toLowerCase().includes(q))
      );

    const sort = layout.sort;
    data = data.slice().sort((a, b) => {
      if (!sort || !sort.key) return a.file.basename.localeCompare(b.file.basename);
      const av = getCI(a.fm, sort.key);
      const bv = getCI(b.fm, sort.key);
      const an = parseNumeric(av);
      const bn = parseNumeric(bv);
      const cmp = an !== null && bn !== null ? an - bn : fmtCell(av).localeCompare(fmtCell(bv));
      return sort.dir === "desc" ? -cmp : cmp;
    });

    count.setText(t("table.count", { n: String(data.length) }));

    const table = scroll.createEl("table", { cls: "ep-table" });
    const htr = table.createEl("thead").createEl("tr");
    this.headerCell(htr, "", t("table.name"), layout, null);
    metas.forEach((m) => this.headerCell(htr, m.key, m.key, layout, m));

    const tbody = table.createEl("tbody");
    if (data.length <= VIRT_THRESHOLD) {
      for (const r of data) this.renderRow(tbody, r, metas);
      return;
    }

    // -- virtualization: render only the visible window + spacers -----------
    const colspan = metas.length + 1;
    const renderWindow = (): void => {
      const top = scroll.scrollTop;
      const vh = scroll.clientHeight || 400;
      const start = Math.max(0, Math.floor(top / ROW_H) - 6);
      const end = Math.min(data.length, start + Math.ceil(vh / ROW_H) + 12);
      tbody.empty();
      if (start > 0) this.spacer(tbody, colspan, start * ROW_H);
      for (let i = start; i < end; i++) this.renderRow(tbody, data[i], metas);
      if (end < data.length) this.spacer(tbody, colspan, (data.length - end) * ROW_H);
    };
    this.scrollEl = scroll;
    this.scrollFn = renderWindow;
    scroll.addEventListener("scroll", renderWindow);
    renderWindow();
  }

  private spacer(tbody: HTMLElement, colspan: number, h: number): void {
    const tr = tbody.createEl("tr", { cls: "ep-table-spacer" });
    const td = tr.createEl("td", { attr: { colspan: String(colspan) } });
    td.style.height = h + "px";
    td.style.padding = "0";
  }

  private detachScroll(): void {
    if (this.scrollEl && this.scrollFn) this.scrollEl.removeEventListener("scroll", this.scrollFn);
    this.scrollEl = null;
    this.scrollFn = null;
  }

  private renderRow(tbody: HTMLElement, r: Row, metas: ColMeta[]): void {
    const tr = tbody.createEl("tr");
    const nameTd = tr.createEl("td", { cls: "ep-table-name" });
    const a = nameTd.createEl("a", { text: r.file.basename, cls: "ep-table-link" });
    a.onclick = (e) => {
      e.preventDefault();
      void this.app.workspace.getLeaf(false).openFile(r.file);
    };
    for (const m of metas) {
      const td = tr.createEl("td", { cls: "ep-table-cell" });
      this.renderValue(td, r.file, r.fm, m);
    }
  }

  // -- cell rendering --------------------------------------------------------

  private renderValue(td: HTMLElement, file: TFile, fm: Record<string, unknown>, m: ColMeta): void {
    const raw = getCI(fm, m.key);
    const type = m.type;

    if (type === "checkbox") {
      const cb = td.createEl("input");
      cb.type = "checkbox";
      cb.checked = raw === true || raw === "true";
      cb.onclick = (e) => {
        e.stopPropagation();
        this.plugin.facade.set(file, m.key, cb.checked);
      };
      return;
    }
    if (type === "rating") {
      const n = Math.max(0, Math.round(parseNumeric(raw) ?? 0));
      const max = m.max && m.max > 0 ? m.max : 5;
      const wrap = td.createSpan({ cls: "ep-cell-rating" });
      for (let i = 1; i <= max; i++) wrap.createSpan({ text: i <= n ? "★" : "☆" });
      this.maybeRoll(td, file, m, raw);
      return;
    }
    if (type === "color") {
      const s = fmtCell(raw);
      if (s) {
        const sw = td.createSpan({ cls: "ep-cell-swatch" });
        sw.style.background = s;
      }
      td.createSpan({ cls: "ep-cell-muted", text: s });
      return;
    }
    if (type === "link") {
      const s = fmtCell(raw);
      const target = linkTarget(s);
      const a = td.createEl("a", { cls: "ep-table-link", text: target || s });
      a.onclick = (e) => {
        e.preventDefault();
        if (target) void this.app.workspace.openLinkText(target, file.path, false);
      };
      return;
    }
    if (type === "image") {
      const url = this.resolveImage(fmtCell(raw), file);
      if (url) {
        const img = td.createEl("img", { cls: "ep-cell-img" });
        img.src = url;
      }
      return;
    }
    if (type === "list" || Array.isArray(raw)) {
      const arr = Array.isArray(raw) ? raw : raw === undefined || raw === null || raw === "" ? [] : [raw];
      for (const x of arr) td.createSpan({ cls: "ep-cell-chip", text: String(x) });
      return;
    }
    if (NUMERIC.has(type)) {
      td.addClass("ep-cell-num");
      td.createSpan({ text: fmtCell(raw) });
      this.maybeRoll(td, file, m, raw);
      this.bindCellEdit(td, file, m.key);
      return;
    }
    // text / datetime / default
    td.createSpan({ text: fmtCell(raw) });
    this.bindCellEdit(td, file, m.key);
  }

  private maybeRoll(td: HTMLElement, file: TFile, m: ColMeta, raw: unknown): void {
    if (!m.rollable) return;
    const btn = td.createEl("button", { cls: "ep-table-roll" });
    setIcon(btn, "dices");
    btn.setAttr("title", this.plugin.i18n.t("table.roll"));
    btn.setAttr("aria-label", this.plugin.i18n.t("table.roll"));
    btn.onclick = (e) => {
      e.stopPropagation();
      try {
        const mod = parseNumeric(raw) ?? 0;
        this.plugin.rollService().roll(`${file.basename} · ${m.key}`, mod, parseDiceOrDefault(m.dice));
      } catch {
        new Notice(this.plugin.i18n.t("table.rollFailed"));
      }
    };
  }

  private bindCellEdit(td: HTMLElement, file: TFile, key: string): void {
    td.addClass("ep-editable-cell");
    td.ondblclick = () => {
      const fm = (this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {};
      const cur = fmtCell(getCI(fm, key));
      const input = createEl("input", { cls: "ep-table-edit" });
      input.type = "text";
      input.value = cur;
      td.empty();
      td.appendChild(input);
      input.focus();
      input.select();
      new TextLinkSuggest(this.app, input); // [[ note autocomplete
      let done = false;
      const finish = (save: boolean) => {
        if (done) return;
        done = true;
        if (save && input.value !== cur) {
          this.writeCellText(file, key, input.value);
          // Optimistic: show the typed text now; the queued write's metadata
          // event re-renders the row with full type-aware formatting.
          td.empty();
          td.createSpan({ text: input.value.trim() });
        } else this.render();
      };
      // Delay so a suggestion click can land before the blur commits.
      input.onblur = () => setTimeout(() => finish(true), 150);
      input.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          finish(false);
        }
      };
    };
  }

  /**
   * Write a cell edit through the plugin's shared {@link NoteFacade} — the
   * same batched, conflict-guarded, merge-aware path the sidebar and inline
   * chips use — never a raw `processFrontMatter`. Empty clears the key;
   * numeric-looking text is stored as a number.
   */
  private writeCellText(file: TFile, key: string, value: string): void {
    const v = value.trim();
    if (v === "") {
      this.plugin.facade.set(file, key, undefined);
      return;
    }
    const n = Number(v);
    this.plugin.facade.set(file, key, Number.isFinite(n) && String(n) === v ? n : value);
  }

  /** Resolve an image property value to a displayable URL (best effort). */
  private resolveImage(src: string, file: TFile): string {
    src = (src || "").trim();
    if (!src) return "";
    const m = src.match(/!?\[\[(.*?)\]\]/);
    const path = m ? m[1].split("|")[0].split("#")[0].trim() : src;
    if (/^(https?:|data:|app:|file:)/.test(path)) return path;
    const dest = this.app.metadataCache.getFirstLinkpathDest(path, file.path);
    if (dest) return this.app.vault.getResourcePath(dest);
    const af = this.app.vault.getAbstractFileByPath(path);
    return af instanceof TFile ? this.app.vault.getResourcePath(af) : "";
  }

  // -- header (sort + resize) ------------------------------------------------

  private headerCell(tr: HTMLElement, key: string, label: string, layout: TableLayout, meta: ColMeta | null): void {
    const th = tr.createEl("th", { cls: "ep-table-col ep-sortable" });
    th.createSpan({ cls: "ep-th-label", text: label });
    if (meta) {
      const w = layout.widths?.[key];
      if (w && w > 0) {
        th.style.width = w + "px";
        th.style.minWidth = w + "px";
      }
    } else {
      th.addClass("ep-table-namecol");
    }
    const sort = layout.sort;
    if ((sort?.key ?? "") === key && (sort || key === ""))
      th.addClass(sort?.dir === "desc" ? "ep-sort-desc" : "ep-sort-asc");
    th.onclick = () => {
      const cur = layout.sort;
      if (cur && (cur.key ?? "") === key) layout.sort = cur.dir === "asc" ? { key, dir: "desc" } : undefined;
      else layout.sort = { key, dir: "asc" };
      void this.plugin.saveSettings();
      this.render();
    };
    if (key)
      th.oncontextmenu = (e) => {
        e.preventDefault();
        const menu = new Menu();
        menu.addItem((i) =>
          i.setTitle(this.plugin.i18n.t("table.removeColumn")).setIcon("x").onClick(() => {
            layout.columns = layout.columns.filter((c) => c !== key);
            void this.plugin.saveSettings();
            this.render();
          })
        );
        menu.showAtMouseEvent(e as MouseEvent);
      };
    if (meta) this.attachResize(th, key, layout);
  }

  private attachResize(th: HTMLElement, key: string, layout: TableLayout): void {
    const grip = th.createSpan({ cls: "ep-col-resize" });
    grip.onclick = (e) => e.stopPropagation();
    grip.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = th.offsetWidth;
      grip.setPointerCapture(e.pointerId);
      const move = (ev: PointerEvent) => {
        const w = Math.max(48, startW + (ev.clientX - startX));
        th.style.width = w + "px";
        th.style.minWidth = w + "px";
      };
      const up = (ev: PointerEvent) => {
        grip.releasePointerCapture(e.pointerId);
        grip.removeEventListener("pointermove", move);
        grip.removeEventListener("pointerup", up);
        if (!layout.widths) layout.widths = {};
        layout.widths[key] = Math.max(48, startW + (ev.clientX - startX));
        void this.plugin.saveSettings();
      };
      grip.addEventListener("pointermove", move);
      grip.addEventListener("pointerup", up);
    };
  }

  private openColumnsMenu(e: MouseEvent): void {
    const layout = this.layoutFor(this.typeKey);
    const candidates = new Set<string>(layout.columns);
    for (const r of this.rows(this.typeKey))
      for (const k of Object.keys(r.fm)) {
        const lk = k.toLowerCase();
        if (lk !== "type" && lk !== "position") candidates.add(k);
      }
    const menu = new Menu();
    for (const k of [...candidates].sort((a, b) => a.localeCompare(b))) {
      menu.addItem((i) =>
        i
          .setTitle(k)
          .setChecked(layout.columns.includes(k))
          .onClick(() => {
            layout.columns = layout.columns.includes(k)
              ? layout.columns.filter((c) => c !== k)
              : [...layout.columns, k];
            void this.plugin.saveSettings();
            this.render();
          })
      );
    }
    menu.showAtMouseEvent(e);
  }

  async onClose(): Promise<void> {
    this.detachScroll();
  }
}
