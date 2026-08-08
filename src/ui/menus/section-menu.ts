/**
 * Context menu for a section: filling in a property it is hiding, configure,
 * quick toggles, "Add object" (entry kinds flagged `addable`), reorder and
 * delete.
 */

import { FuzzySuggestModal, Menu, Notice, TFile } from "obsidian";
import type { ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { genId } from "../../utils/misc";
import { packSection } from "../../core/transfer";
import * as ops from "../../core/layout-ops";
import { SectionOptionsModal } from "../modals/section-options";
import { TextPromptModal } from "../modals/dialogs";
import { isHiddenEntry } from "../render/entry-renderer";
import { evalMeasure, unitsForField } from "../../utils/measure";
import { flipMove } from "../drag";
import { showMenu } from "./show";

/** The section's properties that are hidden right now for having no value. */
function emptyEntries(view: ViewCtx, section: Section): Entry[] {
  if (view.editMode) return []; // nothing is hidden in edit mode
  return section.entries.filter((e) => e.kind === "prop" && !!e.key && isHiddenEntry(view, e));
}

/** Pick one of the properties a section is hiding, by the name it shows. */
class EmptyPropModal extends FuzzySuggestModal<Entry> {
  constructor(view: ViewCtx, private entries: Entry[], private onPick: (e: Entry) => void) {
    super(view.app);
    this.setPlaceholder(view.i18n.t("section.menu.fillPick"));
  }
  getItems(): Entry[] {
    return this.entries;
  }
  getItemText(e: Entry): string {
    return (e.alias as string) || (e.key as string) || "";
  }
  onChooseItem(e: Entry): void {
    this.onPick(e);
  }
}

/**
 * What a typed value means for this property. A numeric field reads what was
 * typed the way its own field would - arithmetic, measurements and all - so
 * the first value goes in exactly as the fifth one will.
 */
function coerce(view: ViewCtx, entry: Entry, text: string): unknown {
  const type = view.resolveType(entry);
  if (type === "checkbox") return /^(y|yes|true|on|1)$/i.test(text);
  if (type === "list") return text.split(",").map((v) => v.trim()).filter(Boolean);
  if (type === "number" || type === "decimal" || type === "formula" || type === "unit" || type === "rating") {
    const unit = (entry.unit ?? "").trim();
    const n = evalMeasure(text, unitsForField(view.settings.units, entry.unit), { percentIsUnit: unit === "%" });
    return n === undefined ? text : n;
  }
  return text;
}

/** Ask for a first value for `entry`, and give the property one. */
function fillEntry(view: ViewCtx, file: TFile, entry: Entry): void {
  const t = view.i18n.t.bind(view.i18n);
  const key = entry.key as string;
  const name = (entry.alias as string) || key;
  new TextPromptModal(
    view.app,
    view.i18n,
    t("section.menu.fillValue", { name }),
    "",
    (v) => {
      const text = v.trim();
      if (!text) return;
      view.note.set(file, key, coerce(view, entry, text));
      view.rerender(); // it was hidden for being empty; now it is neither
    },
    () => view.props.valuesFor(key)
  ).open();
}

export function openSectionMenu(e: MouseEvent, view: ViewCtx, file: TFile, section: Section): void {
  const t = view.i18n.t.bind(view.i18n);
  const menu = new Menu();

  // A property hidden for being empty cannot be reached outside edit mode -
  // which is the point of hiding it, right up until the day you want to fill
  // one in. The section it belongs to can still offer them.
  const empties = emptyEntries(view, section);
  if (empties.length) {
    menu.addItem((i) =>
      i
        .setTitle(t("section.menu.fillEmpty", { n: String(empties.length) }))
        .setIcon("plus")
        .onClick(() => new EmptyPropModal(view, empties, (entry) => fillEntry(view, file, entry)).open())
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
