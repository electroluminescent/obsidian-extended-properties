/**
 * Renders one section: title bar (chevron, grip, icon, editable title,
 * layout/pin buttons, options), the collapsible body, and the entry grid in
 * one of three layout modes (list / columns / grid).
 *
 * Also computes the section-wide {@link ClusterFlags} so numeric values of
 * all rows align (each entry kind/value type reports what cluster columns it
 * needs).
 */

import { Menu, setIcon } from "obsidian";
import type { TFile } from "obsidian";
import type { ClusterFlags, ViewCtx } from "../../core/context";
import { Section, sectionMode, sectionPin } from "../../core/model";
import * as ops from "../../core/layout-ops";
import { emptyFlags, mergeNeeds } from "./cluster";
import { renderEntry, isHiddenEntry } from "./entry-renderer";
import { openSectionMenu } from "../menus/section-menu";
import { bindRename } from "../components/inline-edit";
import type { DragController } from "../drag";
import type { LayoutMode, SectionPin } from "../../core/model";

/** Row-height presets → max rows shown before the section scrolls. */
const SIZE_ROWS: Record<string, number> = { s: 4, m: 8, l: 12 };
const ROW_PX = 32;

/** Union of cluster needs over all entries of the section. */
function computeFlags(view: ViewCtx, file: TFile, section: Section): ClusterFlags {
  const flags = emptyFlags();
  for (const entry of section.entries) {
    const kind = view.registries.entryKinds.get(entry.kind);
    mergeNeeds(flags, kind?.clusterNeeds?.({ view, file, section, entry }));
  }
  return flags;
}

/**
 * Equalize cluster columns across all rows of a section: each slot
 * (denotation, toggle boxes, modifier badge, …) and the value cell get the
 * width of their widest sibling, so influence strings, checkboxes and
 * numbers line up vertically even though every row owns its own grid.
 */
export function alignClustersNow(det: HTMLElement): void {
  const groups = new Map<string, HTMLElement[]>();
  for (const el of det.findAll(".ep-cluster [data-ep-slot]")) {
    const id = el.getAttribute("data-ep-slot") ?? "";
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id)!.push(el as HTMLElement);
  }
  groups.set(" num", det.findAll(".ep-cluster .ep-num") as HTMLElement[]);
  for (const els of groups.values()) {
    if (els.length < 2) continue;
    let max = 0;
    for (const el of els) {
      el.style.minWidth = "";
      max = Math.max(max, el.offsetWidth);
    }
    if (max <= 0) continue;
    for (const el of els) el.style.minWidth = max + "px";
  }
}

function alignClusters(det: HTMLElement): void {
  requestAnimationFrame(() => alignClustersNow(det));
}

export interface SectionHost {
  /** Map of section id → rendered element (for TOC scrolling). */
  registerSectionEl(id: string, el: HTMLElement): void;
  /** Re-measure the sticky zone after collapse animations. */
  reflowSticky(): void;
}

