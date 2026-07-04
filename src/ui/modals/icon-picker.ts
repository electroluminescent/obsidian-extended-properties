/** Searchable grid of all Obsidian icons. */

import { App, Modal, getIconIds, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";

export class IconPickerModal extends Modal {
  constructor(app: App, private i18n: I18n, private current: string, private onPick: (id: string) => void) {
    super(app);
  }

  onOpen(): void {
    const c = this.contentEl;
    c.addClass("ep-iconpick");
    c.createEl("h3", { text: this.i18n.t("iconPicker.title") });
    const search = c.createEl("input");
    search.type = "text";
    search.placeholder = this.i18n.t("iconPicker.search");
    search.addClass("ep-edit-input");
    search.setCssStyles({ width: "100%" });
    const grid = c.createDiv({ cls: "ep-iconpick-grid" });
    let all: string[] = [];
    try {
      all = getIconIds();
    } catch {
      all = [];
    }
    const draw = (q: string) => {
      grid.empty();
      const ql = q.trim().toLowerCase();
      const items = (ql ? all.filter((i) => i.toLowerCase().includes(ql)) : all).slice(0, 500);
      for (const id of items) {
        const cell = grid.createDiv({ cls: "ep-iconpick-item" });
        if (id === this.current) cell.addClass("is-active");
        setIcon(cell, id);
        cell.setAttr("title", id);
        cell.onclick = () => {
          this.onPick(id);
          this.close();
        };
      }
      if (items.length === 0) grid.createDiv({ cls: "ep-empty-sub", text: this.i18n.t("iconPicker.noMatch") });
    };
    search.addEventListener("input", () => draw(search.value));
    draw("");
    window.setTimeout(() => search.focus(), 0);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
