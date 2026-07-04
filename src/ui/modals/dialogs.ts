/**
 * Small reusable dialogs: confirmation, keep/undo prompts, exit-edit-mode
 * choice, and a one-field text prompt with optional autocompletion.
 */

import { App, Modal, Setting } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { ValueSuggest } from "../components/suggest";
import { isShiftHeld } from "../modifiers";

/** "Are you sure?" with Cancel / Confirm. */
export class ConfirmModal extends Modal {
  constructor(app: App, private i18n: I18n, private message: string, private onConfirm: () => void) {
    super(app);
  }

  /** Shift-click a confirming button to skip the dialog and confirm directly. */
  open(): void {
    if (isShiftHeld()) {
      this.onConfirm();
      return;
    }
    super.open();
  }

  onOpen(): void {
    this.contentEl.createEl("p", { text: this.message });
    new Setting(this.contentEl)
      .addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close()))
      .addButton((b) =>
        b.setButtonText(this.i18n.t("common.confirm")).setWarning().onClick(() => {
          this.onConfirm();
          this.close();
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** Shown when leaving edit mode with changes: keep editing / undo / save. */
export class ExitEditModal extends Modal {
  constructor(app: App, private i18n: I18n, private onSave: () => void, private onDiscard: () => void) {
    super(app);
  }

  /** Shift-click to skip the prompt and take the default (Save). */
  open(): void {
    if (isShiftHeld()) {
      this.onSave();
      return;
    }
    super.open();
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.i18n.t("exitEdit.title") });
    contentEl.createEl("p", { text: this.i18n.t("exitEdit.message") });
    new Setting(contentEl)
      .addButton((b) => b.setButtonText(this.i18n.t("exitEdit.keepEditing")).onClick(() => this.close()))
      .addButton((b) =>
        b.setButtonText(this.i18n.t("exitEdit.undo")).setWarning().onClick(() => {
          this.onDiscard();
          this.close();
        })
      )
      .addButton((b) =>
        b.setButtonText(this.i18n.t("exitEdit.save")).setCta().onClick(() => {
          this.onSave();
          this.close();
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** Shown when an options modal closes with changes: keep or undo them. */
export class ConfirmChangesModal extends Modal {
  constructor(app: App, private i18n: I18n, private onKeep: () => void, private onUndo: () => void) {
    super(app);
  }

  /** Shift-click to skip the prompt and take the default (Keep changes). */
  open(): void {
    if (isShiftHeld()) {
      this.onKeep();
      return;
    }
    super.open();
  }

  onOpen(): void {
    const c = this.contentEl;
    c.createEl("h3", { text: this.i18n.t("confirmChanges.title") });
    c.createEl("p", { text: this.i18n.t("confirmChanges.message") });
    new Setting(c)
      .addButton((b) =>
        b.setButtonText(this.i18n.t("confirmChanges.undo")).setWarning().onClick(() => {
          this.onUndo();
          this.close();
        })
      )
      .addButton((b) =>
        b.setButtonText(this.i18n.t("confirmChanges.keep")).setCta().onClick(() => {
          this.onKeep();
          this.close();
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

/** One text field + Save/Cancel; optional value suggestions. */
export class TextPromptModal extends Modal {
  private value: string;

  constructor(
    app: App,
    private i18n: I18n,
    private title: string,
    initial: string,
    private onSubmit: (v: string) => void,
    private suggest?: () => string[]
  ) {
    super(app);
    this.value = initial;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h3", { text: this.title });
    new Setting(contentEl).setName(this.title).addText((t) => {
      t.setValue(this.value).onChange((v) => (this.value = v));
      if (this.suggest) {
        new ValueSuggest(this.app, t.inputEl, this.suggest, (v) => (this.value = v), false);
        t.inputEl.addEventListener("focus", () => t.inputEl.dispatchEvent(new Event("input")));
        t.inputEl.dispatchEvent(new Event("input"));
      }
      t.inputEl.focus();
      t.inputEl.select();
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.onSubmit(this.value);
          this.close();
        }
      });
    });
    new Setting(contentEl)
      .addButton((b) => b.setButtonText(this.i18n.t("common.cancel")).onClick(() => this.close()))
      .addButton((b) =>
        b.setButtonText(this.i18n.t("common.save")).setCta().onClick(() => {
          this.onSubmit(this.value);
          this.close();
        })
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