export function renderSection(
  parent: HTMLElement,
  view: ViewCtx,
  file: TFile,
  section: Section,
  drag: DragController,
  host: SectionHost
): void {
  const t = view.i18n.t.bind(view.i18n);

  // Conditional visibility for the whole section (hidden outside edit mode).
  if (!view.editMode && section.showWhen && !view.condVisible(section.showWhen)) return;

  // Outside edit mode a section with no visible entries can hide entirely.
  if (!view.editMode && section.hideIfEmpty !== false) {
    const hasContent = section.entries.some((e) => !isHiddenEntry(view, e));
    if (!hasContent) return;
  }

  const det = parent.createDiv({ cls: "ep-section" });
  host.registerSectionEl(section.id, det);
  if (view.editMode && section.showWhen && !view.condVisible(section.showWhen)) det.addClass("ep-cond-off");
  det.setAttr("data-ep-id", "s:" + section.id);
  if (sectionPin(section) === "body") det.addClass("ep-flow-section");
  if (section.transparent) det.addClass("ep-transparent");
  if (section.accent) det.style.setProperty("--ep-accent", section.accent);
  if (section.controlColor) det.style.setProperty("--ep-control", section.controlColor);
  det.style.setProperty(
    "--ep-title-bg",
    section.transparent ? "var(--background-primary)" : section.bg || "var(--background-secondary)"
  );
  if (section.bg && !section.transparent) det.style.background = section.bg;

  // -- title bar -------------------------------------------------------
  const collapsible = section.collapsible !== false;
  const sum = det.createDiv({ cls: "ep-section-title" });
  if (collapsible) {
    const chev = sum.createSpan({ cls: "ep-chev" });
    setIcon(chev, "chevron-right");
    chev.toggleClass("ep-open", !section.collapsed);
  }
  if (view.editMode) {
    const grip = sum.createSpan({ cls: "ep-grip", text: "⠿" });
    grip.setAttr("title", t("section.dragHint"));
    grip.onclick = (e) => e.stopPropagation();
  }
  if (section.icon) {
    const ic = sum.createSpan({ cls: "ep-ticon" });
    setIcon(ic, section.icon);
    if (section.iconColor) ic.style.color = section.iconColor;
  }
  const showLabel = view.editMode || !section.hideLabel;
  if (showLabel) {
    const titleSpan = sum.createSpan({ cls: "ep-sec-name" });
    if (section.titleSize) titleSpan.style.fontSize = section.titleSize + "px";
    if (section.accent) titleSpan.style.color = section.accent;
    if (view.editMode) {
      bindRename(titleSpan, section.title, t("section.namePlaceholder"), t("section.renameHint"), (v) => {
        section.title = v || t("section.namePlaceholder");
        view.saveLayout();
        view.rerender();
      });
      if (section.hideLabel) titleSpan.addClass("ep-dim");
    } else {
      titleSpan.setText(section.title);
    }
  }
  sum.createSpan({ cls: "ep-spacer" });

  if (view.editMode) {
    // Layout mode cycler.
    const cmode = sectionMode(section);
    const modeBtn = sum.createSpan({ cls: "ep-icon-btn" });
    setIcon(modeBtn, cmode === "grid" ? "layout-grid" : cmode === "columns" ? "columns" : "list");
    modeBtn.setAttr("title", t("section.layoutHint", { mode: t("layout." + cmode) }));
    modeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const order: LayoutMode[] = ["list", "columns", "grid"];
      section.layoutMode = order[(order.indexOf(cmode) + 1) % 3];
      view.saveLayout();
      view.rerender();
    };
    // Pin-zone cycler: body → header → footer (mirrors the layout cycler).
    const pin = sectionPin(section);
    const pinBtn = sum.createSpan({ cls: "ep-icon-btn" });
    setIcon(pinBtn, pin === "header" ? "arrow-up-to-line" : pin === "footer" ? "arrow-down-to-line" : "pin");
    pinBtn.setAttr("title", t("section.pinCycleHint", { zone: t("pin." + pin) }));
    if (pin !== "body") pinBtn.addClass("is-active");
    pinBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const order: SectionPin[] = ["body", "header", "footer"];
      const next = order[(order.indexOf(pin) + 1) % order.length];
      section.pin = next === "body" ? undefined : next;
      section.sticky = undefined; // superseded legacy flag
      view.saveLayout();
      view.rerender();
    };
    // Options menu.
    const menuBtn = sum.createSpan({ cls: "ep-menu-btn", text: "⋯" });
    menuBtn.setAttr("title", t("section.optionsHint"));
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openSectionMenu(e as MouseEvent, view, section);
    };
  }
  sum.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openSectionMenu(e, view, section);
  });

  // -- body --------------------------------------------------------------
  const collapseWrap = det.createDiv({ cls: "ep-collapse" });
  const body = collapseWrap.createDiv({ cls: "ep-section-body" });
  const flags = computeFlags(view, file, section);
  const mode = sectionMode(section);
  const ncol = Math.max(1, section.columns || 1);

  let colRail: HTMLElement | null = null;
  let rowRail: HTMLElement | null = null;
  if (view.editMode && mode !== "list") colRail = body.createDiv({ cls: "ep-colrail" });
  const gflex = view.editMode && mode === "grid" ? body.createDiv({ cls: "ep-gridflex" }) : body;
  if (view.editMode && mode === "grid") rowRail = gflex.createDiv({ cls: "ep-rowrail" });

  const grid = gflex.createDiv({ cls: "ep-grid ep-mode-" + mode });
  if (section.dividers) grid.addClass("ep-dividers");
  if (section.vdividers) grid.addClass("ep-vdividers");
  if (section.size && section.size !== "unlimited") {
    const rows = SIZE_ROWS[section.size] ?? 12;
    grid.style.maxHeight = rows * ROW_PX + "px";
    grid.style.overflowY = "auto";
  }

  if (mode === "list") {
    for (const entry of section.entries) renderEntry(grid, view, file, section, entry, flags, drag);
    if (view.editMode) {
      const add = body.createDiv({ cls: "ep-add" });
      const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: t("entry.addProperty") });
      ab.onclick = () => view.openAddMenu(ab, section);
    }
  } else if (mode === "columns") {
    grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`;
    const per = Math.max(1, Math.ceil(section.entries.length / ncol));
    for (let cc = 0; cc < ncol; cc++) {
      const col = grid.createDiv({ cls: "ep-col" });
      for (const entry of section.entries.slice(cc * per, (cc + 1) * per))
        renderEntry(col, view, file, section, entry, flags, drag);
      if (view.editMode) {
        const insertAt = Math.min((cc + 1) * per, section.entries.length);
        const ab = col.createEl("button", { cls: "ep-mini-btn ep-coladd", text: t("entry.addProperty") });
        ab.setAttr("title", t("entry.addToColumnHint", { section: section.title }));
        ab.onclick = () => view.openAddMenu(ab, section, { index: insertAt });
      }
    }
  } else {
    grid.style.gridTemplateColumns = `repeat(${ncol}, minmax(0, 1fr))`;
    if (section.rows && section.rows > 0) grid.style.gridTemplateRows = `repeat(${section.rows}, auto)`;
    for (const entry of section.entries) {
      if (isHiddenEntry(view, entry)) grid.createDiv({ cls: "ep-empty-cell" });
      else renderEntry(grid, view, file, section, entry, flags, drag);
    }
    if (view.editMode) {
      // Trailing add-cells fill only the last partial row, so the row rail
      // lines up with rows that actually exist; a full-width add button
      // below the grid (same as list mode) covers "append a new row".
      const pad = (ncol - (section.entries.length % ncol)) % ncol;
      for (let z = 0; z < pad; z++) {
        const cell = grid.createDiv({ cls: "ep-empty-cell ep-empty-pad" });
        cell.createSpan({ cls: "ep-pad-plus", text: t("entry.addProperty") });
        cell.setAttr("title", t("entry.addToSectionHint", { section: section.title }));
        cell.onclick = () => view.openAddMenu(cell, section, { index: section.entries.length });
        cell.addEventListener("contextmenu", (ce) => {
          ce.preventDefault();
          const m = new Menu();
          m.addItem((i) =>
            i.setTitle(t("blank.addHere")).setIcon("plus").onClick(() =>
              view.openAddMenu(cell, section, { index: section.entries.length })
            )
          );
          m.showAtMouseEvent(ce);
        });
      }
      const add = body.createDiv({ cls: "ep-add" });
      const ab = add.createEl("button", { cls: "ep-add-input ep-addbtn", text: t("entry.addProperty") });
      ab.onclick = () => view.openAddMenu(ab, section, { index: section.entries.length });
    }
  }

  alignClusters(det);
  if (colRail || rowRail) renderRails(view, section, grid, colRail, rowRail);
  if (view.editMode) drag.attachSection(det, grid, section);
  if (collapsible) {
    collapseWrap.style.overflow = "hidden";
    if (section.collapsed) collapseWrap.style.height = "0px";
    // Accessible disclosure (M1): the title bar is a keyboard-operable button
    // that reports its expanded/collapsed state.
    sum.setAttr("role", "button");
    sum.tabIndex = 0;
    sum.setAttr("aria-label", t("a11y.toggleSection", { name: section.title }));
    sum.setAttr("aria-expanded", String(!section.collapsed));
    const toggle = () => {
      toggleSection(view, section, det, collapseWrap, host);
      sum.setAttr("aria-expanded", String(!section.collapsed));
    };
    sum.onclick = toggle;
    sum.addEventListener("keydown", (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && e.target === sum) {
        e.preventDefault();
        toggle();
      }
    });
  }
}

/** Animated expand/collapse, persisting the collapsed flag. */
function toggleSection(
  view: ViewCtx,
  section: Section,
  det: HTMLElement,
  wrap: HTMLElement,
  host: SectionHost
): void {
  section.collapsed = !section.collapsed;
  view.saveLayout();
  const chev = det.querySelector(".ep-chev");
  if (chev) (chev as HTMLElement).toggleClass("ep-open", !section.collapsed);
  if (section.collapsed) {
    const h = wrap.scrollHeight;
    wrap.style.height = h + "px";
    requestAnimationFrame(() => {
      wrap.style.height = "0px";
    });
  } else {
    wrap.style.height = "0px";
    const target = wrap.scrollHeight;
    requestAnimationFrame(() => {
      wrap.style.height = target + "px";
    });
    const done = () => {
      wrap.style.height = "auto";
      wrap.removeEventListener("transitionend", done);
    };
    wrap.addEventListener("transitionend", done);
  }
  requestAnimationFrame(() => host.reflowSticky());
}

/** Cluster cell spans on one axis, merging cells of the same column/row. */
function clusterSpans(spans: [number, number][]): [number, number][] {
  const sorted = [...spans].sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && Math.abs(a - last[0]) < 2) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/**
 * Position the add/remove rail buttons by measuring the rendered cells:
 * "+" sits exactly on the boundaries between columns/rows (and the outer
 * edges), "−" exactly at each column/row center. The grid is offset by the
 * row rail and trailed by non-row chrome (the add-property button), so
 * static spacing drifts — measuring guarantees the buttons only cover
 * rows/columns that actually exist and can be removed.
 */
function renderRails(
  view: ViewCtx,
  section: Section,
  grid: HTMLElement,
  colRail: HTMLElement | null,
  rowRail: HTMLElement | null
): void {
  const t = view.i18n.t.bind(view.i18n);
  const isGrid = sectionMode(section) === "grid";

  requestAnimationFrame(() => {
    if (!grid.isConnected) return;
    const gr = grid.getBoundingClientRect();
    // Cells that define the column/row geometry. Wide (full-span) entries
    // would merge all columns, so they are skipped.
    const cells = (Array.from(grid.children) as HTMLElement[]).filter(
      (c) =>
        (c.classList.contains("ep-entry") || c.classList.contains("ep-empty-cell") || c.classList.contains("ep-col")) &&
        !c.style.gridColumn
    );
    const spansOf = (axis: "x" | "y") =>
      clusterSpans(
        cells.map((c) => {
          const r = c.getBoundingClientRect();
          return axis === "x"
            ? ([r.left - gr.left, r.right - gr.left] as [number, number])
            : ([r.top - gr.top, r.bottom - gr.top] as [number, number]);
        })
      );
    /** Outer edges + the midpoints of the gaps between spans. */
    const boundsOf = (spans: [number, number][]) => {
      const out: number[] = [];
      spans.forEach(([a, b], i) => {
        out.push(i === 0 ? a : (spans[i - 1][1] + a) / 2);
        if (i === spans.length - 1) out.push(b);
      });
      return out;
    };
    const mkBtn = (rail: HTMLElement, cls: string, icon: string, title: string, onClick: () => void) => {
      const el = rail.createDiv({ cls });
      const sp = el.createSpan();
      setIcon(sp, icon);
      el.setAttr("title", title);
      el.onclick = onClick;
      return el;
    };
    const commit = (fn: () => void) => {
      fn();
      view.saveLayout();
      view.rerender();
    };

    if (colRail && colRail.isConnected) {
      colRail.empty();
      const off = gr.left - colRail.getBoundingClientRect().left;
      const spans = spansOf("x");
      boundsOf(spans).forEach((x, i) => {
        mkBtn(colRail, "ep-addbar", "plus", t("grid.addColumnHint"), () =>
          commit(() => ops.addColumnAt(section, i, isGrid))
        ).style.left = off + x + "px";
      });
      if (spans.length > 1)
        spans.forEach(([a, b], i) => {
          mkBtn(colRail, "ep-rmbar", "minus", t("grid.removeColumnHint"), () =>
            commit(() => ops.removeColumnAt(section, i, isGrid))
          ).style.left = off + (a + b) / 2 + "px";
        });
    }

    if (rowRail && rowRail.isConnected) {
      rowRail.empty();
      const off = gr.top - rowRail.getBoundingClientRect().top;
      const spans = spansOf("y");
      boundsOf(spans).forEach((y, i) => {
        mkBtn(rowRail, "ep-addbar", "plus", t("grid.addRowHint"), () =>
          commit(() => ops.addRowAt(section, i))
        ).style.top = off + y + "px";
      });
      spans.forEach(([a, b], i) => {
        mkBtn(rowRail, "ep-rmbar", "minus", t("grid.removeRowHint"), () =>
          commit(() => ops.removeRowAt(section, i))
        ).style.top = off + (a + b) / 2 + "px";
      });
    }
  });
}
