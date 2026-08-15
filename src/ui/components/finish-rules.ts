/**
 * The editor for a list of finish rules: who wears what.
 *
 * The same list is written in two places, which is why it lives here rather
 * than inside either of them. A PALETTE carries finishes because a palette is
 * a look, and a look is a colour and a material both - point a property at
 * "Threat" and it should arrive foiled without anybody saying so again. A
 * PROPERTY carries them when that one row wants something else.
 */

import { Setting } from "obsidian";
import type { FinishRule } from "../../core/model";
import type { I18n } from "../../i18n/i18n";
import { FINISHES, finishName } from "../render/finishes";

/**
 * Draw the rules into `host`.
 *
 * @param list what is there now
 * @param put  called with the whole list whenever anything changes
 */
export function renderFinishRules(
  host: HTMLElement,
  i18n: I18n,
  list: FinishRule[],
  put: (next: FinishRule[]) => void
): void {
  const t = i18n.t.bind(i18n);
  const rows = host.createDiv({ cls: "ep-mini-list" });
  const patch = (i: number, change: Partial<FinishRule>): void =>
    put(list.map((x, j) => (j === i ? { ...x, ...change } : x)));

  list.forEach((fr, i) => {
    const row = new Setting(rows).setClass("ep-mini-row");
    const box = row.controlEl;
    const drop = box.createEl("select", { cls: "dropdown ep-fin-when" });
    for (const when of ["all", "values", "range"])
      drop.createEl("option", { value: when, text: t("options.finishWhen." + when) });
    drop.value = fr.when;
    drop.onchange = () => patch(i, { when: drop.value });

    if (fr.when === "values") {
      const vals = box.createEl("input", { cls: "ep-edit-input ep-fin-vals" });
      vals.type = "text";
      vals.placeholder = t("options.finishValues");
      vals.value = (fr.values ?? []).join(", ");
      vals.addEventListener("change", () =>
        patch(i, { values: vals.value.split(",").map((v) => v.trim()).filter(Boolean) })
      );
    }
    if (fr.when === "range") {
      const num = (v: number | undefined, on: (n: number) => void): void => {
        const el = box.createEl("input", { cls: "ep-edit-input ep-pal-num" });
        el.type = "number";
        el.value = v === undefined ? "" : String(v);
        el.addEventListener("change", () => {
          const n = Number(el.value);
          if (Number.isFinite(n)) on(n);
        });
      };
      num(fr.from, (n) => patch(i, { from: n }));
      box.createSpan({ cls: "ep-pal-dash", text: "-" });
      num(fr.to, (n) => patch(i, { to: n }));
    }

    const fin = box.createEl("select", { cls: "dropdown ep-fin-pick" });
    for (const id of FINISHES) fin.createEl("option", { value: id, text: finishName(i18n, id) });
    fin.value = fr.finish;
    fin.onchange = () => patch(i, { finish: fin.value });

    // How much of it to show. A finish is a material, and how much of a
    // material you see is not the same question as which one it is - a hint
    // of foil on every row of a sheet reads as quality, a sheet of full foil
    // reads as a fairground.
    const dial = box.createEl("input", { cls: "ep-fin-strength" });
    dial.type = "range";
    dial.min = "0";
    dial.max = "150";
    dial.step = "5";
    dial.value = String(fr.strength ?? 100);
    dial.setAttr("aria-label", t("options.finishStrength"));
    const read = box.createSpan({ cls: "ep-fin-strength-read", text: dial.value + "%" });
    dial.setAttr("title", t("options.finishStrength"));
    dial.addEventListener("input", () => {
      read.setText(dial.value + "%");
    });
    dial.addEventListener("change", () => {
      const n = Number(dial.value);
      patch(i, { strength: n === 100 ? undefined : n });
    });
    row.addExtraButton((b) =>
      b.setIcon("x").setTooltip(t("palette.remove")).onClick(() => put(list.filter((_, j) => j !== i)))
    );
  });

  new Setting(rows).setClass("ep-mini-row").addButton((b) =>
    b.setButtonText(t("options.finishAdd")).onClick(() => put([...list, { when: "all", finish: "sheen" }]))
  );
}
