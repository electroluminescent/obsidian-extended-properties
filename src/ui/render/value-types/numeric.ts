/**
 * Numeric value types: "number" (integers with steppers), "decimal"
 * (floats), and "formula" (a slider whose position maps through a math
 * expression; typing a value solves the formula backwards).
 *
 * Cluster addons (see {@link ClusterAddon}) can attach extra cells — the
 * core modifier system adds its badge/toggles and the rolling module its
 * roll button this way.
 */

import { Menu, Setting } from "obsidian";
import type { EntryRenderCtx, EntryRef, OptionsCtx } from "../../../core/context";
import type { ClusterNeeds, ValueTypeDef } from "../../../core/registry";
import { compileFormula, invertFormula } from "../../../utils/formula";
import { clamp, fmtNum } from "../../../utils/misc";
import { addonsFor, mergeNeeds, emptyFlags } from "../cluster";
import { TextPromptModal } from "../../modals/dialogs";

type NumericKind = "number" | "decimal" | "formula";

/** Range fallbacks per kind (legacy behavior). */
function defaultRange(kind: NumericKind): { min: number; max: number } {
  if (kind === "formula") return { min: 0, max: 10 };
  if (kind === "decimal") return { min: 0, max: 1 };
  return { min: -9999, max: 99999 };
}

/** Cluster needs = steppers (number/decimal) + whatever addons request. */
function clusterNeeds(kind: NumericKind, ref: EntryRef): ClusterNeeds {
  const flags = emptyFlags();
  if (kind === "number" || kind === "decimal") flags.steppers = true;
  for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
  return { steppers: flags.steppers, before: flags.before, after: flags.after };
}

function render(kind: NumericKind, ctx: EntryRenderCtx): void {
  const { view, file, entry } = ctx;
  const key = entry.key as string;
  const isFormula = kind === "formula";
  const isDecimal = kind === "decimal";
  const range = defaultRange(kind);
  const min = entry.min ?? range.min;
  const max = entry.max ?? range.max;
  const label = entry.alias ?? key;
  const f = isFormula ? compileFormula(entry.formula || "x") || ((x: number) => x) : null;
  const get = () => view.note.num(key, 0);

  // Let applicable addons fill their slots.
  const addons = addonsFor(ctx);
  const slots: Record<string, (cell: HTMLElement) => void> = {};
  for (const a of addons) Object.assign(slots, a.fillSlots(ctx, { get, label }));

  const refs = view.buildCluster(ctx.head, ctx.flags, {
    get,
    display: fmtNum(get()),
    steppers: kind === "number" || kind === "decimal",
    min,
    max,
    float: isDecimal || isFormula,
    clamp: !!entry.clamp,
    commit: (v) => view.note.set(file, key, v),
    slots,
  });
  if (entry.valueColor) refs.val.style.color = entry.valueColor;
  if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";

  // Optional slider (always present for formula entries).
  let slider: HTMLInputElement | null = null;
  if (entry.slider || isFormula) {
    slider = ctx.extra.createEl("input", { cls: "ep-slider" });
    slider.type = "range";
    slider.min = String(min);
    slider.max = String(max);
    slider.step = kind === "number" ? "1" : "any";
    slider.value = String(isFormula && f ? invertFormula(f, get(), min, max) : get());
    slider.addEventListener("input", () => {
      const x = Number(slider!.value);
      const out = isFormula && f ? f(x) : x;
      refs.val.setText(fmtNum(out));
      for (const a of addons) a.onPreview?.(ctx, refs.cells, out);
    });
    slider.addEventListener("change", () => {
      const x = Number(slider!.value);
      const out = isFormula && f ? f(x) : entry.clamp ? clamp(x, min, max) : x;
      view.note.set(file, key, isDecimal || isFormula ? out : Math.round(out));
    });
  }

  view.registerUpdater(() => {
    const v = view.note.num(key, 0);
    refs.val.setText(fmtNum(v));
    if (slider) slider.value = String(isFormula && f ? invertFormula(f, v, min, max) : v);
  });
}

/** Shared options UI (slider, range, clamp; formula gets its expression box). */
function renderOptions(kind: NumericKind, octx: OptionsCtx): void {
  const { view, entry, container: c, changed } = octx;
  const t = view.i18n.t.bind(view.i18n);
  c.createEl("h4", { text: t("options.numberHeading") });
  new Setting(c).setName(t("options.showSlider")).addToggle((tg) => {
    tg.setValue(!!entry.slider).onChange((v) => {
      entry.slider = v || undefined;
      changed();
    });
  });
  new Setting(c).setName(t("options.minimum")).addText((tx) => {
    tx.setValue(entry.min !== undefined ? String(entry.min) : "").onChange((v) => {
      const n = Number(v);
      entry.min = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
      changed();
    });
  });
  new Setting(c).setName(t("options.maximum")).addText((tx) => {
    tx.setValue(entry.max !== undefined ? String(entry.max) : "").onChange((v) => {
      const n = Number(v);
      entry.max = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
      changed();
    });
  });
  new Setting(c).setName(t("options.clamp")).addToggle((tg) => {
    tg.setValue(!!entry.clamp).onChange((v) => {
      entry.clamp = v || undefined;
      changed();
    });
  });
  if (kind === "formula") {
    new Setting(c)
      .setName(t("options.formula"))
      .setDesc(t("options.formulaDesc"))
      .addText((tx) => {
        tx.setValue((entry.formula as string) ?? "x").onChange((v) => {
          if (v.trim() && !compileFormula(v.trim())) return;
          entry.formula = v.trim() || undefined;
          changed();
        });
      });
  }
  // Addons (modifiers, rolling, …) append their own rows. Deliberately not
  // filtered by `appliesTo`: an addon that doesn't apply *yet* must still be
  // able to offer the option that enables it (each one guards itself).
  for (const a of octx.view.registries.clusterAddons.all()) a.renderOptions?.(octx);
}

/** Context-menu "Edit value…" honoring integer/clamp rules. */
function menuItems(kind: NumericKind, menu: Menu, ref: EntryRef): void {
  const { view, file, entry } = ref;
  const key = entry.key as string;
  const float = kind === "decimal" || kind === "formula";
  menu.addItem((i) =>
    i.setTitle(view.i18n.t("entry.menu.editValue")).setIcon("pencil").onClick(() =>
      new TextPromptModal(
        view.app,
        view.i18n,
        view.i18n.t("prompt.editValue", { name: (entry.alias as string) || key }),
        view.note.str(key),
        (v) => {
          let n = Number(v);
          if (!Number.isFinite(n)) return;
          if (!float) n = Math.round(n);
          if (entry.clamp && entry.min !== undefined && entry.max !== undefined)
            n = clamp(n, entry.min, entry.max);
          view.note.set(file, key, n);
        }
      ).open()
    )
  );
}

function makeNumericType(kind: NumericKind, nameKey: string): ValueTypeDef {
  return {
    id: kind,
    name: (i18n) => i18n.t(nameKey),
    render: (ctx) => render(kind, ctx),
    clusterNeeds: (ref) => clusterNeeds(kind, ref),
    renderOptions: (octx) => renderOptions(kind, octx),
    menuItems: (menu, ref) => menuItems(kind, menu, ref),
  };
}

export const numberType = makeNumericType("number", "type.number");
export const decimalType = makeNumericType("decimal", "type.decimal");
export const formulaType = makeNumericType("formula", "type.formula");

/** Shared by the entry renderer to know which types are numeric. */
export const NUMERIC_TYPE_IDS = ["number", "decimal", "formula"];
