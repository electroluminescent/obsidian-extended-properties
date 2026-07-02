/**
 * "checkbox", "list" and "color" value types.
 *
 * - checkbox: toggles on change (edit mode) or double-click (locked mode).
 * - list: chips with link rendering, removable, with a value picker to add.
 * - color: swatch + hex text opening the multi-space color picker.
 */

import { Setting } from "obsidian";
import type { EntryRenderCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import { hexToRgb } from "../../../utils/color";
import { sfx } from "../../../utils/sound";
import { applyValidity } from "../validity";

// ---------------------------------------------------------------------------
// checkbox
// ---------------------------------------------------------------------------

function isChecked(ctx: EntryRenderCtx, key: string): boolean {
  const v = ctx.view.note.raw[key];
  return v === true || String(v).toLowerCase() === "true";
}

export const checkboxType: ValueTypeDef = {
  id: "checkbox",
  name: (i18n) => i18n.t("type.checkbox"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueColor) v.style.color = entry.valueColor;
    const cb = v.createEl("input");
    cb.type = "checkbox";
    cb.addClass("ep-prof");
    cb.checked = isChecked(ctx, key);
    cb.setAttr("aria-label", view.defaultLabelFor(entry)); // native checkbox needs a name
    if (view.editMode) {
      cb.onchange = () => { sfx.toggle(); view.note.set(file, key, cb.checked); };
    } else {
      cb.setAttr("title", view.i18n.t("hint.dblToggle"));
      cb.onclick = (e) => e.preventDefault();
      cb.ondblclick = () => { sfx.toggle(); view.note.set(file, key, !isChecked(ctx, key)); };
      // Keyboard parity in locked mode (click is prevented to stop stray toggles).
      cb.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          sfx.toggle();
          view.note.set(file, key, !isChecked(ctx, key));
        }
      };
    }
    view.registerUpdater(() => {
      cb.checked = isChecked(ctx, key);
    });
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.toggle")).setIcon("check").onClick(() =>
        view.note.set(file, key, !(view.note.raw[key] === true))
      )
    );
  },
};

// ---------------------------------------------------------------------------
// list
// ---------------------------------------------------------------------------

/** Build the chip list; shared between render and live updates. */
function buildList(ctx: EntryRenderCtx, holder: HTMLElement, showAdd: boolean): void {
  const { view, file, entry } = ctx;
  const key = entry.key as string;
  const current = view.note.list(key);
  const list = holder.createDiv({ cls: "ep-list" });
  for (const item of current) {
    const chip = list.createSpan({ cls: "ep-chip" });
    const cv = chip.createSpan();
    view.renderLinks(cv, item);
    const x = chip.createSpan({ cls: "ep-chip-x", text: "×" });
    x.setAttr("role", "button");
    x.tabIndex = 0;
    x.setAttr("aria-label", view.i18n.t("a11y.removeItem", { item }));
    const removeItem = () => view.note.set(file, key, current.filter((i) => i !== item));
    x.onclick = removeItem;
    x.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); removeItem(); }
    };
  }
  if (showAdd) {
    const addb = list.createEl("button", { cls: "ep-mini-btn ep-list-addbtn", text: view.i18n.t("list.add") });
    addb.onclick = () => {
      const r = addb.getBoundingClientRect();
      view.openListValuePicker(r.left, r.bottom + 2, key);
    };
  }
}

export const listType: ValueTypeDef = {
  id: "list",
  name: (i18n) => i18n.t("type.list"),

  render(ctx) {
    const { view, entry } = ctx;
    const holder = ctx.extra.createDiv({ cls: "ep-list-holder" });
    const align = (entry.listAlign as string) || "";
    if (align === "center" || align === "right") holder.addClass("ep-align-" + align);
    if (entry.valueSize) holder.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) holder.style.color = entry.valueColor;
    const key = entry.key as string;
    const checkValid = () => applyValidity(holder, entry, "list", view.note.raw[key], view.i18n);
    buildList(ctx, holder, view.editMode);
    checkValid();
    view.registerUpdater(() => {
      holder.empty();
      buildList(ctx, holder, view.editMode);
      checkValid();
    });
  },

  menuItems(menu, ref, pos) {
    const { view, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.addItem")).setIcon("plus").onClick(() =>
        view.openListValuePicker(pos.x, pos.y, key)
      )
    );
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed } = octx;
    const t = view.i18n.t.bind(view.i18n);
    c.createEl("h4", { text: t("options.listHeading") });
    new Setting(c)
      .setName(t("options.listAlign"))
      .setDesc(t("options.listAlignDesc"))
      .addDropdown((d) => {
        d.addOption("left", t("align.left"));
        d.addOption("center", t("align.center"));
        d.addOption("right", t("align.right"));
        d.setValue((entry.listAlign as string) || "left");
        d.onChange((v) => {
          entry.listAlign = v === "left" ? undefined : v;
          changed();
        });
      });
  },
};

// ---------------------------------------------------------------------------
// color
// ---------------------------------------------------------------------------

export const colorType: ValueTypeDef = {
  id: "color",
  name: (i18n) => i18n.t("type.color"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) v.style.color = entry.valueColor;
    const sw = v.createSpan({ cls: "ep-swatch" });
    const txt = v.createSpan({ cls: "ep-color-text" });
    const draw = () => {
      const hex = view.note.str(key);
      const ok = hexToRgb(hex);
      sw.style.background = ok ? hex : "transparent";
      sw.toggleClass("ep-swatch-empty", !ok);
      txt.setText(hex || "—");
    };
    draw();
    const open = () =>
      view.openColorPicker(view.note.str(key) || "#888888", (out) => view.note.set(file, key, out));
    view.bindOpen(sw, open, false);
    view.bindOpen(txt, open);
    view.registerUpdater(draw);
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.pickColor")).setIcon("palette").onClick(() =>
        view.openColorPicker(view.note.str(key) || "#888888", (out) => view.note.set(file, key, out))
      )
    );
  },
};
