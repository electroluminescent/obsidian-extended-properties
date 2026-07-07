/**
 * Reusable `Setting` rows for the options modals and settings tab:
 * a color row (swatch + picker + clear) and an icon row (preview + picker).
 */

import { App, ButtonComponent, Setting, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { hexToRgb, ColorSpace } from "../../utils/color";
import { ColorPickerModal } from "../modals/color-picker";
import { IconPickerModal } from "../modals/icon-picker";

/** Mark a button as destructive across Obsidian versions: `setDestructive` (1.13+) or the older `setWarning`. */
export function destructive(b: ButtonComponent): ButtonComponent {
  const anyB = b as unknown as { setDestructive?: () => void; setWarning?: () => void };
  if (typeof anyB.setDestructive === "function") anyB.setDestructive();
  else anyB.setWarning?.();
  return b;
}


/** Host for color settings: where the picker reads/writes its color space. */
export interface ColorHost {
  app: App;
  i18n: I18n;
  getColorSpace(): ColorSpace;
  setColorSpace(space: ColorSpace): void;
}

/** Add a color setting row: swatch opens the picker, button clears. */
export function addColorSetting(
  host: ColorHost,
  container: HTMLElement,
  name: string,
  desc: string,
  get: () => string | undefined,
  set: (v: string | undefined) => void
): Setting {
  const setting = new Setting(container).setName(name);
  if (desc) setting.setDesc(desc);
  const sw = setting.controlEl.createSpan({ cls: "ep-swatch" });
  const update = () => {
    const h = get();
    const ok = h && hexToRgb(h);
    sw.setCssStyles({ background: ok ? (h) : "transparent" });
    sw.toggleClass("ep-swatch-empty", !ok);
  };
  update();
  sw.onclick = () =>
    new ColorPickerModal(host, get() || "#888888", (hex) => {
      set(hex);
      update();
    }).open();
  setting.addButton((b) =>
    b.setButtonText(host.i18n.t("common.clear")).onClick(() => {
      set(undefined);
      update();
    })
  );
  return setting;
}

/** Add an icon setting row: preview + choose/clear buttons. */
export function addIconSetting(
  app: App,
  i18n: I18n,
  container: HTMLElement,
  name: string,
  get: () => string | undefined,
  set: (v: string | undefined) => void
): Setting {
  const setting = new Setting(container).setName(name).setDesc(i18n.t("options.iconDesc"));
  const prev = setting.controlEl.createSpan({ cls: "ep-icon-prev" });
  const update = () => {
    prev.empty();
    const ic = get();
    if (ic) setIcon(prev, ic);
    else prev.setText("-");
  };
  update();
  setting.addButton((b) =>
    b.setButtonText(i18n.t("common.choose")).onClick(() =>
      new IconPickerModal(app, i18n, get() || "", (v) => {
        set(v || undefined);
        update();
      }).open()
    )
  );
  setting.addButton((b) =>
    b.setButtonText(i18n.t("common.clear")).onClick(() => {
      set(undefined);
      update();
    })
  );
  return setting;
}
