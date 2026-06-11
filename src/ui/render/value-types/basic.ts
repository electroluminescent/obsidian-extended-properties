/**
 * "checkbox", "list" and "color" value types.
 *
 * - checkbox: toggles on change (edit mode) or double-click (locked mode).
 * - list: chips with link rendering, removable, with a value picker to add.
 * - color: swatch + hex text opening the multi-space color picker.
 */

import type { EntryRenderCtx } from "../../../core/context";
import type { ValueTypeDef } from "../../../core/registry";
import { hexToRgb } from "../../../utils/color";

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
    if (view.editMode) {
      cb.onchange = () => view.note.set(file, key, cb.checked);
    } else {
      cb.setAttr("title", view.i18n.t("hint.dblToggle"));
      cb.onclick = (e) => e.preventDefault();
      cb.ondblclick = () => view.note.set(file, key, !isChecked(ctx, key));
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
    x.onclick = () => view.note.set(file, key, current.filter((i) => i !== item));
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
    if (entry.valueSize) holder.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) holder.style.color = entry.valueColor;
    buildList(ctx, holder, view.editMode);
    view.registerUpdater(() => {
      holder.empty();
      buildList(ctx, holder, view.editMode);
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
