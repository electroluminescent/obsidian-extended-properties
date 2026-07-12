/**
 * Numeric value types: "number" (integers with steppers), "decimal"
 * (floats), and "formula" (a slider whose position maps through a math
 * expression; typing a value solves the formula backwards).
 *
 * Cluster addons (see {@link ClusterAddon}) can attach extra cells - the
 * core modifier system adds its badge/toggles and the rolling module its
 * roll button this way.
 */

import { Menu, setIcon, Setting } from "obsidian";
import type { EntryRenderCtx, EntryRef, OptionsCtx } from "../../../core/context";
import type { ClusterNeeds, ValueTypeDef } from "../../../core/registry";
import { compileFormula, invertFormula } from "../../../utils/formula";
import { clamp, fmtNum } from "../../../utils/misc";
import { sfx } from "../../../utils/sound";
import { shouldClamp, clampToConstraints } from "../../../core/validate";
import { applyValidity } from "../validity";
import { addonsFor, mergeNeeds, emptyFlags } from "../cluster";
import { TextPromptModal } from "../../modals/dialogs";
import { addIconSetting } from "../../components/setting-helpers";

type NumericKind = "number" | "decimal" | "formula";

/** Range fallbacks per kind (legacy behavior). */
function defaultRange(kind: NumericKind): { min: number; max: number } {
  if (kind === "formula") return { min: 0, max: 10 };
  if (kind === "decimal") return { min: 0, max: 1 };
  return { min: -9999, max: 99999 };
}

/** Whether the entry shows -/+ steppers (number/decimal, not opted out). */
function wantSteppers(kind: NumericKind, entry: { steppers?: boolean }): boolean {
  return (kind === "number" || kind === "decimal") && entry.steppers !== false;
}

/** Slider response curve: normalized position [0,1] -> normalized value. */
function curveMap(curve: string | undefined, t: number): number {
  if (curve === "root") return Math.sqrt(Math.max(0, t));
  if (curve === "exp") return t * t;
  return t;
}

