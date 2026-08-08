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
import { evalMeasure, unitsForField } from "../../utils/measure";
import { flipMove } from "../drag";
import { showMenu } from "./show";

/** The section's properties, in the order it shows them. */
function propEntries(section: Section): Entry[] {
  return section.entries.filter((e) => e.kind === "prop" && !!e.key);
}

/** The name a property shows in the sidebar. */
const nameOf = (e: Entry): string => (e.alias as string) || (e.key as string) || "";

/**
 * What a typed value means for this property. A numeric field reads what was
 * typed the way its own field would - arithmetic, measurements and all - so a
 * value set from here goes in exactly as one typed into the row will.
 */
function coerce(view: ViewCtx, entry: Entry, text: string): unknown {
  const type = view.resolveType(entry);
  if (type === "list") return text.split(",").map((v) => v.trim()).filter(Boolean);
  if (type === "number" || type === "decimal" || type === "formula" || type === "unit" || type === "rating") {
    const unit = (entry.unit ?? "").trim();
    const n = evalMeasure(text, unitsForField(view.settings.units, entry.unit), { percentIsUnit: unit === "%" });
    return n === undefined ? text : n;
  }
  return text;
}

/** The property's value as a field would show it: a line of text. */
function asText(view: ViewCtx, entry: Entry): string {
  const raw = view.note.raw[entry.key as string];
  if (raw === undefined || raw === null) return "";
  return Array.isArray(raw) ? raw.map((v) => String(v)).join(", ") : String(raw);
}

/**
 * Every property in the section, with the field to set it beside its name -
 * the ones with no value first, since those are the ones the sidebar is not
 * showing and the reason to come here at all.
 *
 * A panel rather than a dialog: it opens where the pointer is, each row
 * commits on its own (Enter or leaving the field), and it stays open while a
 * run of values goes in. Clearing a field takes the value off the note, which
 * is how a property goes back to being hidden.
 */
function openSetPanel(ev: MouseEvent, view: ViewCtx, file: TFile, section: Section): void {
  const t = view.i18n.t.bind(view.i18n);
  const pop = activeDocument.body.createDiv({ cls: "ep-popup ep-fillpop" });
  pop.setCssStyles({ left: ev.clientX + "px", top: ev.clientY + 2 + "px" });

  const dismiss = (): void => {
    pop.remove();
    activeDocument.removeEventListener("mousedown", outside);
  };
  const outside = (e: MouseEvent): void => {
    if (!pop.contains(e.target as Node)) dismiss();
  };

  /** One property: its name, and the control its type asks for. */
  const drawRow = (host: HTMLElement, entry: Entry): void => {
    const key = entry.key as string;
    const row = host.createDiv({ cls: "ep-fillpop-row" });
    row.createSpan({ cls: "ep-fillpop-name", text: nameOf(entry) });
    const commit = (value: unknown): void => {
      view.note.set(file, key, value);
      view.rerender(); // a property with a value is no longer a hidden one
    };
    if (view.resolveType(entry) === "checkbox") {
      const box = row.createEl("input", { cls: "ep-fillpop-check" });
      box.type = "checkbox";
      box.checked = view.note.raw[key] === true;
      box.onchange = () => commit(box.checked);
      return;
    }
    const input = row.createEl("input", { cls: "ep-edit-input ep-fillpop-val" });
    input.type = "text";
    input.value = asText(view, entry);
    input.placeholder = t("section.menu.setPlaceholder");
    const save = (): void => {
      const text = input.value.trim();
      if (text === asText(view, entry)) return; // nothing was typed
      commit(text === "" ? undefined : coerce(view, entry, text));
    };
    input.addEventListener("change", save);
    input.onkeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
        input.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
  };

  const props = propEntries(section);
  const empty = props.filter((e) => view.note.isEmpty(e.key));
  const set = props.filter((e) => !view.note.isEmpty(e.key));
  for (const [label, group] of [
    [t("section.menu.setEmpty"), empty],
    [t("section.menu.setFilled"), set],
  ] as [string, Entry[]][]) {
    if (!group.length) continue;
    pop.createDiv({ cls: "ep-fillpop-group", text: label });
    for (const entry of group) drawRow(pop, entry);
  }
  pop.createDiv({ cls: "ep-fillpop-note", text: t("section.menu.setHint") });

  window.setTimeout(() => activeDocument.addEventListener("mousedown", outside), 0);
  window.setTimeout(() => pop.querySelector<HTMLElement>("input")?.focus(), 0);

  // Keep within the window.
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  if (ev.clientX + w > window.innerWidth - 4) pop.setCssStyles({ left: Math.max(4, window.innerWidth - w - 4) + "px" });
  if (ev.clientY + h > window.innerHeight - 4) pop.setCssStyles({ top: Math.max(4, window.innerHeight - h - 4) + "px" });
}

export function openSectionMenu(e: MouseEvent, view: ViewCtx, file: TFile, section: Section): void {
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
        .onClick(() => openSetPanel(e, view, file, section))
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
