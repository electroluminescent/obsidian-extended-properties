/**
 * Type table view (roadmap B3).
 *
 * A workspace view listing every note of a chosen type as rows, with chosen
 * frontmatter properties as columns. Sortable (click a header), filterable
 * (text box), columns are pick-and-choose (a menu) and persisted per type in
 * `settings.tableLayouts`. Clicking a row opens the note; double-clicking a
 * cell edits that property in place (written via `processFrontMatter`).
 *
 * Data comes straight from the metadata cache — this is a projection over the
 * vault, not a new data store. Cells render a compact text value; the full
 * value-type cell renderers and in-cell roll buttons are a later B3 step.
 */

import { ItemView, Menu, TFile, WorkspaceLeaf } from "obsidian";
import type ExtendedPropertiesPlugin from "../main";
import type { TableLayout } from "../core/model";
import { getCI, parseNumeric } from "../utils/misc";

export const VIEW_TYPE_TABLE = "extended-properties-table";

interface Row {
  file: TFile;
  fm: Record<string, unknown>;
}

/** Compact text projection of a frontmatter value for a cell. */
function fmtCell(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return String(v);
}

export class TableView extends ItemView {
  private typeKey = "";
  private filter = "";

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

  /** Re-render on external metadata / workspace changes. */
  refresh(): void {
    this.render();
  }

  private get body(): HTMLElement {
    return this.containerEl.children[1] as HTMLElement;
  }

  // -- data ------------------------------------------------------------------

  /** All notes whose `Type` includes `typeKey`, with their frontmatter. */
  private rows(typeKey: string): Row[] {
    const want = typeKey.trim().toLowerCase();
    if (!want) return [];
    const out: Row[] = [];
    for (const f of this.app.vault.getMarkdownFiles()) {
      const fm = this.app.metadataCache.getFileCache(f)?.frontmatter as Record<string, unknown> | undefined;
      if (!fm) continue;
      const tv = getCI(fm, "Type");
      const types = Array.isArray(tv)
        ? tv.map((x) => String(x).toLowerCase())
        : tv === undefined || tv === null
          ? []
          : [String(tv).toLowerCase()];
      if (types.includes(want)) out.push({ file: f, fm });
    }
    return out;
  }

  /** The stored table layout for a type, created on first use. */
  private layoutFor(typeKey: string): TableLayout {
    const s = this.plugin.settings;
    if (!s.tableLayouts) s.tableLayouts = {};
    const k = typeKey.toLowerCase();
    if (!s.tableLayouts[k]) s.tableLayouts[k] = { columns: this.defaultColumns(typeKey) };
    return s.tableLayouts[k];
  }

  /** Default columns: the type's sidebar property keys, else its commonest keys. */
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

  // -- render ----------------------------------------------------------------

  private render(): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const s = this.plugin.settings;
    const c = this.body;
    c.empty();
    c.addClass("ep-table-view");

    if (!s.types.length) {
      c.createDiv({ cls: "ep-empty", text: t("table.noTypes") });
      return;
    }
    if (!this.typeKey || !s.types.some((tp) => tp.toLowerCase() === this.typeKey.toLowerCase()))
      this.typeKey = s.types[0];

    // -- toolbar -------------------------------------------------------------
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
    scroll.empty();
    const layout = this.layoutFor(this.typeKey);
    const cols = layout.columns;

    let data = this.rows(this.typeKey);
    const q = this.filter.trim().toLowerCase();
    if (q)
      data = data.filter(
        (r) =>
          r.file.basename.toLowerCase().includes(q) ||
          cols.some((k) => fmtCell(getCI(r.fm, k)).toLowerCase().includes(q))
      );

    const sort = layout.sort;
    data.sort((a, b) => {
      if (!sort || !sort.key) return a.file.basename.localeCompare(b.file.basename);
      const av = getCI(a.fm, sort.key);
      const bv = getCI(b.fm, sort.key);
      const an = parseNumeric(av);
      const bn = parseNumeric(bv);
      const cmp = an !== null && bn !== null ? an - bn : fmtCell(av).localeCompare(fmtCell(bv));
      return sort.dir === "desc" ? -cmp : cmp;
    });