/** Inverse of {@link curveMap}: normalized value -> slider position. */
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
  // Unit conversion (absorbed from the legacy unit type): the note stores
  // the canonical number; the value displays and edits multiplied by the
  // per-entry factor. Sliders, ratings and rolls keep the raw domain.
  const factor = Number(entry.unitFactor) > 0 ? Number(entry.unitFactor) : 1;

  // Let applicable addons fill their slots.
  const addons = addonsFor(ctx);
  const slots: Record<string, (cell: HTMLElement) => void> = {};
  for (const a of addons) Object.assign(slots, a.fillSlots(ctx, { get, label }));

  const refs = view.buildCluster(ctx.head, ctx.flags, {
    get: () => get() * factor,
    display: fmtNum(get() * factor),
    steppers: wantSteppers(kind, entry),
    min: min * factor,
    max: max * factor,
    float: isDecimal || isFormula || factor !== 1,
    clamp: !!entry.clamp,
    commit: (v) => {
      const raw = v / factor;
      view.note.set(file, key, shouldClamp(entry.constraints) ? clampToConstraints(raw, entry.constraints) : raw);
    },
    slots,
  });
  if (entry.valueColor) refs.val.setCssStyles({ color: entry.valueColor });
  if (entry.valueSize) refs.val.setCssStyles({ fontSize: entry.valueSize + "px" });

  // Optional unit suffix, rendered as a muted tag right after the value
  // (same `entry.unit` field the dedicated unit value type uses). Every
  // place that rewrites the value text re-appends it via setVal.
  const unit = ((entry.unit as string) ?? "").trim();
  const setVal = (v: number): void => {
    refs.val.setText(fmtNum(v * factor));
    if (unit) refs.val.createSpan({ cls: "ep-unit-hint", text: unit });
  };
  if (unit || factor !== 1) setVal(get());

  // Optional slider (always present for formula entries). The slider
  // position maps through the configured curve (linear / root / exp);
  // formula entries map through their expression instead.
  const curve = entry.sliderCurve;
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
  // Custom, scroll-safe slider. When idle the track collapses to a small pill
  // around the knob and ONLY the knob is interactive, so a touch anywhere else
  // on the row scrolls the page. Pressing the knob expands the track to full
  // width for dragging; releasing collapses it back around the new position.
  let syncKnob: (() => void) | null = null;
  if ((entry.rating as boolean) && !isFormula) {
    // Icon rating (absorbed from the legacy rating type): the alternative to
    // the slider. The icon count is the entry's MAX (the same slider range
    // settings); negative values (allowed by a negative min) fill red. The
    // strip is CONTAINED like the slider - icons wrap to new rows instead of
    // clipping past the entry - and can balance those rows evenly.
    const icon = (entry.ratingIcon as string) || "star";
    const balance = !!entry.ratingBalance;
    const align = (entry.ratingAlign as string) || "left";
    const emax = Number(entry.max);
    const count = Math.min(1000, Math.max(1, Math.round(Number.isFinite(emax) ? emax : 5)));
    const kmin = Math.round(entry.min ?? 0);
    const strip = ctx.extra.createDiv({ cls: "ep-rating ep-rating-strip ep-ralign-" + align });
    if (entry.ratingFill) strip.addClass("ep-rating-fill");
    if (entry.valueColor) strip.setCssStyles({ color: entry.valueColor });
    // Balanced mode: rows = what the width forces, icons split evenly across
    // them (12 icons with room for 10 = 6 + 6, not 10 + 2). Flex row breaks
    // are recomputed from measurements whenever the strip resizes.
    const layoutBreaks = (): void => {
      if (!strip.isConnected) return;
      strip.findAll(".ep-rating-break").forEach((b) => b.remove());
      if (!balance) return;
      const pips = strip.findAll(".ep-rating-pip");
      if (!pips.length) return;
      const gap = 2;
      const w = strip.clientWidth;
      const pw = pips[0].offsetWidth || 1;
      const fit = Math.max(1, Math.floor((w + gap) / (pw + gap)));
      if (fit >= pips.length) return;
      const rows = Math.ceil(pips.length / fit);
      const per = Math.ceil(pips.length / rows);
      for (let i = per; i < pips.length; i += per) {
        const br = createSpan({ cls: "ep-rating-break" });
        strip.insertBefore(br, pips[i]);
      }
    };
    const ro = new ResizeObserver(() => {
      if (!strip.isConnected) {
        ro.disconnect();
        return;
      }
      window.requestAnimationFrame(layoutBreaks);
    });
    ro.observe(strip);
    strip.setAttr("role", "slider");
    strip.tabIndex = 0;
    strip.setAttr("aria-label", view.defaultLabelFor(entry));
    strip.setAttr("aria-valuemin", String(kmin));
    strip.setAttr("aria-valuemax", String(count));
    const setRating = (n: number): void => {
      view.note.set(file, key, clamp(Math.round(n), kmin, count));
    };
    // A negative Minimum adds its own icons LEFT of the positives (number
    // line order); the icon for -k fills red once the value reaches -k.
    // There is no zero icon: zero is every icon clicked off.
    const negCount = Math.max(0, -kmin);
    const drawRating = (): void => {
      strip.empty();
      const cur = Math.round(get());
      strip.setAttr("aria-valuenow", String(cur));
      // The divider pip (the one squeezed by the vertical line) sits on
      // whichever side of zero the value is NOT: at 2 the -1 icon shrinks,
      // at -1 the +1 icon does. Redrawn per value change, so it follows.
      const divideOnNeg = cur >= 0;
      for (let k = negCount; k >= 1; k--) {
        const kk = k;
        const pip = strip.createSpan({
          cls: "ep-rating-pip pip-neg" + (cur <= -kk ? " is-on is-neg" : "") + (kk === 1 && divideOnNeg ? " pip-negend" : ""),
        });
        setIcon(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          sfx.tick();
          // Clicking the current magnitude steps back toward zero.
          setRating(cur === -kk ? -(kk - 1) : -kk);
        };
      }
      const fill = Math.min(Math.max(cur, 0), count);
      for (let i = 1; i <= count; i++) {
        const pip = strip.createSpan({
          cls: "ep-rating-pip" + (i <= fill ? " is-on" : "") +
            (i === 1 && negCount > 0 && !divideOnNeg ? " pip-posend" : ""),
        });
        setIcon(pip, icon);
        pip.setAttr("aria-hidden", "true");
        pip.onclick = (e2) => {
          e2.preventDefault();
          e2.stopPropagation();
          sfx.tick();
          // Click the current highest pip to toggle down one.
          setRating(i === cur ? i - 1 : i);
        };
      }
      window.requestAnimationFrame(layoutBreaks);
    };
    drawRating();
    strip.addEventListener("keydown", (e2: KeyboardEvent) => {
      const cur = Math.round(get());
      let n = cur;
      if (e2.key === "ArrowRight" || e2.key === "ArrowUp") n = cur + 1;
      else if (e2.key === "ArrowLeft" || e2.key === "ArrowDown") n = cur - 1;
      else if (e2.key === "Home") n = kmin;
      else if (e2.key === "End") n = count;
      else return;
      e2.preventDefault();
      sfx.tick();
      setRating(n);
    });
    view.registerUpdater(drawRating);
  } else if (entry.slider || isFormula) {
    const slider = ctx.extra.createDiv({ cls: "ep-slider2" });
    slider.createDiv({ cls: "ep-slider2-track" });
    const knob = slider.createDiv({ cls: "ep-slider2-knob" });
    knob.tabIndex = 0;
    knob.setAttr("role", "slider");
    knob.setAttr("aria-valuemin", String(min));
    knob.setAttr("aria-valuemax", String(max));

    const fmt = (v: number): number => (isDecimal || isFormula ? v : Math.round(v));
    const pctForValue = (v: number): number => (span <= 0 ? 0 : clamp((toPosition(v) - min) / span, 0, 1) * 100);
    const place = (v: number): void => {
      slider.setCssProps({ "--ep-knob": pctForValue(v) + "%" });
      knob.setAttr("aria-valuenow", String(fmt(v)));
    };
    syncKnob = () => place(get());
    syncKnob();

    let active = false;
    let pending = get();
    const drag = (clientX: number): void => {
      const r = slider.getBoundingClientRect();
      const t = r.width <= 0 ? 0 : clamp((clientX - r.left) / r.width, 0, 1);
      let out = toValue(min + t * span);
      if (!isFormula && entry.clamp) out = clamp(out, min, max);
      pending = fmt(out);
      place(pending); // knob snaps to the (rounded) value's position
      setVal(pending);
      for (const a of addons) a.onPreview?.(ctx, refs.cells, pending);
    };
    knob.addEventListener("pointerdown", (e) => {
      active = true;
      pending = get();
      slider.addClass("is-active");
      try { knob.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
      e.preventDefault();
      e.stopPropagation();
    });
    knob.addEventListener("pointermove", (e) => {
      if (!active) return;
      drag(e.clientX);
      e.preventDefault();
    });
    const finish = (e: PointerEvent): void => {
      if (!active) return;
      active = false;
      slider.removeClass("is-active");
      try { knob.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      view.note.set(file, key, shouldClamp(entry.constraints) ? clampToConstraints(pending, entry.constraints) : pending);
      sfx.tick();
      syncKnob?.();
    };
    knob.addEventListener("pointerup", finish);
    knob.addEventListener("pointercancel", () => {
      if (!active) return;
      active = false;
      slider.removeClass("is-active");
      syncKnob?.(); // discard the in-progress drag
    });
    knob.addEventListener("keydown", (e) => {
      const step = kind === "number" && !curve ? 1 : span / 100 || 1;
      let v = get();
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step;
      else if (e.key === "ArrowRight" || e.key === "ArrowUp") v += step;
      else return;
      e.preventDefault();
      if (entry.clamp) v = clamp(v, min, max);
      view.note.set(file, key, fmt(v));
    });
  }

  const checkValid = () => applyValidity(refs.val, entry, kind, view.note.raw[key], view.i18n);
  checkValid();
  view.registerUpdater(() => {
    const v = view.note.num(key, 0);
    setVal(v);
    syncKnob?.();
    checkValid();
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
      if (v) entry.rating = undefined; // the rating is the slider's alternative
      changed();
      octx.redraw();
    });
  });
  if (kind === "number" || kind === "decimal") {
    new Setting(c)
      .setName(t("options.ratingToggle"))
      .setDesc(t("options.ratingToggleDesc"))
      .addToggle((tg) => {
        tg.setValue(!!entry.rating).onChange((v) => {
          entry.rating = v || undefined;
          if (v) {
            entry.slider = undefined;
            if (entry.max === undefined) entry.max = 5; // the icon count
          }
          changed();
          octx.redraw();
        });
      });
    if (entry.rating) {
      addIconSetting(view.app, view.i18n, c, t("options.ratingIcon"),
        () => (entry.ratingIcon as string) || "star",
        (v) => {
          entry.ratingIcon = v;
          changed();
        });
      new Setting(c)
        .setName(t("options.ratingBalance"))
        .setDesc(t("options.ratingBalanceDesc"))
        .addToggle((tg) => {
          tg.setValue(!!entry.ratingBalance).onChange((v) => {
            entry.ratingBalance = v || undefined;
            changed();
          });
        });
      new Setting(c)
        .setName(t("options.ratingFill"))
        .setDesc(t("options.ratingFillDesc"))
        .addToggle((tg) => {
          tg.setValue(!!entry.ratingFill).onChange((v) => {
            entry.ratingFill = v || undefined;
            changed();
          });
        });
      new Setting(c).setName(t("options.ratingAlign")).addDropdown((d) => {
        d.addOption("left", t("options.alignLeft"));
        d.addOption("center", t("options.alignCenter"));
        d.addOption("right", t("options.alignRight"));
        d.addOption("space", t("options.alignSpace"));
        d.setValue((entry.ratingAlign as string) || "left");
        d.onChange((v) => {
          entry.ratingAlign = v === "left" ? undefined : (v as typeof entry.ratingAlign);
          changed();
        });
      });
    }
  }
  if (kind === "number" || kind === "decimal") {
    new Setting(c).setName(t("options.showSteppers")).addToggle((tg) => {
      tg.setValue(entry.steppers !== false).onChange((v) => {
        entry.steppers = v ? undefined : false;
        changed();
      });
    });
    // Unit suffix + display factor (the legacy unit type, absorbed): the
    // note stores the canonical number; the value shows value x factor
    // with the suffix beside it.
    new Setting(c)
      .setName(t("options.unit"))
      .setDesc(t("options.unitDesc"))
      .addText((tx) => {
        tx.setValue((entry.unit as string) ?? "").onChange((v) => {
          entry.unit = v.trim() || undefined;
          changed();
        });
      });
    new Setting(c)
      .setName(t("options.unitFactor"))
      .setDesc(t("options.unitFactorDesc"))
      .addText((tx) => {
        tx.setPlaceholder("1");
        tx.setValue(entry.unitFactor !== undefined ? String(entry.unitFactor) : "").onChange((v) => {
          const n = Number(v);
          entry.unitFactor = v.trim() !== "" && Number.isFinite(n) && n > 0 && n !== 1 ? n : undefined;
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
  // Addons (modifiers, rolling, ...) append their own rows. Deliberately not
  // filtered by `appliesTo`: an addon that doesn't apply *yet* must still be
  // able to offer the option that enables it (each one guards itself).
  for (const a of octx.view.registries.clusterAddons.all()) a.renderOptions?.(octx);
}

/** Context-menu "Edit value..." honoring integer/clamp rules. */
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
