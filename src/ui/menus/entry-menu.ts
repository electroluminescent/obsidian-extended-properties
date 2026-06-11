/**
 * Context menu for an entry. Generic actions (configure, hide, remove,
 * grid row/column removal) live here; type-specific value actions are
 * contributed by the entry's value type via `ValueTypeDef.menuItems`.
 */

import { Menu, TFile } from "obsidian";
import type { ViewCtx } from "../../core/context";
import { Entry, Section, sectionMode } from "../../core/model";
import * as ops from "../../core/layout-ops";

export function openEntryMenu(
  e: MouseEvent,
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry
): void {
  const t = view.i18n.t.bind(view.i18n);
  const menu = new Menu();

  menu.addItem((i) =>
    i.setTitle(t("entry.menu.configure", { name: (entry.alias as string) || view.defaultLabelFor(entry) }))
      .setIcon("settings")
      .onClick(() => view.openEntryOptions(section, entry))
  );

  if (entry.kind === "prop" && entry.key) {
    const key = entry.key;
    menu.addSeparator();
    menu.addItem((i) =>
      i.setTitle(view.hide.isHidden(key) ? t("entry.menu.showInObsidian", { key }) : t("entry.menu.hideFromObsidian", { key }))
        .setIcon(view.hide.isHidden(key) ? "eye" : "eye-off")
        .onClick(() => view.hide.toggle(key))
    );
    menu.addItem((i) =>
      i.setTitle(t("entry.menu.clearValue", { key })).setIcon("eraser").onClick(() =>
        view.note.set(file, key, undefined)
      )
    );
    menu.addSeparator();
    // Value-type specific actions (edit value, pick color, add item, …).
    const type = view.resolveType(entry);
    view.registries.valueTypes.get(type)?.menuItems?.(menu, { view, file, section, entry }, { x: e.clientX, y: e.clientY });
  }

  // Grid/column structure actions.
  const mode = sectionMode(section);
  const kindDef = view.registries.entryKinds.get(entry.kind);
  if ((mode === "grid" || mode === "columns") && !kindDef?.wide) {
    const cols = section.columns || 1;
    const idx = section.entries.indexOf(entry);
    if (idx >= 0) {
      menu.addSeparator();
      if (mode === "grid")
        menu.addItem((i) =>
          i.setTitle(t("grid.removeRow")).setIcon("trash").onClick(() => {
            ops.removeRowAt(section, Math.floor(idx / cols));
            view.saveLayout();
            view.rerender();
          })
        );
      menu.addItem((i) =>
        i.setTitle(mode === "grid" ? t("grid.removeColumn") : t("grid.removeAColumn"))
          .setIcon("trash")
          .onClick(() => {
            ops.removeColumnAt(section, idx % cols, mode === "grid");
            view.saveLayout();
            view.rerender();
          })
      );
    }
  }

  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(t("entry.menu.remove")).setIcon("trash").onClick(() => view.removeEntry(section, entry))
  );
  menu.showAtMouseEvent(e);
}
