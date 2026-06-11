/**
 * Per-section options modal: identity, layout mode and dimensions, colors,
 * and title typography. Closing with changes asks to keep or undo them.
 */

import { Modal, Setting } from "obsidian";
import type { ViewCtx } from "../../core/context";
import { LayoutMode, Section, SectionSize, sectionMode } from "../../core/model";
import { restoreFromSnapshot } from "../../utils/misc";
import { addColorSetting, addIconSetting, ColorHost } from "../components/setting-helpers";
import { ConfirmChangesModal } from "./dialogs";

export class SectionOptionsModal extends Modal {
  private snapshot = "";

  constructor(private view: ViewCtx, private section: Section) {
    super(view.app);
  }

  private changed(): void {
    this.view.saveLayout();
    this.view.rerender();
  }

  private colorHost(): ColorHost {
    const view = this.view;
    return {
      app: view.app,
      i18n: view.i18n,
      getColorSpace: () => view.settings.defaults.colorSpace,
      setColorSpace: (sp) => {
        view.settings.defaults.colorSpace = sp;
        view.saveLayout();
      },
    };
  }

  onOpen(): void {
    this.snapshot = JSON.stringify(this.section);
    this.draw();
  }

  private draw(): void {
    const c = this.contentEl;
    const s = this.section;
    const t = this.view.i18n.t.bind(this.view.i18n);
    c.empty();
    c.addClass("ep-options");
    c.createEl("h3", { text: t("sectionOptions.title", { name: s.title }) });

    // -- identity -----------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.sectionHeading") });
    new Setting(c)
      .setName(t("sectionOptions.name"))
      .setDesc(t("sectionOptions.nameDesc"))
      .addText((tx) => {
        tx.setPlaceholder(t("section.namePlaceholder"))
          .setValue(s.title)
          .onChange((v) => {
            s.title = v.trim() || t("section.namePlaceholder");
            this.changed();
          });
      });
    addIconSetting(this.view.app, this.view.i18n, c, t("options.icon"), () => s.icon, (v) => {
      s.icon = v;
      this.changed();
    });
    addColorSetting(this.colorHost(), c, t("options.iconColor"), "", () => s.iconColor, (v) => {
      s.iconColor = v;
      this.changed();
    });
    new Setting(c).setName(t("options.hideLabel")).addToggle((tg) => {
      tg.setValue(!!s.hideLabel).onChange((v) => {
        s.hideLabel = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.collapsible")).addToggle((tg) => {
      tg.setValue(s.collapsible !== false).onChange((v) => {
        s.collapsible = v;
        if (!v) s.collapsed = false;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.dividers")).addToggle((tg) => {
      tg.setValue(!!s.dividers).onChange((v) => {
        s.dividers = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.vdividers")).addToggle((tg) => {
      tg.setValue(!!s.vdividers).onChange((v) => {
        s.vdividers = v || undefined;
        this.changed();
      });
    });
    new Setting(c)
      .setName(t("options.hideIfEmpty"))
      .setDesc(t("sectionOptions.hideIfEmptyDesc"))
      .addToggle((tg) => {
        tg.setValue(s.hideIfEmpty !== false).onChange((v) => {
          s.hideIfEmpty = v ? undefined : false;
          this.changed();
        });
      });

    // -- layout --------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.layoutHeading") });
    const mode = sectionMode(s);
    new Setting(c)
      .setName(t("sectionOptions.layout"))
      .setDesc(t("sectionOptions.layoutDesc"))
      .addDropdown((d) => {
        d.addOption("list", t("layout.list"));
        d.addOption("columns", t("layout.columns"));
        d.addOption("grid", t("layout.grid"));
        d.setValue(mode);
        d.onChange((v) => {
          s.layoutMode = v as LayoutMode;
          this.changed();
          this.draw();
        });
      });
    const colSet = new Setting(c).setName(t("sectionOptions.columns"));
    colSet.addText((tx) => {
      tx.setDisabled(mode === "list");
      tx.setValue(String(s.columns || 2)).onChange((v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n > 0) {
          s.columns = n;
          this.changed();
        }
      });
    });
    if (mode === "list") colSet.settingEl.addClass("ep-disabled");
    const rowSet = new Setting(c).setName(t("sectionOptions.rows")).setDesc(t("sectionOptions.rowsDesc"));
    rowSet.addText((tx) => {
      tx.setDisabled(mode !== "grid");
      tx.setValue(String(s.rows || 0)).onChange((v) => {
        const n = parseInt(v);
        s.rows = Number.isFinite(n) && n > 0 ? n : undefined;
        this.changed();
      });
    });
    if (mode !== "grid") rowSet.settingEl.addClass("ep-disabled");
    new Setting(c).setName(t("sectionOptions.transparent")).addToggle((tg) => {
      tg.setValue(!!s.transparent).onChange((v) => {
        s.transparent = v || undefined;
        this.changed();
      });
    });
    new Setting(c).setName(t("sectionOptions.sticky")).addToggle((tg) => {
      tg.setValue(!!s.sticky).onChange((v) => {
        s.sticky = v || undefined;
        this.changed();
      });
    });
    new Setting(c)
      .setName(t("sectionOptions.height"))
      .setDesc(t("sectionOptions.heightDesc"))
      .addDropdown((d) => {
        d.addOption("unlimited", t("size.unlimited"));
        d.addOption("s", t("size.smallRows"));
        d.addOption("m", t("size.mediumRows"));
        d.addOption("l", t("size.largeRows"));
        d.setValue(s.size || "unlimited");
        d.onChange((v) => {
          s.size = v as SectionSize;
          this.changed();
        });
      });

    // -- colors --------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.colorsHeading") });
    addColorSetting(this.colorHost(), c, t("sectionOptions.accent"), t("sectionOptions.accentDesc"), () => s.accent, (v) => {
      s.accent = v;
      this.changed();
    });
    addColorSetting(this.colorHost(), c, t("sectionOptions.background"), "", () => s.bg, (v) => {
      s.bg = v;
      this.changed();
    });
    addColorSetting(this.colorHost(), c, t("sectionOptions.controls"), t("sectionOptions.controlsDesc"), () => s.controlColor, (v) => {
      s.controlColor = v;
      this.changed();
    });

    // -- title ----------------------------------------------------------------
    c.createEl("h4", { text: t("sectionOptions.titleHeading") });
    new Setting(c)
      .setName(t("sectionOptions.titleSize"))
      .setDesc(t("options.sizeDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 48, 1)
          .setValue(s.titleSize ?? 0)
          .setDynamicTooltip()
          .onChange((v) => {
            s.titleSize = v || undefined;
            this.changed();
          });
      });
    new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
    if (JSON.stringify(this.section) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {}, () => {
        restoreFromSnapshot(this.section as unknown as Record<string, unknown>, this.snapshot);
        this.changed();
      }).open();
    }
  }
}
