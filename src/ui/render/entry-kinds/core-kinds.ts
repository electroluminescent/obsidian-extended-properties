/**
 * Core entry kinds:
 *
 * - "prop"  — shows a frontmatter property; delegates to the value-type
 *             registry for the actual value UI.
 * - "blank" — an empty grid cell (placeholder + add/remove menu in edit mode).
 * - "toc"   — table of contents: one row per section, click to scroll.
 */

import { Menu, setIcon } from "obsidian";
import type { EntryKindDef } from "../../../core/registry";
import type { EntryRenderCtx } from "../../../core/context";
import { sectionMode } from "../../../core/model";
import * as ops from "../../../core/layout-ops";

// ---------------------------------------------------------------------------
// prop
// ---------------------------------------------------------------------------

export const propKind: EntryKindDef = {
  id: "prop",
  defaultLabel: (_i18n, entry) => (entry.key as string) ?? "",

  clusterNeeds(ref) {
    const type = ref.view.resolveType(ref.entry);
    return ref.view.registries.valueTypes.get(type)?.clusterNeeds?.(ref) ?? {};
  },

  render(ctx) {
    const { view, entry } = ctx;
    view.renderLabel(ctx.head, ctx);
    const type = view.resolveType(entry);
    const def = view.registries.valueTypes.get(type) ?? view.registries.valueTypes.get("text");
    def?.render(ctx);
  },
};

// ---------------------------------------------------------------------------
// blank
// ---------------------------------------------------------------------------

export const blankKind: EntryKindDef = {
  id: "blank",
  bare: true,
  defaultLabel: (i18n) => i18n.t("kind.blank"),

  render(ctx: EntryRenderCtx) {
    const { view, section, entry, wrap } = ctx;
    if (!view.editMode) return;
    const t = view.i18n.t.bind(view.i18n);
    const grip = wrap.createSpan({ cls: "ep-grip", text: "⠿" });
    grip.setAttr("title", t("blank.dragHint"));
    const openMenu = (ce: MouseEvent) => {
      ce.preventDefault();
      ce.stopPropagation();
      const m = new Menu();
      m.addItem((i) =>
        i.setTitle(t("blank.addHere")).setIcon("plus").onClick(() =>
          view.openAddMenu(wrap, section, { replaceId: entry.id })
        )
      );
      m.addItem((i) =>
        i.setTitle(t("blank.remove")).setIcon("trash").onClick(() => view.removeEntry(section, entry))
      );
      const cols = section.columns || 1;
      const bi = section.entries.indexOf(entry);
      if (bi >= 0) {
        m.addSeparator();
        m.addItem((i) =>
          i.setTitle(t("grid.removeRow")).setIcon("trash").onClick(() => {
            ops.removeRowAt(section, Math.floor(bi / cols));
            view.saveLayout();
            view.rerender();
          })
        );
        m.addItem((i) =>
          i.setTitle(t("grid.removeColumn")).setIcon("trash").onClick(() => {
            ops.removeColumnAt(section, bi % cols, sectionMode(section) === "grid");
            view.saveLayout();
            view.rerender();
          })
        );
      }
      m.showAtMouseEvent(ce);
    };
    const mb = wrap.createSpan({ cls: "ep-menu-btn", text: "⋯" });
    mb.onclick = openMenu;
    wrap.addEventListener("contextmenu", openMenu);
    wrap.onclick = () => view.openAddMenu(wrap, section, { replaceId: entry.id });
  },
};

// ---------------------------------------------------------------------------
// toc
// ---------------------------------------------------------------------------

export const tocKind: EntryKindDef = {
  id: "toc",
  addable: true,
  defaultLabel: (i18n) => i18n.t("kind.toc"),

  render(ctx) {
    const { view } = ctx;
    view.renderLabel(ctx.head, ctx);
    const list = ctx.extra.createDiv({ cls: "ep-toc" });
    list.setAttr("title", view.i18n.t("toc.hint"));
    for (const s of view.layout.sections) {
      const row = list.createDiv({ cls: "ep-toc-row" });
      if (s.icon) {
        const ic = row.createSpan({ cls: "ep-picon" });
        setIcon(ic, s.icon);
      }
      row.createSpan({ text: s.title || view.i18n.t("section.untitled") });
      row.onclick = () => view.scrollToSection(s.id);
    }
  },
};
