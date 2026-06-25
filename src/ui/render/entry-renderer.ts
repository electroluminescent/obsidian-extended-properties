/**
 * Renders one entry into a section grid: the shared shell (wrapper, grip,
 * icon, options button, context menu, drag wiring) around the kind-specific
 * body looked up in the entry-kind registry.
 */

import { setIcon } from "obsidian";
import type { TFile } from "obsidian";
import type { ClusterFlags, EntryRenderCtx, ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { openEntryMenu } from "../menus/entry-menu";
import { longPressContextMenu } from "../components/long-press";
import type { DragController } from "../drag";

/** True when the entry should be hidden outside edit mode (empty prop). */
export function isHiddenEntry(view: ViewCtx, entry: Entry): boolean {
  if (view.editMode) return false;
  // Conditional visibility applies to entries of any kind.
  if (entry.showWhen && !view.condVisible(entry.showWhen)) return true;
  if (entry.kind !== "prop") return false;
  // Derived values are computed, not stored — they are never "empty".
  if (view.resolveType(entry) === "derived") return false;
  return entry.hideIfEmpty !== false && view.note.isEmpty(entry.key);
}

/** Whether the entry spans all section columns (kind- or value-type-wide). */
function isWide(view: ViewCtx, entry: Entry): boolean {
  if (view.registries.entryKinds.get(entry.kind)?.wide) return true;
  if (entry.kind === "prop") return !!view.registries.valueTypes.get(view.resolveType(entry))?.wide;
  return false;
}

export function renderEntry(
  grid: HTMLElement,
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry,
  flags: ClusterFlags,
  drag: DragController
): void {
  if (isHiddenEntry(view, entry)) return;
  const kind = view.registries.entryKinds.get(entry.kind);
  // Edit mode shows conditionally-hidden entries dimmed (so they stay reachable).
  const condOff = view.editMode && !!entry.showWhen && !view.condVisible(entry.showWhen);

  // Bare kinds (blank cells) own their entire chrome.
  if (kind?.bare) {
    const wrap = grid.createDiv({ cls: "ep-entry ep-blank" });
    wrap.setAttr("data-ep-id", "e:" + entry.id);
    if (condOff) wrap.addClass("ep-cond-off");
    const ctx: EntryRenderCtx = { view, file, section, entry, head: wrap, extra: wrap, flags, wrap };
    kind.render(ctx);
    if (view.editMode) {
      const grip = wrap.querySelector(".ep-grip") as HTMLElement | null;
      if (grip) drag.attachEntry(wrap, grip, section, entry);
    }
    return;
  }

  const wide = isWide(view, entry);
  const wrap = grid.createDiv({ cls: wide ? "ep-entry ep-entry-block" : "ep-entry" });
  wrap.setAttr("data-ep-id", "e:" + entry.id);
  if (condOff) {
    wrap.addClass("ep-cond-off");
    wrap.setAttr("title", view.i18n.t("options.showWhenActive", { expr: entry.showWhen as string }));
  }
  if (wide) wrap.style.gridColumn = "1 / -1";

  const head = wrap.createDiv({ cls: "ep-entry-head" });
  let grip: HTMLElement | null = null;
  if (view.editMode) {
    grip = head.createSpan({ cls: "ep-grip", text: "⠿" });
    grip.setAttr("title", view.i18n.t("entry.dragHint"));
  }
  if (entry.icon) {
    const ic = head.createSpan({ cls: "ep-picon" });
    setIcon(ic, entry.icon as string);
    if (entry.iconColor) ic.style.color = entry.iconColor as string;
  }
  const extra = wrap.createDiv({ cls: "ep-entry-extra" });

  const ctx: EntryRenderCtx = { view, file, section, entry, head, extra, flags, wrap };
  if (kind) {
    kind.render(ctx);
  } else {
    // Unknown kind (e.g. its feature module was disabled): show a stub.
    view.renderLabel(head, ctx);
    const v = head.createDiv({ cls: "ep-val-right" });
    v.createSpan({ cls: "ep-placeholder", text: view.i18n.t("entry.unknownKind", { kind: entry.kind }) });
  }

  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    openEntryMenu(e, view, file, section, entry);
  });
  longPressContextMenu(wrap); // touch parity for the entry menu
  if (view.editMode) {
    const menuBtn = head.createSpan({ cls: "ep-menu-btn", text: "⋯" });
    menuBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEntryMenu(e as MouseEvent, view, file, section, entry);
    };
    if (grip) drag.attachEntry(wrap, grip, section, entry);
  }
}
