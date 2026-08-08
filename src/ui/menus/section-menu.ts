/**
 * Context menu for a section: filling in a property it is hiding, configure,
 * quick toggles, "Add object" (entry kinds flagged `addable`), reorder and
 * delete.
 */

import { Menu, Notice, TFile } from "obsidian";
import type { ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { genId } from "../../utils/misc";
import { packSection } from "../../core/transfer";
import * as ops from "../../core/layout-ops";
import { SectionOptionsModal } from "../modals/section-options";
import { renderEntry } from "../render/entry-renderer";
import { alignClusters, entryFlags } from "../render/section-renderer";
import type { DragController } from "../drag";
import { flipMove } from "../drag";
import { showMenu } from "./show";

/** The section's properties, in the order it shows them. */
function propEntries(section: Section): Entry[] {
  return section.entries.filter((e) => e.kind === "prop" && !!e.key);
}

/**
 * Every property in the section, drawn as the sidebar draws it - the ones
 * with no value first, since those are the ones the sidebar is not showing
 * and the reason to come here at all.
 *
 * The rows ARE sidebar rows: the same renderers, so a number keeps its
 * steppers and slider, a rating its pips, a colour its swatch, a link its
 * autocomplete. Nothing here reimplements a field, which is what made the
 * first attempt at this feel like a different program. The panel opens where
 * the pointer is and stays open while a run of values goes in; a property
 * given a value quietly stops being one of the hidden ones.
 */
function openSetPanel(
  ev: MouseEvent,
  view: ViewCtx,
  file: TFile,
  section: Section,
  drag: DragController
): void {
  const t = view.i18n.t.bind(view.i18n);
  const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-setpop ep-sidebar" });
  pop.setCssStyles({ left: ev.clientX + "px", top: ev.clientY + 2 + "px" });

  const dismiss = (): void => {
    pop.remove();
    activeDocument.removeEventListener("mousedown", outside, true);
    activeDocument.removeEventListener("keydown", onKey, true);
  };
  const outside = (e: MouseEvent): void => {
    // A value type may put its own popup (a colour picker, a suggestion list)
    // over this one; a press in there is not a press outside.
    const el = e.target instanceof HTMLElement ? e.target : null;
    if (pop.contains(e.target as Node) || el?.closest(".ep-popup, .menu, .suggestion-container")) return;
    dismiss();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape" && !pop.querySelector("input:focus, textarea:focus")) dismiss();
  };

  const empty = propEntries(section).filter((e) => view.note.isEmpty(e.key));
  const filled = propEntries(section).filter((e) => !view.note.isEmpty(e.key));
  for (const [label, group] of [
    [t("section.menu.setEmpty"), empty],
    [t("section.menu.setFilled"), filled],
  ] as [string, Entry[]][]) {
    if (!group.length) continue;
    pop.createDiv({ cls: "ep-setpop-group", text: label });
    const grid = pop.createDiv({ cls: "ep-grid ep-mode-list" });
    for (const entry of group)
      renderEntry(grid, view, file, section, entry, entryFlags(view, file, section, entry), drag, { force: true });
    alignClusters(grid);
  }
  pop.createDiv({ cls: "ep-setpop-note", text: t("section.menu.setHint") });

  window.setTimeout(() => activeDocument.addEventListener("mousedown", outside, true), 0);
  activeDocument.addEventListener("keydown", onKey, true);

  // Keep within the window.
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  if (ev.clientX + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, window.innerWidth - w - 4) + "px" });
  if (ev.clientY + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, window.innerHeight - h - 4) + "px" });
}

export function openSectionMenu(
  e: MouseEvent,
  view: ViewCtx,
  file: TFile,
  section: Section,
  drag: DragController
): void {
  const t = view.i18n.t.bind(view.i18n);
  const menu = new Menu();

  // Every property the section holds, with somewhere to type each value -
  // including the ones hidden for being empty, which the sidebar itself gives
  // no way to reach outside edit mode.
  if (propEntries(section).length) {
    menu.addItem((i) =>
      i
        .setTitle(t("section.menu.setProp"))
        .setIcon("plus")
        .onClick(() => openSetPanel(e, view, file, section, drag))
    );
    menu.addSeparator();
  }

  menu.addItem((i) =>
    i.setTitle(t("section.menu.configure", { name: section.title }))
      .setIcon("settings")
      .onClick(() => new SectionOptionsModal(view, section).open())
  );
  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(section.dividers ? t("section.menu.hideDividers") : t("section.menu.showDividers")).onClick(() => {
      section.dividers = !section.dividers;
      view.saveLayout();
      view.rerender();
    })
  );
  menu.addItem((i) =>
    i.setTitle(section.vdividers ? t("section.menu.hideVDividers") : t("section.menu.showVDividers")).onClick(() => {
      section.vdividers = !section.vdividers;
      view.saveLayout();
      view.rerender();
    })
  );
  menu.addItem((i) =>
    i.setTitle(section.collapsible === false ? t("section.menu.enableCollapse") : t("section.menu.disableCollapse")).onClick(() => {
      section.collapsible = section.collapsible === false;
      if (section.collapsible === false) section.collapsed = false;
      view.saveLayout();
      view.rerender();
    })
  );

  // "Add object" - any entry kind that registered itself as addable.
  const addable = view.registries.entryKinds.all().filter((k) => k.addable);
  if (addable.length) {
    menu.addItem((i) =>
      i.setTitle(t("section.menu.addObject")).setIcon("plus-circle").onClick(() => {
        const m2 = new Menu();
        for (const kind of addable) {
          m2.addItem((x) =>
            x.setTitle(kind.defaultLabel(view.i18n, { id: "", kind: kind.id })).onClick(() => {
              section.entries.push({ id: genId(), kind: kind.id });
              view.saveLayout();
              view.rerender();
            })
          );
        }
        showMenu(m2, e);
      })
    );
  }

  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(t("section.menu.moveUp")).setIcon("arrow-up").onClick(() =>
      flipMove(view, () => {
        if (ops.moveSectionBy(view.layout, section.id, -1)) {
          view.saveLayout();
          view.rerender();
        }
      })
    )
  );
  menu.addItem((i) =>
    i.setTitle(t("section.menu.moveDown")).setIcon("arrow-down").onClick(() =>
      flipMove(view, () => {
        if (ops.moveSectionBy(view.layout, section.id, 1)) {
          view.saveLayout();
          view.rerender();
        }
      })
    )
  );
  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(t("section.menu.export")).setIcon("clipboard-copy").onClick(() => {
      const doc = packSection(section, view.settings.derivations);
      void navigator.clipboard?.writeText(JSON.stringify(doc, null, 2));
      new Notice(t("transfer.copied"));
    })
  );
  menu.addItem((i) =>
    i.setTitle(t("section.menu.delete")).setIcon("trash").onClick(() => {
      view.layout.sections = view.layout.sections.filter((s) => s.id !== section.id);
      view.saveLayout();
      view.rerender();
    })
  );
  showMenu(menu, e);
}
