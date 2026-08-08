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
import { isHiddenEntry } from "../render/entry-renderer";
import { evalMeasure, unitsForField } from "../../utils/measure";
import { flipMove } from "../drag";
import { showMenu } from "./show";

/** The section's properties that are hidden right now for having no value. */
function emptyEntries(view: ViewCtx, section: Section): Entry[] {
  if (view.editMode) return []; // nothing is hidden in edit mode
  return section.entries.filter((e) => e.kind === "prop" && !!e.key && isHiddenEntry(view, e));
}

/** The name a property shows in the sidebar. */
const nameOf = (e: Entry): string => (e.alias as string) || (e.key as string) || "";

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

/**
 * Give a value to one of the properties a section is hiding: a list to pick
 * from and a field to type in, side by side, where the pointer already is.
 *
 * It stays open after each value, with the property just filled taken off the
 * list - filling in six skills is six picks and six numbers, not six trips
 * through a dialog. Escape or a click elsewhere puts it away.
 */
function openFillPopup(ev: MouseEvent, view: ViewCtx, file: TFile, entries: Entry[]): void {
  const t = view.i18n.t.bind(view.i18n);
  const left = [...entries];
  const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-fillpop" });
  pop.setCssStyles({ left: ev.clientX + "px", top: ev.clientY + 2 + "px" });

  const row = pop.createDiv({ cls: "ep-fillpop-row" });
  const sel = row.createEl("select", { cls: "dropdown ep-fillpop-pick" });
  const input = row.createEl("input", { cls: "ep-edit-input ep-fillpop-val" });
  input.type = "text";
  input.placeholder = t("section.menu.fillPlaceholder");
  const go = row.createEl("button", { cls: "mod-cta", text: t("common.save") });
  pop.createDiv({ cls: "ep-fillpop-note", text: t("section.menu.fillHint") });

  const dismiss = (): void => {
    pop.remove();
    activeDocument.removeEventListener("mousedown", outside);
  };
  const outside = (e: MouseEvent): void => {
    if (!pop.contains(e.target as Node)) dismiss();
  };
  const list = (): void => {
    sel.empty();
    for (const e of left) sel.createEl("option", { value: e.id, text: nameOf(e) });
  };
  const commit = (): void => {
    const entry = left.find((e) => e.id === sel.value);
    const text = input.value.trim();
    if (!entry || !text) return;
    view.note.set(file, entry.key as string, coerce(view, entry, text));
    left.splice(left.indexOf(entry), 1);
    input.value = "";
    view.rerender(); // it was hidden for being empty; now it is neither
    if (!left.length) {
      dismiss();
      return;
    }
    list();
    input.focus();
  };
  list();
  go.onclick = commit;
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
    }
  };
  sel.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      input.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
    }
  };
  window.setTimeout(() => activeDocument.addEventListener("mousedown", outside), 0);
  window.setTimeout(() => sel.focus(), 0);

  // Keep within the window.
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  if (ev.clientX + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, window.innerWidth - w - 4) + "px" });
  if (ev.clientY + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, ev.clientY - h - 2) + "px" });
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
        .onClick(() => openFillPopup(e, view, file, empties))
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
