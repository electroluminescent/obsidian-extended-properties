/**
 * Shared dice-choosing UI, used everywhere a roll can be configured:
 *
 * - {@link openDiceMenu}: a context menu with the preset dice (D2–D100),
 *   a custom die size, dice count, and reset — for inline use on rows.
 * - {@link addDiceSettings}: `Setting` rows (preset dropdown + count +
 *   custom size) — for options modals.
 * - {@link renderDiceTag}: the small notation tag ("2d6") rendered in the
 *   same muted format as a modifying property's abbreviation, shown before
 *   the modifier.
 */

import { App, Menu, Setting } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { DICE_PRESETS, DiceSpec, formatDice, isDefaultDice, parseDice, parseDiceOrDefault } from "../../utils/dice";
import { TextPromptModal } from "../../ui/modals/dialogs";

/** Get/set the persisted dice notation (undefined = default d20). */
export interface DiceBinding {
  get(): string | undefined;
  set(notation: string | undefined): void;
}

/** Persist a spec, normalizing the default back to "unset". */
function commit(binding: DiceBinding, spec: DiceSpec): void {
  binding.set(isDefaultDice(spec) ? undefined : formatDice(spec));
}

/** Context menu for choosing dice on a row (e.g. a skill's dice tag). */
export function openDiceMenu(e: MouseEvent, app: App, i18n: I18n, binding: DiceBinding): void {
  const cur = parseDiceOrDefault(binding.get());
  const menu = new Menu();
  for (const sides of DICE_PRESETS) {
    menu.addItem((i) =>
      i.setTitle(formatDice({ count: cur.count, sides }))
        .setChecked(cur.sides === sides)
        .onClick(() => commit(binding, { count: cur.count, sides }))
    );
  }
  menu.addSeparator();
  menu.addItem((i) =>
    i.setTitle(i18n.t("dice.customSize")).onClick(() =>
      new TextPromptModal(app, i18n, i18n.t("dice.customSizePrompt"), String(cur.sides), (v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n >= 2) commit(binding, { count: cur.count, sides: n });
      }).open()
    )
  );
  menu.addItem((i) =>
    i.setTitle(i18n.t("dice.count")).onClick(() =>
      new TextPromptModal(app, i18n, i18n.t("dice.countPrompt"), String(cur.count), (v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n >= 1) commit(binding, { count: n, sides: cur.sides });
      }).open()
    )
  );
  menu.addItem((i) => i.setTitle(i18n.t("dice.reset")).onClick(() => binding.set(undefined)));
  menu.showAtMouseEvent(e);
}

/** `Setting` rows for options modals: preset dropdown, count, custom size. */
export function addDiceSettings(container: HTMLElement, i18n: I18n, binding: DiceBinding): void {
  const cur = () => parseDiceOrDefault(binding.get());
  new Setting(container)
    .setName(i18n.t("dice.die"))
    .setDesc(i18n.t("dice.dieDesc"))
    .addDropdown((d) => {
      for (const sides of DICE_PRESETS) d.addOption(String(sides), "d" + sides);
      d.addOption("custom", i18n.t("dice.custom"));
      const c = cur();
      d.setValue(DICE_PRESETS.includes(c.sides) ? String(c.sides) : "custom");
      d.onChange((v) => {
        if (v === "custom") return; // the size field below takes over
        commit(binding, { count: cur().count, sides: parseInt(v) });
      });
    })
    .addText((t) => {
      t.setPlaceholder(i18n.t("dice.customSizeShort"));
      const c = cur();
      t.setValue(DICE_PRESETS.includes(c.sides) ? "" : String(c.sides));
      t.onChange((v) => {
        const n = parseInt(v);
        if (Number.isFinite(n) && n >= 2) commit(binding, { count: cur().count, sides: n });
      });
    });
  new Setting(container).setName(i18n.t("dice.countLabel")).addText((t) => {
    t.setValue(String(cur().count)).onChange((v) => {
      const n = parseInt(v);
      if (Number.isFinite(n) && n >= 1) commit(binding, { count: n, sides: cur().sides });
    });
  });
}

/**
 * Render the dice notation tag (muted, abbreviation-style) into `parent`.
 * Returns the element, or null when the effective dice are the default d20
 * and `alwaysShow` is false (default look stays uncluttered).
 */
export function renderDiceTag(
  parent: HTMLElement,
  notation: string | undefined,
  alwaysShow = false
): HTMLElement | null {
  const spec = parseDice(notation);
  if (!spec && !alwaysShow) return null;
  const eff = spec ?? parseDiceOrDefault(undefined);
  return parent.createSpan({ cls: "ep-dice-tag ep-line-abbr", text: formatDice(eff) });
}
