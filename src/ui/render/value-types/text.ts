/**
 * "text" value type - single-line text with link rendering and vault-wide
 * value autocompletion while editing.
 *
 * Also the surface for L1 sensitive-value encryption: a value stored as an
 * encryption envelope renders as a lock chip (decrypted in place once the
 * session is unlocked) and can never be overwritten by the plaintext editor;
 * the row menu offers Encrypt / Decrypt.
 */

import { Notice } from "obsidian";
import type { ValueTypeDef } from "../../../core/registry";
import { openTextInput } from "../../components/inline-edit";
import { TextPromptModal } from "../../modals/dialogs";
import { applyValidity } from "../validity";
import { isEnvelope } from "../../../core/secure";

export const textType: ValueTypeDef = {
  id: "text",
  name: (i18n) => i18n.t("type.text"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    if (entry.valueSize) v.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const s = v.createSpan();
    const draw = () => {
      s.empty();
      s.removeClasses(["ep-placeholder", "ep-locked", "ep-editable"]);
      const raw = view.note.raw[key];
      if (isEnvelope(raw)) {
        const plain = view.secretReveal?.(raw) ?? null;
        if (plain !== null) {
          view.renderLinks(s, plain);
          s.createSpan({ cls: "ep-lock-badge", text: " [locked]" });
        } else {
          s.setText(view.i18n.t("secure.locked"));
          s.addClass("ep-locked");
        }
        applyValidity(v, entry, "text", raw, view.i18n);
        return;
      }
      const val = view.note.str(key);
      if (val === "") {
        s.setText("-");
        s.addClass("ep-placeholder");
      } else {
        view.renderLinks(s, val);
      }
      s.addClass("ep-editable");
      applyValidity(v, entry, "text", raw, view.i18n);
    };
    draw();
    view.bindOpen(s, () => {
      // Never open a plaintext editor over an encrypted value - that would drop
      // the ciphertext. Direct the user to Decrypt first.
      if (isEnvelope(view.note.raw[key])) {
        new Notice(view.i18n.t("secure.editLocked"));
        return;
      }
      openTextInput(view.app, s, key, view.note.str(key), (k) => view.props.valuesFor(k), (nv) =>
        view.note.set(file, key, nv === "" ? undefined : nv)
      );
    });
    view.registerUpdater(draw);
  },

  menuItems(menu, ref) {
    const { view, file, entry } = ref;
    const key = entry.key as string;
    const encrypted = isEnvelope(view.note.raw[key]);
    menu.addItem((i) =>
      i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() => {
        if (encrypted) {
          new Notice(view.i18n.t("secure.editLocked"));
          return;
        }
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
    // L1 encryption actions - sidebar view only (the ViewCtx helpers are optional).
    if (view.encryptValueAt && !encrypted) {
      menu.addItem((i) =>
        i
          .setTitle(view.i18n.t("secure.menu.encrypt"))
          .setIcon("lock")
          .onClick(() => void view.encryptValueAt!(file, key))
      );
    }
    if (view.decryptValueAt && encrypted) {
      menu.addItem((i) =>
        i
          .setTitle(view.i18n.t("secure.menu.decrypt"))
          .setIcon("unlock")
          .onClick(() => void view.decryptValueAt!(file, key))
      );
    }
  },
};
