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

import { App, Menu, Setting, TextComponent } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { DICE_PRESETS, DiceSpec, formatDice, isDefaultDice, parseDice, parseDiceOrDefault } from "../../utils/dice";
import { clamp } from "../../utils/misc";
import { diceIconId } from "../../ui/render/dice-icons";
import { TextPromptModal } from "../../ui/modals/dialogs";
import type { RollMode } from "./roll-service";

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
        .setIcon(diceIconId(sides))
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
  // The custom-size box is only active while "Custom…" is selected;
  // otherwise it is disabled and dimmed.
  let sizeBox: TextComponent | null = null;
  const setSizeActive = (on: boolean) => {
    if (!sizeBox) return;
    sizeBox.setDisabled(!on);
    sizeBox.inputEl.toggleClass("ep-disabled", !on);
  };
  new Setting(container)
    .setName(i18n.t("dice.die"))
    .setDesc(i18n.t("dice.dieDesc"))
    .addDropdown((d) => {
      for (const sides of DICE_PRESETS) d.addOption(String(sides), "d" + sides);
      d.addOption("custom", i18n.t("dice.custom"));
      const c = cur();
      d.setValue(DICE_PRESETS.includes(c.sides) ? String(c.sides) : "custom");
      d.onChange((v) => {
        if (v === "custom") {
          // The size field below takes over.
          setSizeActive(true);
          sizeBox?.inputEl.focus();
          return;
        }
        setSizeActive(false);
        commit(binding, { count: cur().count, sides: parseInt(v) });
      });
    })
    .addText((t) => {
      sizeBox = t;
      t.setPlaceholder(i18n.t("dice.customSizeShort"));
      const c = cur();
      const isCustom = !DICE_PRESETS.includes(c.sides);
      t.setValue(isCustom ? String(c.sides) : "");
      setSizeActive(isCustom);
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
 * Right-click menu for roll buttons: choose advantage / normal /
 * disadvantage and how many rolls to make. Multiple rolls run
 * simultaneously as separate cards that stay on screen.
 */
export function openRollMenu(
  ev: MouseEvent,
  i18n: I18n,
  current: RollMode,
  run: (mode: RollMode, times: number) => void,
  opts?: { onEdit?: () => void }
): void {
  const pop = document.body.createDiv({ cls: "ep-popup ep-rollmenu" });
  pop.style.left = ev.clientX + "px";
  pop.style.top = ev.clientY + 2 + "px";

  let mode: RollMode = current;
  const row = pop.createDiv({ cls: "ep-mode" });
  const btns = new Map<RollMode, HTMLElement>();
  const modes: [RollMode, string][] = [
    ["disadvantage", i18n.t("roll.modeDisadvantage")],
    ["normal", i18n.t("roll.modeNormal")],
    ["advantage", i18n.t("roll.modeAdvantage")],
  ];
  for (const [m, lbl] of modes) {
    const b = row.createEl("button", { cls: "ep-mode-btn", text: lbl });
    btns.set(m, b);
    b.onclick = () => {
      mode = m;
      for (const [k, el] of btns) el.toggleClass("is-active", k === mode);
    };
  }
  for (const [k, el] of btns) el.toggleClass("is-active", k === mode);

  const cntRow = pop.createDiv({ cls: "ep-rollmenu-count" });
  cntRow.createSpan({ text: i18n.t("roll.menu.count") });
  const input = cntRow.createEl("input", { cls: "ep-edit-input" });
  input.type = "number";
  input.min = "1";
  input.max = "20";
  input.value = "1";

  const dismiss = () => {
    pop.remove();
    document.removeEventListener("mousedown", outside);
  };
  const go = pop.createEl("button", { cls: "mod-cta ep-rollmenu-go", text: i18n.t("roll.menu.go") });
  go.onclick = () => {
    const n = clamp(Math.round(Number(input.value) || 1), 1, 20);
    dismiss();
    run(mode, n);
  };
  if (opts?.onEdit) {
    const edit = pop.createEl("button", { cls: "ep-mode-btn ep-rollmenu-edit", text: i18n.t("roll.menu.edit") });
    edit.onclick = () => {
      dismiss();
      opts.onEdit?.();
    };
  }
  input.onkeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      go.click();
    } else if (e.key === "Escape") {
      dismiss();
    }
  };
  const outside = (e: MouseEvent) => {
    if (!pop.contains(e.target as Node)) dismiss();
  };
  window.setTimeout(() => document.addEventListener("mousedown", outside), 0);

  // Keep within the window.
  const w = pop.offsetWidth;
  const h = pop.offsetHeight;
  if (ev.clientX + w > window.innerWidth - 4) pop.style.left = Math.max(4, window.innerWidth - w - 4) + "px";
  if (ev.clientY + h > window.innerHeight - 4) pop.style.top = Math.max(4, ev.clientY - h - 2) + "px";
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
