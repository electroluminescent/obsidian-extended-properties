/**
 * Per-entry options.
 *
 * {@link renderEntryOptionsBody} renders the full options UI for one entry
 * into any container — used by the standalone modal here and by the tabbed
 * section options modal. Generic sections (property/label, appearance,
 * Obsidian visibility, placement) are rendered directly; type- and
 * feature-specific sections are contributed through the registries:
 *
 *   value type   → `ValueTypeDef.renderOptions`   (range, image height, …)
 *   addons       → `ClusterAddon.renderOptions`   (modifiers, rolls, …)
 *   entry kind   → `EntryKindDef.renderOptions`   (non-prop widgets)
 *
 * Closing the modal with changes asks the user to keep or undo them
 * (snapshot diff).
 */

import { Modal, Setting, TFile } from "obsidian";
import type { OptionsCtx, ViewCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { restoreFromSnapshot } from "../../utils/misc";
import { addColorSetting, addIconSetting, ColorHost } from "../components/setting-helpers";
import { PropSuggest } from "../components/suggest";
import { ConfirmChangesModal } from "./dialogs";

/** Color host bound to the plugin-wide default color space. */
export function viewColorHost(view: ViewCtx): ColorHost {
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

/**
 * Render the complete options UI for `octx.entry` into `octx.container`.
 * @param onDone    called when the user presses Done
 * @param onRemoved called after the entry was removed from its section
 */
export function renderEntryOptionsBody(octx: OptionsCtx, onDone: () => void, onRemoved: () => void): void {
  const { view, section, entry: e, container: c, changed, redraw } = octx;
  const t = view.i18n.t.bind(view.i18n);
  const isProp = e.kind === "prop";

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
          redraw();
        }, false);
        tx.inputEl.addEventListener("change", () => {
          const v = tx.getValue().trim();
          if (v && v !== e.key) {
            view.renameKey(e, v);
            redraw();
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
          changed();
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
          changed();
          redraw();
        });
      });
    view.registries.valueTypes.get(cur)?.renderOptions?.(octx);
  } else {
    view.registries.entryKinds.get(e.kind)?.renderOptions?.(octx);
  }

  // -- appearance ----------------------------------------------------------
  const host = viewColorHost(view);
  c.createEl("h4", { text: t("options.appearanceHeading") });
  addIconSetting(view.app, view.i18n, c, t("options.icon"), () => e.icon as string | undefined, (v) => {
    e.icon = v;
    changed();
  });
  addColorSetting(host, c, t("options.iconColor"), "", () => e.iconColor as string | undefined, (v) => {
    e.iconColor = v;
    changed();
  });
  new Setting(c)
    .setName(t("options.hideLabel"))
    .setDesc(t("options.hideLabelDesc"))
    .addToggle((tg) => {
      tg.setValue(!!e.hideLabel).onChange((v) => {
        e.hideLabel = v || undefined;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.hideIfEmpty"))
    .setDesc(t("options.hideIfEmptyDesc"))
    .addToggle((tg) => {
      tg.setValue(e.hideIfEmpty !== false).onChange((v) => {
        e.hideIfEmpty = v ? undefined : false;
        changed();
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
          changed();
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
          changed();
        });
    });
  addColorSetting(host, c, t("options.labelColor"), "", () => e.labelColor as string | undefined, (v) => {
    e.labelColor = v;
    changed();
  });
  addColorSetting(host, c, t("options.valueColor"), "", () => e.valueColor as string | undefined, (v) => {
    e.valueColor = v;
    changed();
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
          changed();
        });
      });
  }

  // -- placement -----------------------------------------------------------
  c.createEl("h4", { text: t("options.placementHeading") });
  new Setting(c).addButton((b) =>
    b.setButtonText(t("entry.menu.remove")).setWarning().onClick(() => {
      view.removeEntry(section, e);
      onRemoved();
    })
  );
  new Setting(c).addButton((b) => b.setButtonText(t("common.done")).setCta().onClick(() => onDone()));
}

export class EntryOptionsModal extends Modal {
  private snapshot = "";

  constructor(private view: ViewCtx, private section: Section, private entry: Entry, private file: TFile) {
    super(view.app);
  }

  private changed(): void {
    this.view.saveLayout();
    this.view.rerender();
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
    c.createEl("h3", {
      text: t("options.title", { name: (this.entry.alias as string) || view.defaultLabelFor(this.entry) }),
    });
    const octx: OptionsCtx = {
      view,
      file: this.file,
      section: this.section,
      entry: this.entry,
      container: c,
      changed: () => this.changed(),
      redraw: () => this.draw(),
    };
    renderEntryOptionsBody(octx, () => this.close(), () => this.close());
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
