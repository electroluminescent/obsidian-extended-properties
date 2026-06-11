/**
 * Per-entry options modal.
 *
 * Generic sections (property/label, appearance, Obsidian visibility,
 * placement) are rendered here; type- and feature-specific sections are
 * contributed through the registries:
 *
 *   value type   → `ValueTypeDef.renderOptions`   (range, image height, …)
 *   addons       → `ClusterAddon.renderOptions`   (D&D roll settings, …)
 *   entry kind   → `EntryKindDef.renderOptions`   (non-prop widgets)
 *
 * Closing with changes asks the user to keep or undo them (snapshot diff).
 */

import { Modal, Setting, TFile } from "obsidian";
import type { OptionsCtx, ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { restoreFromSnapshot } from "../../utils/misc";
import { addColorSetting, addIconSetting, ColorHost } from "../components/setting-helpers";
import { PropSuggest } from "../components/suggest";
import { ConfirmChangesModal } from "./dialogs";

export class EntryOptionsModal extends Modal {
  private snapshot = "";

  constructor(private view: ViewCtx, private section: Section, private entry: Entry, private file: TFile) {
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
    this.snapshot = JSON.stringify(this.entry);
    this.draw();
  }

  private draw(): void {
    const c = this.contentEl;
    const view = this.view;
    const t = view.i18n.t.bind(view.i18n);
    c.empty();
    c.addClass("ep-options");
    const e = this.entry;
    const isProp = e.kind === "prop";
    const octx: OptionsCtx = {
      view,
      file: this.file,
      section: this.section,
      entry: e,
      container: c,
      changed: () => this.changed(),
      redraw: () => this.draw(),
    };

    c.createEl("h3", { text: t("options.title", { name: (e.alias as string) || view.defaultLabelFor(e) }) });

    // -- identity -----------------------------------------------------------
    c.createEl("h4", { text: isProp ? t("options.propertyHeading") : t("options.objectHeading") });
    if (isProp) {
      new Setting(c)
        .setName(t("options.property"))
        .setDesc(t("options.propertyDesc"))
        .addText((tx) => {
          tx.setValue((e.key as string) ?? "");
          new PropSuggest(view.app, tx.inputEl, view.i18n, () => view.propCandidates(true), (k) => {
            view.renameKey(e, k);
            this.draw();
          }, false);
          tx.inputEl.addEventListener("change", () => {
            const v = tx.getValue().trim();
            if (v && v !== e.key) {
              view.renameKey(e, v);
              this.draw();
            }
          });
        });
    }
    new Setting(c)
      .setName(t("options.label"))
      .setDesc(t("options.labelDesc", { default: view.defaultLabelFor(e) }))
      .addText((tx) => {
        tx.setPlaceholder(view.defaultLabelFor(e))
          .setValue((e.alias as string) ?? "")
          .onChange((v) => {
            e.alias = v.trim() || undefined;
            this.changed();
          });
      });

    // -- type-specific -------------------------------------------------------
    if (isProp) {
      c.createEl("h4", { text: t("options.typeHeading") });
      const cur = view.resolveType(e);
      new Setting(c)
        .setName(t("options.dataType"))
        .setDesc(t("options.dataTypeDesc"))
        .addDropdown((d) => {
          for (const def of view.registries.valueTypes.all()) d.addOption(def.id, def.name(view.i18n));
          d.setValue(cur);
          d.onChange((v) => {
            e.dataType = v;
            this.changed();
            this.draw();
          });
        });
      view.registries.valueTypes.get(cur)?.renderOptions?.(octx);
    } else {
      view.registries.entryKinds.get(e.kind)?.renderOptions?.(octx);
    }

    // -- appearance ----------------------------------------------------------
    c.createEl("h4", { text: t("options.appearanceHeading") });
    addIconSetting(view.app, view.i18n, c, t("options.icon"), () => e.icon as string | undefined, (v) => {
      e.icon = v;
      this.changed();
    });
    addColorSetting(this.colorHost(), c, t("options.iconColor"), "", () => e.iconColor as string | undefined, (v) => {
      e.iconColor = v;
      this.changed();
    });
    new Setting(c)
      .setName(t("options.hideLabel"))
      .setDesc(t("options.hideLabelDesc"))
      .addToggle((tg) => {
        tg.setValue(!!e.hideLabel).onChange((v) => {
          e.hideLabel = v || undefined;
          this.changed();
        });
      });
    new Setting(c)
      .setName(t("options.hideIfEmpty"))
      .setDesc(t("options.hideIfEmptyDesc"))
      .addToggle((tg) => {
        tg.setValue(e.hideIfEmpty !== false).onChange((v) => {
          e.hideIfEmpty = v ? undefined : false;
          this.changed();
        });
      });
    new Setting(c)
      .setName(t("options.labelSize"))
      .setDesc(t("options.sizeDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 40, 1)
          .setValue((e.labelSize as number) ?? 0)
          .setDynamicTooltip()
          .onChange((v) => {
            e.labelSize = v || undefined;
            this.changed();
          });
      });
    new Setting(c)
      .setName(t("options.valueSize"))
      .setDesc(t("options.sizeDesc"))
      .addSlider((sl) => {
        sl.setLimits(0, 40, 1)
          .setValue((e.valueSize as number) ?? 0)
          .setDynamicTooltip()
          .onChange((v) => {
            e.valueSize = v || undefined;
            this.changed();
          });
      });
    addColorSetting(this.colorHost(), c, t("options.labelColor"), "", () => e.labelColor as string | undefined, (v) => {
      e.labelColor = v;
      this.changed();
    });
    addColorSetting(this.colorHost(), c, t("options.valueColor"), "", () => e.valueColor as string | undefined, (v) => {
      e.valueColor = v;
      this.changed();
    });

    // -- Obsidian integration ------------------------------------------------
    if (isProp) {
      c.createEl("h4", { text: t("options.obsidianHeading") });
      new Setting(c)
        .setName(t("options.showInObsidian"))
        .setDesc(t("options.showInObsidianDesc"))
        .addToggle((tg) => {
          tg.setValue(!!e.showInObsidian).onChange((v) => {
            e.showInObsidian = v || undefined;
            this.changed();
          });
        });
    }

    // -- placement -----------------------------------------------------------
    c.createEl("h4", { text: t("options.placementHeading") });
    new Setting(c).addButton((b) =>
      b.setButtonText(t("entry.menu.remove")).setWarning().onClick(() => {
        this.view.removeEntry(this.section, e);
        this.close();
      })
    );
    new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
    if (JSON.stringify(this.entry) !== this.snapshot) {
      new ConfirmChangesModal(this.view.app, this.view.i18n, () => {}, () => {
        restoreFromSnapshot(this.entry, this.snapshot);
        this.changed();
      }).open();
    }
  }
}