    count.setText(t("table.count", { n: String(data.length) }));

    const MAX = 500;
    const table = scroll.createEl("table", { cls: "ep-table" });
    const htr = table.createEl("thead").createEl("tr");
    this.headerCell(htr, "", t("table.name"), layout);
    for (const k of cols) this.headerCell(htr, k, k, layout);

    const tbody = table.createEl("tbody");
    for (const r of data.slice(0, MAX)) {
      const tr = tbody.createEl("tr");
      const nameTd = tr.createEl("td", { cls: "ep-table-name" });
      const a = nameTd.createEl("a", { text: r.file.basename, cls: "ep-table-link" });
      a.onclick = (e) => {
        e.preventDefault();
        void this.app.workspace.getLeaf(false).openFile(r.file);
      };
      for (const k of cols) {
        const td = tr.createEl("td", { cls: "ep-table-cell", text: fmtCell(getCI(r.fm, k)) });
        this.bindCellEdit(td, r.file, k);
      }
    }
    if (data.length > MAX)
      scroll.createDiv({ cls: "ep-table-more", text: t("table.truncated", { shown: String(MAX), total: String(data.length) }) });
  }

  private headerCell(tr: HTMLElement, key: string, label: string, layout: TableLayout): void {
    const th = tr.createEl("th", { cls: "ep-table-col ep-sortable", text: label });
    const sort = layout.sort;
    if ((sort?.key ?? "") === key && (sort || key === ""))
      th.addClass(sort?.dir === "desc" ? "ep-sort-desc" : "ep-sort-asc");
    th.onclick = () => {
      const cur = layout.sort;
      // asc → desc → none (default name order)
      if (cur && (cur.key ?? "") === key) layout.sort = cur.dir === "asc" ? { key, dir: "desc" } : undefined;
      else layout.sort = { key, dir: "asc" };
      void this.plugin.saveSettings();
      this.render();
    };
    if (key)
      th.oncontextmenu = (e) => {
        e.preventDefault();
        const m = new Menu();
        m.addItem((i) =>
          i.setTitle(this.plugin.i18n.t("table.removeColumn")).setIcon("x").onClick(() => {
            layout.columns = layout.columns.filter((c) => c !== key);
            void this.plugin.saveSettings();
            this.render();
          })
        );
        m.showAtMouseEvent(e as MouseEvent);
      };
  }

  private bindCellEdit(td: HTMLElement, file: TFile, key: string): void {
    td.ondblclick = () => {
      const cur = fmtCell(getCI((this.app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown>) ?? {}, key));
      const input = createEl("input", { cls: "ep-table-edit" });
      input.type = "text";
      input.value = cur;
      td.empty();
      td.appendChild(input);
      input.focus();
      input.select();
      let done = false;
      const finish = (save: boolean) => {
        if (done) return;
        done = true;
        if (save && input.value !== cur) void this.writeCell(file, key, input.value);
        else td.setText(cur);
      };
      input.onblur = () => finish(true);
      input.onkeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          input.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          done = true;
          td.setText(cur);
        }
      };
    };
  }

  private async writeCell(file: TFile, key: string, value: string): Promise<void> {
    const v = value.trim();
    await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
      if (v === "") {
        delete fm[key];
        return;
      }
      const n = Number(v);
      // Only store a number when the text round-trips exactly (keeps "007", "1.0", phone numbers as text).
      fm[key] = Number.isFinite(n) && String(n) === v ? n : value;
    });
    this.render();
  }

  private openColumnsMenu(e: MouseEvent): void {
    const layout = this.layoutFor(this.typeKey);
    const candidates = new Set<string>(layout.columns);
    for (const r of this.rows(this.typeKey))
      for (const k of Object.keys(r.fm)) {
        const lk = k.toLowerCase();
        if (lk !== "type" && lk !== "position") candidates.add(k);
      }
    const m = new Menu();
    for (const k of [...candidates].sort((a, b) => a.localeCompare(b))) {
      m.addItem((i) =>
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
    m.showAtMouseEvent(e);
  }
}
