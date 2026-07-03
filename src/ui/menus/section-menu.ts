/**
 * Context menu for a section: configure, quick toggles, "Add object"
 * (entry kinds flagged `addable`), reorder and delete.
 */

import { Menu, Notice } from "obsidian";
import type { ViewCtx } from "../../core/context";
import type { Section } from "../../core/model";
import { genId } from "../../utils/misc";
import { packSection } from "../../core/transfer";
import * as ops from "../../core/layout-ops";
import { SectionOptionsModal } from "../modals/section-options";
import { flipMove } from "../drag";

export function openSectionMenu(e: MouseEvent, view: ViewCtx, section: Section): void {
  const t = view.i18n.t.bind(view.i18n);
  const menu = new Menu();

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
        m2.showAtMouseEvent(e);
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
  menu.showAtMouseEvent(e);
}
