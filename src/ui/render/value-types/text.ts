/**
 * "text" value type - single-line text with link rendering and vault-wide
 * value autocompletion while editing.
 *
 * Also the surface for L1 sensitive-value encryption: a value stored as an
 * encryption envelope renders as a lock chip (decrypted in place once the
 * session is unlocked) and can never be overwritten by the plaintext editor;
 * the row menu offers Encrypt / Decrypt.
 */

import { Notice, Setting } from "obsidian";
import type { ValueTypeDef } from "../../../core/registry";
import type { Entry } from "../../../core/model";
import { openTextArea, openTextInput } from "../../components/inline-edit";
import { TextPromptModal } from "../../modals/dialogs";
import { applyValidity } from "../validity";
import { optionsFor } from "../../../core/choices";
import { poolFor } from "../../../core/pool";
import { isEnvelope } from "../../../core/secure";
import { drawNoteLink, editNoteLink, linksToNotes, renderNoteChoices } from "./note-link";
import type { ViewCtx } from "../../../core/context";

/**
 * The values this entry offers while editing: its allowed values, when it is
 * set to offer those, and otherwise everything the vault holds for the key.
 */
function optionsOf(view: ViewCtx, entry: Entry, key: string): string[] {
  return optionsFor(entry.choices, entry.constraints?.allowed, poolFor(view.settings, view.props.valuesFor(key), key));
}

export const textType: ValueTypeDef = {
  id: "text",
  name: (i18n) => i18n.t("type.text"),

  render(ctx) {
    const { view, file, entry } = ctx;
    const key = entry.key as string;
    const v = ctx.head.createDiv({ cls: "ep-val-right" });
    // A long-form value keeps its line breaks and wraps, rather than being cut
    // to one line - the display half of the expanding editor.
    if (entry.multiline === true) v.addClass("ep-val-multiline");
    if (entry.valueSize) v.setCssStyles({ fontSize: entry.valueSize + "px" });
    if (entry.valueColor) v.setCssStyles({ color: entry.valueColor });
    const s = v.createSpan();
    const draw = () => {
      s.empty();
      s.removeClasses(["ep-placeholder", "ep-locked", "ep-editable"]);
      const raw = view.note.raw[key];
      // A value that names a note is drawn as one - bare name and all - by the
      // shared field (see `note-link`), which the "link" type is also built on.
      if (linksToNotes(entry) && !isEnvelope(raw)) {
        v.addClass("ep-linkval");
        drawNoteLink(view, v, s, entry, view.note.str(key));
        applyValidity(v, entry, "text", raw, view.i18n);
        return;
      }
      v.removeClass("ep-linkval");
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
      const write = (nv: string): void => view.note.set(file, key, nv === "" ? undefined : nv);
      if (linksToNotes(entry)) editNoteLink(view, file, entry, s);
      else if (entry.multiline === true) openTextArea(s, view.note.str(key), write);
      else
        openTextInput(view.app, s, key, view.note.str(key), () => optionsOf(view, entry, key), write, {
          strict: entry.choices?.strict === true,
          rejected: view.i18n.t("text.notAllowed"),
        });
    });
    view.registerUpdater(draw);
  },

  renderOptions(octx) {
    const { view, entry, container: c, changed, redraw } = octx;
    const t = view.i18n.t.bind(view.i18n);
    const ch = (): NonNullable<Entry["choices"]> => (entry.choices ??= {});
    c.createEl("h4", { text: t("options.textHeading") });
    // What the value is: prose, or the name of a note. The rest of the section
    // follows from it, so switching redraws the settings.
    new Setting(c)
      .setName(t("options.linksToNotes"))
      .setDesc(t("options.linksToNotesDesc"))
      .addToggle((tg) => {
        tg.setValue(linksToNotes(entry)).onChange((v) => {
          ch().linksToNotes = v || undefined;
          changed();
          redraw();
        });
      });
    if (linksToNotes(entry)) {
      renderNoteChoices(octx);
      return;
    }
    new Setting(c)
      .setName(t("options.multiline"))
      .setDesc(t("options.multilineDesc"))
      .addToggle((tg) => {
        tg.setValue(entry.multiline === true).onChange((v) => {
          entry.multiline = v ? true : undefined;
          changed();
        });
      });
    // The allowed values are already written down under Validation; this is
    // whether the editor offers them rather than only complaining afterwards.
    new Setting(c)
      .setName(t("options.fromAllowed"))
      .setDesc(t("options.fromAllowedDesc"))
      .addToggle((tg) => {
        tg.setValue(entry.choices?.from === "allowed").onChange((v) => {
          ch().from = v ? "allowed" : undefined;
          changed();
        });
      });
    new Setting(c)
      .setName(t("options.textStrict"))
      .setDesc(t("options.textStrictDesc"))
      .addToggle((tg) => {
        tg.setValue(entry.choices?.strict === true).onChange((v) => {
          ch().strict = v || undefined;
          changed();
        });
      });
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
          () => poolFor(view.settings, view.props.valuesFor(key), key)
        ).open();
      })
    );
    // L1 encryption actions - sidebar view only (the ViewCtx helpers are optional).
    if (view.encryptValueAt && !encrypted && view.settings.features["secure"] !== false) {
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
