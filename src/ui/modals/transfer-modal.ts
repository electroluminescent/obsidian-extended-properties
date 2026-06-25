/**
 * Import dialog for shared type / section snippets (roadmap D1).
 *
 * Paste (or auto-read from the clipboard) a snippet produced by the Export
 * actions; the dialog audits which referenced derivation building blocks are
 * missing, offers to create them, lets you choose the target type, and on apply
 * regenerates ids and appends the section(s) to that type's layout.
 */

import { Modal, Notice, Setting } from "obsidian";
import type ExtendedPropertiesPlugin from "../../main";
import {
  docSections,
  freshSections,
  missingDerivations,
  parseTransfer,
} from "../../core/transfer";
import type { TransferDoc } from "../../core/transfer";
import { asMobileSheet } from "../components/long-press";

export class ImportModal extends Modal {
  private text = "";
  private createMissing = true;
  private target = "";

  constructor(private plugin: ExtendedPropertiesPlugin) {
    super(plugin.app);
  }

  onOpen(): void {
    asMobileSheet(this);
    this.draw();
    // Prefill from the clipboard when it holds one of our snippets.
    void navigator.clipboard
      ?.readText?.()
      .then((t) => {
        if (!this.text && parseTransfer(t || "")) {
          this.text = t;
          this.draw();
        }
      })
      .catch(() => {
        /* clipboard unavailable — ignore */
      });
  }

  private draw(): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const c = this.contentEl;
    c.empty();
    c.addClass("ep-import");
    c.createEl("h3", { text: t("transfer.importTitle") });

    const ta = c.createEl("textarea", { cls: "ep-import-text" });
    ta.placeholder = t("transfer.importPlaceholder");
    ta.value = this.text;
    ta.rows = 6;
    ta.oninput = () => {
      this.text = ta.value;
      this.drawAudit(body);
    };

    const body = c.createDiv();
    this.drawAudit(body);
  }

  private drawAudit(body: HTMLElement): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    body.empty();
    const doc = parseTransfer(this.text);
    if (!doc) {
      if (this.text.trim()) body.createEl("p", { cls: "ep-import-err", text: t("transfer.invalid") });
      return;
    }

    const sections = docSections(doc);
    const entries = sections.reduce((n, s) => n + s.entries.length, 0);
    body.createEl("p", {
      cls: "setting-item-description",
      text: t("transfer.summary", {
        kind: doc.kind === "type" ? t("transfer.kindType") : t("transfer.kindSection"),
        name: doc.name,
        sections: String(sections.length),
        entries: String(entries),
      }),
    });

    const missing = missingDerivations(doc, this.plugin.settings.derivations);
    if (missing.length) {
      body.createEl("p", {
        cls: "ep-import-warn",
        text: t("transfer.missingDerivations", { list: missing.map((d) => d.name || d.id).join(", ") }),
      });
      new Setting(body).setName(t("transfer.createMissing")).addToggle((tg) =>
        tg.setValue(this.createMissing).onChange((v) => (this.createMissing = v))
      );
    }

    if (!this.target) this.target = doc.kind === "type" ? doc.name : this.plugin.settings.types[0] ?? "";
    new Setting(body)
      .setName(t("transfer.targetType"))
      .setDesc(t("transfer.targetTypeDesc", { types: this.plugin.settings.types.join(", ") || "—" }))
      .addText((tx) => tx.setValue(this.target).onChange((v) => (this.target = v.trim())));

    new Setting(body).addButton((b) =>
      b.setButtonText(t("transfer.importBtn")).setCta().onClick(() => this.apply(doc))
    );
  }

  private apply(doc: TransferDoc): void {
    const t = this.plugin.i18n.t.bind(this.plugin.i18n);
    const p = this.plugin;
    const typeName = (this.target || doc.name).trim();
    if (!typeName) {
      new Notice(t("transfer.pickType"));
      return;
    }
    if (this.createMissing) {
      const miss = missingDerivations(doc, p.settings.derivations);
      if (miss.length) {
        p.settings.derivations.push(...miss);
        p.rebuildRegistries();
      }
    }
    const key = typeName.toLowerCase();
    if (!p.settings.types.some((x) => x.toLowerCase() === key)) p.settings.types.push(typeName);
    const layout = p.ensureLayout(key);
    layout.sections.push(...freshSections(doc));
    void p.saveSettings();
    p.refreshViews();
    new Notice(t("transfer.imported", { name: doc.name, type: typeName }));
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
