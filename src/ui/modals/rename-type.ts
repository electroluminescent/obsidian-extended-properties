/**
 * Rename a note type.
 *
 * Two things make this more than a text prompt. The new name may already be a
 * type, in which case the two merge and the user has to say which layout
 * survives; and the notes themselves carry the old value, so the dialog offers
 * to rewrite them - counted up front, because "update 214 notes" deserves to be
 * seen before it happens rather than discovered afterwards.
 */

import { App, Modal, Setting } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import type { MergeChoice } from "../../core/type-ops";

export interface RenameTypeOptions {
  /** The type being renamed (display name, original casing). */
  current: string;
  /** Whether `name` is already a *different* type. */
  clashes: (name: string) => boolean;
  /** How many notes carry the current value in the type property. */
  noteCount: number;
  onSubmit: (next: string, opts: { merge: MergeChoice; retype: boolean }) => void;
}

export class RenameTypeModal extends Modal {
  private value: string;
  private merge: MergeChoice = "replace";
  private retype: boolean;

  constructor(app: App, private i18n: I18n, private o: RenameTypeOptions) {
    super(app);
    this.value = o.current;
    // Renaming a type in use normally means the notes should follow; the count
    // in the toggle's name keeps that from being a silent mass edit.
    this.retype = o.noteCount > 0;
  }

  onOpen(): void {
    const t = this.i18n.t.bind(this.i18n);
    const c = this.contentEl;
    c.createEl("h3", { text: t("settings.renameTypeTitle", { name: this.o.current }) });

    new Setting(c)
      .setName(t("settings.renameTypeField"))
      .setDesc(t("settings.renameTypeFieldDesc"))
      .addText((tx) => {
        tx.setValue(this.value).onChange((v) => {
          this.value = v;
          this.paintConditional();
        });
        tx.inputEl.focus();
        tx.inputEl.select();
        tx.inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.submit();
          }
        });
      });

    this.conditional = c.createDiv();
    this.paintConditional();

    new Setting(c)
      .addButton((b) => b.setButtonText(t("common.cancel")).onClick(() => this.close()))
      .addButton((b) => {
        this.confirmBtn = b.buttonEl;
        b.setCta().onClick(() => this.submit());
        this.paintConfirm();
      });
  }

  private conditional!: HTMLElement;
  private confirmBtn!: HTMLButtonElement;

  /** The merge choice and the note rewrite only apply in some states. */
  private paintConditional(): void {
    const t = this.i18n.t.bind(this.i18n);
    const c = this.conditional;
    c.empty();
    const name = this.value.trim();

    if (name && this.o.clashes(name)) {
      c.createEl("p", {
        cls: "setting-item-description ep-rename-warn",
        text: t("settings.renameTypeClash", { name }),
      });
      new Setting(c).setName(t("settings.renameTypeMergeChoice")).addDropdown((d) => {
        d.addOption("replace", t("settings.renameTypeKeepMine", { name: this.o.current }));
        d.addOption("keep", t("settings.renameTypeKeepTheirs", { name }));
        d.setValue(this.merge);
        d.onChange((v) => (this.merge = v === "keep" ? "keep" : "replace"));
      });
    }

    if (this.o.noteCount > 0) {
      new Setting(c)
        .setName(t("settings.renameTypeNotes", { n: String(this.o.noteCount) }))
        .setDesc(t("settings.renameTypeNotesDesc", { from: this.o.current }))
        .addToggle((tg) => tg.setValue(this.retype).onChange((v) => (this.retype = v)));
    }

    this.paintConfirm();
  }

  private paintConfirm(): void {
    if (!this.confirmBtn) return;
    const name = this.value.trim();
    const merging = !!name && this.o.clashes(name);
    this.confirmBtn.setText(this.i18n.t(merging ? "common.merge" : "common.rename"));
    this.confirmBtn.toggleClass("mod-warning", merging);
  }

  private submit(): void {
    const name = this.value.trim();
    if (!name) return;
    this.close();
    this.o.onSubmit(name, { merge: this.merge, retype: this.retype });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
