/**
 * "text" value type — single-line text with link rendering and
 * vault-wide value autocompletion while editing.
 */

import type { ValueTypeDef } from "../../../core/registry";
import { openTextInput } from "../../components/inline-edit";
import { TextPromptModal } from "../../modals/dialogs";
import { applyValidity } from "../validity";

export const textType: ValueTypeDef = {
  id: "text",
  name: (i18n) => i18n.t("type.text"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.style.fontSize = entry.valueSize + "px";
    if (entry.valueColor) v.style.color = entry.valueColor;
    const s = v.createSpan();
    const draw = () => {
      const val = view.note.str(key);
      s.empty();
      if (val === "") {
        s.setText("—");
        s.addClass("ep-placeholder");
      } else {
        s.removeClass("ep-placeholder");
        view.renderLinks(s, val);
      }
      s.addClass("ep-editable");
      applyValidity(v, entry, "text", view.note.raw[key], view.i18n);
    };
    draw();
    view.bindOpen(s, () =>
      openTextInput(view.app, s, key, view.note.str(key), (k) => view.props.valuesFor(k), (nv) =>
        view.note.set(file, key, nv === "" ? undefined : nv)
      )
    );
    view.registerUpdater(draw);
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
        new TextPromptModal(
          view.app,
          view.i18n,
          view.i18n.t("prompt.editValue", { name: entry.alias || key }),
          view.note.str(key),
          (v: string) => view.note.set(file, key, v.trim() === "" ? undefined : v.trim()),
          () => view.props.valuesFor(key)
        ).open();
      })
    );
  },
};
