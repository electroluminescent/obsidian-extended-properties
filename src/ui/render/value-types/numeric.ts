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

/** Whether the entry shows −/+ steppers (number/decimal, not opted out). */
function wantSteppers(kind: NumericKind, entry: { steppers?: boolean }): boolean {
  return (kind === "number" || kind === "decimal") && entry.steppers !== false;
}

/** Slider response curve: normalized position [0,1] → normalized value. */
function curveMap(curve: string | undefined, t: number): number {
  if (curve === "root") return Math.sqrt(Math.max(0, t));
  if (curve === "exp") return t * t;
  return t;
}

/** Inverse of {@link curveMap}: normalized value → slider position. */
function curveInvert(curve: string | undefined, u: number): number {
  const c = Math.min(1, Math.max(0, u));
  if (curve === "root") return c * c;
  if (curve === "exp") return Math.sqrt(c);
  return c;
}

/**
 * Effective range: explicit min/max win; unset sides default to the
 * property's smallest/largest value across all notes, then to the
 * per-kind fallbacks.
 */
function effectiveRange(
  kind: NumericKind,
  entry: { min?: number; max?: number },
  vault: { min: number; max: number } | null
): { min: number; max: number } {
  const range = defaultRange(kind);
  let min = entry.min ?? vault?.min ?? range.min;
  let max = entry.max ?? vault?.max ?? range.max;
  if (max <= min) {
    // Degenerate (e.g. only one note uses the property): fall back.
    min = entry.min ?? range.min;
    max = entry.max ?? range.max;
  }
  return { min, max };
}

/** Cluster needs = steppers (number/decimal) + whatever addons request. */
function clusterNeeds(kind: NumericKind, ref: EntryRef): ClusterNeeds {
  const flags = emptyFlags();
  if (wantSteppers(kind, ref.entry)) flags.steppers = true;
  for (const a of addonsFor(ref)) mergeNeeds(flags, a.needs(ref));
  return { steppers: flags.steppers, before: flags.before, after: flags.after };
}

function render(kind: NumericKind, ctx: EntryRenderCtx): void {
  const { view, file, entry } = ctx;
  const key = entry.key as string;
  const isFormula = kind === "formula";
  const isDecimal = kind === "decimal";
  const vault = entry.min === undefined || entry.max === undefined ? view.props.numberRange(key) : null;
  const { min, max } = effectiveRange(kind, entry, vault);
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
    steppers: wantSteppers(kind, entry),
    min,
    max,
    float: isDecimal || isFormula,
    clamp: !!entry.clamp,
    commit: (v) => view.note.set(file, key, v),
    slots,
  });
  if (entry.valueColor) refs.val.style.color = entry.valueColor;
  if (entry.valueSize) refs.val.style.fontSize = entry.valueSize + "px";

  // Optional slider (always present for formula entries). The slider
  // position maps through the configured curve (linear / root / exp);
  // formula entries map through their expression instead.
  const curve = entry.sliderCurve as string | undefined;
  const span = max - min;
  const toValue = (x: number): number => {
    if (isFormula && f) return f(x);
    if (span <= 0) return x;
    return min + span * curveMap(curve, (x - min) / span);
  };
  const toPosition = (v: number): number => {
    if (isFormula && f) return invertFormula(f, v, min, max);
    if (span <= 0) return v;
    return min + span * curveInvert(curve, (v - min) / span);
  };
  let slider: HTMLInputElement | null = null;
  if (entry.slider || isFormula) {
    slider = ctx.extra.createEl("input", { cls: "ep-slider" });
    slider.type = "range";
    slider.min = String(min);
    slider.max = String(max);
    slider.step = kind === "number" && !curve ? "1" : "any";
    slider.value = String(toPosition(get()));
    // Scroll guard (mobile): decide the gesture axis from its first few pixels.
    // A vertical-dominant drag is a page scroll — the value is pinned (reset on
    // every native `input`, so the thumb can't follow the finger) and never
    // committed. Only a horizontal-dominant drag adjusts the slider.
    let dragValue = slider.value;
    let sx = 0;
    let sy = 0;
    let axis: "" | "v" | "h" = "";
    const begin = (x: number, y: number): void => {
      dragValue = slider!.value;
      sx = x;
      sy = y;
      axis = "";
    };
    const decide = (x: number, y: number): void => {
      if (axis) return;
      const dx = Math.abs(x - sx);
      const dy = Math.abs(y - sy);
      if (dx < 6 && dy < 6) return; // not enough movement to tell yet
      axis = dy > dx ? "v" : "h";
      if (axis === "v" && slider) slider.value = dragValue; // pin immediately
    };
    slider.addEventListener("pointerdown", (e) => begin(e.clientX, e.clientY));
    slider.addEventListener("pointermove", (e) => decide(e.clientX, e.clientY));
    slider.addEventListener("touchstart", (e) => { const t = e.touches[0]; if (t) begin(t.clientX, t.clientY); }, { passive: true });
    slider.addEventListener("touchmove", (e) => { const t = e.touches[0]; if (t) decide(t.clientX, t.clientY); }, { passive: true });
    slider.addEventListener("pointercancel", () => { axis = "v"; if (slider) slider.value = dragValue; });
    slider.addEventListener("input", () => {
      if (axis === "v") { if (slider) slider.value = dragValue; return; } // pinned while scrolling
      const out = toValue(Number(slider!.value));
      refs.val.setText(fmtNum(isDecimal || isFormula ? out : Math.round(out)));
      for (const a of addons) a.onPreview?.(ctx, refs.cells, out);
    });
    slider.addEventListener("change", () => {
      if (axis === "v") { axis = ""; if (slider) slider.value = dragValue; return; }
      axis = "";
      let out = toValue(Number(slider!.value));
      if (!isFormula && entry.clamp) out = clamp(out, min, max);
      view.note.set(file, key, isDecimal || isFormula ? out : Math.round(out));
    });
  }

  view.registerUpdater(() => {
    const v = view.note.num(key, 0);
    refs.val.setText(fmtNum(v));
    if (slider) slider.value = String(toPosition(v));
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
  if (kind === "number" || kind === "decimal") {
    new Setting(c).setName(t("options.showSteppers")).addToggle((tg) => {
      tg.setValue(entry.steppers !== false).onChange((v) => {
        entry.steppers = v ? undefined : false;
        changed();
      });
    });
  }
  new Setting(c).setName(t("options.sliderCurve")).addDropdown((d) => {
    d.addOption("linear", t("options.curveLinear"));
    d.addOption("root", t("options.curveRoot"));
    d.addOption("exp", t("options.curveExp"));
    d.setValue((entry.sliderCurve as string) || "linear");
    d.onChange((v) => {
      entry.sliderCurve = v === "linear" ? undefined : v;
      changed();
    });
  });
  new Setting(c)
    .setName(t("options.minimum"))
    .setDesc(t("options.rangeAuto"))
    .addText((tx) => {
      tx.setValue(entry.min !== undefined ? String(entry.min) : "").onChange((v) => {
        const n = Number(v);
        entry.min = v.trim() === "" || !Number.isFinite(n) ? undefined : n;
        changed();
      });
    });
  new Setting(c)
    .setName(t("options.maximum"))
    .setDesc(t("options.rangeAuto"))
    .addText((tx) => {
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
