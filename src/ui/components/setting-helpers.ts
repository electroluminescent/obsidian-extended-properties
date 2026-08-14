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


/** How a growing list of text values is drawn and written back. */
export interface TextListOptions {
  /** The values as they stand. */
  values: string[];
  /** Label of the button that adds a row. */
  addLabel: string;
  /** Tooltip of a row's remove button. */
  removeTip: string;
  /** Placeholder for an empty field. */
  placeholder?: string;
  /** Attach a suggester to a row's field (folders, pooled values, ...). */
  suggest?: (input: HTMLInputElement, save: (v: string) => void) => void;
  /** Called with the values actually named, whenever a row changes. */
  save: (values: string[]) => void;
  /** Extra buttons beside Add, given a way to append rows of their own. */
  extra?: (foot: Setting, append: (values: string[]) => void) => void;
}

/**
 * A list of text values that grows and shrinks in place: source folders,
 * allowed values, anything of that shape.
 *
 * The rows on screen may include blank ones waiting to be filled in, while
 * what is SAVED is only the values actually named. That distinction is the
 * whole point of this helper: writing a blank into the settings and rebuilding
 * the editor to show it loses the blank (it is not a value yet) and throws the
 * reader back to the top of the page. Nothing here rebuilds anything - a new
 * field appears under the last one with the cursor in it, and a removed row
 * takes only itself away.
 */
export function mountTextList(host: HTMLElement, o: TextListOptions): void {
  const items = o.values.map((value) => ({ value }));
  const write = (): void => o.save(items.map((r) => r.value.trim()).filter(Boolean));
  const rows = host.createDiv({ cls: "ep-mini-list" });
  /** Where new rows go: above the add button, once there is one. */
  let footEl: HTMLElement | null = null;
  const drawRow = (item: { value: string }, focus: boolean): void => {
    const row = new Setting(rows).setClass("ep-mini-row");
    row.addText((tx) => {
      tx.setValue(item.value);
      if (o.placeholder) tx.setPlaceholder(o.placeholder);
      const save = (v: string): void => {
        item.value = v.trim();
        write();
      };
      o.suggest?.(tx.inputEl, save);
      tx.inputEl.addEventListener("change", () => save(tx.getValue()));
      if (focus) window.setTimeout(() => tx.inputEl.focus(), 0);
    });
    row.addExtraButton((b) =>
      b.setIcon("x").setTooltip(o.removeTip).onClick(() => {
        const i = items.indexOf(item);
        if (i >= 0) items.splice(i, 1);
        row.settingEl.remove();
        write();
      })
    );
    if (footEl) rows.insertBefore(row.settingEl, footEl);
  };
  /** Append rows for values found elsewhere (a pool, a paste). */
  const append = (values: string[]): void => {
    for (const value of values) {
      const item = { value };
      items.push(item);
      drawRow(item, false);
    }
    write();
  };
  for (const item of items) drawRow(item, false);
  const foot = new Setting(rows).setClass("ep-mini-row");
  foot.addButton((b) =>
    b.setButtonText(o.addLabel).onClick(() => {
      const item = { value: "" };
      items.push(item);
      drawRow(item, true);
    })
  );
  footEl = foot.settingEl;
  o.extra?.(foot, append);
}

/**
 * The element that actually scrolls around `host`: itself, or the first
 * ancestor that does. A settings popup scrolls its own body; a modal scrolls
 * the content element above whatever was rebuilt.
 */
function scrollerOf(host: HTMLElement): HTMLElement | null {
  for (let el: HTMLElement | null = host; el; el = el.parentElement) {
    const cs = getComputedStyle(el);
    if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) return el;
    if (el.hasClass("modal") || el.hasClass("ep-popup")) break;
  }
  return null;
}

/**
 * Rebuild something without throwing the reader back to the top.
 *
 * Changing one setting often rebuilds the rows around it - a data type that
 * brings its own options, a width that reveals a field. Snapping to the top
 * each time reads as the panel having closed and reopened. The position is
 * put back straight away and again on the next frame, since a row that
 * finishes arriving late would otherwise undo it.
 */
export function keepScroll(host: HTMLElement, rebuild: () => void): void {
  const el = scrollerOf(host);
  const top = el?.scrollTop ?? 0;
  rebuild();
  if (!el || !top) return;
  el.scrollTop = top;
  window.requestAnimationFrame(() => {
    if (el.isConnected) el.scrollTop = top;
  });
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
