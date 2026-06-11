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
import { Section, sectionMode } from "../../core/model";
import * as ops from "../../core/layout-ops";
import { emptyFlags, mergeNeeds } from "./cluster";
import { renderEntry, isHiddenEntry } from "./entry-renderer";
import { openSectionMenu } from "../menus/section-menu";
import { bindRename } from "../components/inline-edit";
import type { DragController } from "../drag";
import type { LayoutMode } from "../../core/model";

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

  // Outside edit mode a section with no visible entries can hide entirely.
  if (!view.editMode && section.hideIfEmpty !== false) {
    const hasContent = section.entries.some((e) => !isHiddenEntry(view, e));
    if (!hasContent) return;
  }

  const det = parent.createDiv({ cls: "ep-section" });
  host.registerSectionEl(section.id, det);
  det.setAttr("data-ep-id", "s:" + section.id);
  if (!section.sticky) det.addClass("ep-flow-section");
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
    // Sticky pin.
    const pinBtn = sum.createSpan({ cls: "ep-icon-btn" });
    setIcon(pinBtn, "pin");
    pinBtn.setAttr("title", section.sticky ? t("section.unpinHint") : t("section.pinHint"));
    if (section.sticky) pinBtn.addClass("is-active");
    pinBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      section.sticky = !section.sticky;
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

  if (view.editMode && mode !== "list") renderColumnRail(body, view, section, ncol);
  const gflex = view.editMode && mode === "grid" ? body.createDiv({ cls: "ep-gridflex" }) : body;
  if (view.editMode && mode === "grid") renderRowRail(gflex, view, section, ncol);

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
      // Trailing add-cells: pad the last row, plus one extra full row.
      const pad = ((ncol - (section.entries.length % ncol)) % ncol) + ncol;
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
    }
  }

  if (view.editMode) drag.attachSection(det, grid, section);
  if (collapsible) {
    collapseWrap.style.overflow = "hidden";
    if (section.collapsed) collapseWrap.style.height = "0px";
    sum.onclick = () => toggleSection(view, section, det, collapseWrap, host);
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

/** Vertical "+ / −" rail for adding/removing columns (edit mode). */
function renderColumnRail(parent: HTMLElement, view: ViewCtx, section: Section, ncol: number): void {
  const t = view.i18n.t.bind(view.i18n);
  const rail = parent.createDiv({ cls: "ep-colrail" });
  const isGrid = sectionMode(section) === "grid";
  for (let i = 0; i <= ncol; i++) {
    const b = rail.createDiv({ cls: "ep-addbar" });
    const sp = b.createSpan();
    setIcon(sp, "plus");
    b.setAttr("title", t("grid.addColumnHint"));
    b.onclick = () => {
      ops.addColumnAt(section, i, isGrid);
      view.saveLayout();
      view.rerender();
    };
    if (i < ncol) {
      const slot = rail.createDiv({ cls: "ep-railslot" });
      const rm = slot.createDiv({ cls: "ep-rmbar" });
      const rs = rm.createSpan();
      setIcon(rs, "minus");
      rm.setAttr("title", t("grid.removeColumnHint"));
      rm.onclick = () => {
        ops.removeColumnAt(section, i, isGrid);
        view.saveLayout();
        view.rerender();
      };
    }
  }
}

/** Horizontal "+ / −" rail for adding/removing grid rows (edit mode). */
function renderRowRail(parent: HTMLElement, view: ViewCtx, section: Section, ncol: number): void {
  const t = view.i18n.t.bind(view.i18n);
  const nrow = section.rows && section.rows > 0 ? section.rows : Math.max(1, Math.ceil(section.entries.length / ncol));
  const rail = parent.createDiv({ cls: "ep-rowrail" });
  for (let i = 0; i <= nrow; i++) {
    const b = rail.createDiv({ cls: "ep-addbar" });
    const sp = b.createSpan();
    setIcon(sp, "plus");
    b.setAttr("title", t("grid.addRowHint"));
    b.onclick = () => {
      ops.addRowAt(section, i);
      view.saveLayout();
      view.rerender();
    };
    if (i < nrow) {
      const slot = rail.createDiv({ cls: "ep-railslot" });
      const rm = slot.createDiv({ cls: "ep-rmbar" });
      const rs = rm.createSpan();
      setIcon(rs, "minus");
      rm.setAttr("title", t("grid.removeRowHint"));
      rm.onclick = () => {
        ops.removeRowAt(section, i);
        view.saveLayout();
        view.rerender();
      };
    }
  }
}
