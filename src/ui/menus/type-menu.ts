/**
 * Context menu for the header's type chip.
 *
 * The chip is where the note's type is visible, so it is also where you reach
 * for the type itself. Everything the settings tab offers per type - rename,
 * icon, reset, export, delete - is here, next to the note it applies to,
 * instead of four clicks away in settings.
 */

import { App, Menu, Notice } from "obsidian";
import type ExtendedPropertiesPlugin from "../../main";
import type { I18n } from "../../i18n/i18n";
import { packType } from "../../core/transfer";
import { ConfirmModal } from "../modals/dialogs";
import { IconPickerModal } from "../modals/icon-picker";
import { RenameTypeModal } from "../modals/rename-type";
import { typeName } from "../components/type-label";
import { showMenu } from "./show";

export interface TypeMenuCtx {
  app: App;
  i18n: I18n;
  plugin: ExtendedPropertiesPlugin;
  /** The type shown on the chip (display name). */
  type: string;
  /** Open the chip's own picker (retype this note / create a type). */
  onPick: () => void;
  /** Settings or layout changed - redraw whatever hosts the chip. */
  onChanged: () => void;
}

export function openTypeMenu(ev: MouseEvent, c: TypeMenuCtx): void {
  const { app, i18n, plugin, type } = c;
  const t = i18n.t.bind(i18n);
  const key = type.toLowerCase();
  const menu = new Menu();

  menu.addItem((i) => i.setTitle(t("typeMenu.change")).setIcon("replace").onClick(() => c.onPick()));
  menu.addSeparator();

  menu.addItem((i) =>
    i.setTitle(t("typeMenu.rename", { name: type })).setIcon("pencil").onClick(() => {
      const prop = typeName(plugin.settings);
      new RenameTypeModal(app, i18n, {
        current: type,
        clashes: (name) =>
          plugin.settings.types.some((x) => x.toLowerCase() === name.toLowerCase() && x.toLowerCase() !== key),
        noteCount: plugin.props.filesWithValue(prop, type, true).length,
        onSubmit: (next, o) => {
          void (async () => {
            const { outcome, notes } = await plugin.renameTypeEverywhere(type, next, o);
            if (outcome === "invalid") return;
            new Notice(t(outcome === "merged" ? "settings.renameTypeMerged" : "settings.renameTypeDone", { name: next }));
            if (o.retype) new Notice(t("settings.renameTypeNotesDone", { n: String(notes) }));
            c.onChanged();
          })();
        },
      }).open();
    })
  );

  menu.addItem((i) =>
    i.setTitle(t("typeMenu.icon")).setIcon("image").onClick(() =>
      new IconPickerModal(app, i18n, plugin.settings.typeIcons?.[key] ?? "", (v) => {
        const icons = (plugin.settings.typeIcons ??= {});
        if (v) icons[key] = v;
        else delete icons[key];
        void plugin.saveSettings();
        c.onChanged();
      }).open()
    )
  );
  if (plugin.settings.typeIcons?.[key]) {
    menu.addItem((i) =>
      i.setTitle(t("typeMenu.iconReset")).setIcon("rotate-ccw").onClick(() => {
        delete plugin.settings.typeIcons?.[key];
        void plugin.saveSettings();
        c.onChanged();
      })
    );
  }

  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(t("typeMenu.resetLayout")).setIcon("rotate-ccw").onClick(() =>
      new ConfirmModal(app, i18n, t("settings.resetLayoutConfirm", { type }), () => {
        plugin.resetLayout(key);
        c.onChanged();
      }).open()
    )
  );
  menu.addItem((i) =>
    i.setTitle(t("typeMenu.export")).setIcon("clipboard-copy").onClick(() => {
      const doc = packType(type, plugin.ensureLayout(key), plugin.settings.derivations, plugin.manifest.version);
      void navigator.clipboard?.writeText(JSON.stringify(doc, null, 2));
      new Notice(t("transfer.copied"));
    })
  );

  menu.addSeparator();
  menu.addItem((i) =>
    i
      .setTitle(t("typeMenu.delete", { name: type }))
      .setIcon("trash")
      .setWarning(true)
      .onClick(() =>
        new ConfirmModal(app, i18n, t("typeMenu.deleteConfirm", { name: type }), () => {
          plugin.deleteType(type);
          c.onChanged();
        }).open()
      )
  );

  showMenu(menu, ev);
}
