/**
 * The editor for one palette: how a value becomes a colour.
 *
 * Three ways of saying it, and the editor shows only the one in use - a wheel
 * swept across the property's range, a scale of stops and bands, or words
 * with colours of their own. Above them all, a strip of what the palette
 * actually produces, because a list of numbers and hexes tells you nothing
 * about what you will see.
 *
 * The scale is drawn as two columns that happen to line up: the numbers on
 * the left, the colours on the right. They are stored apart and can be moved
 * apart - dragging a colour past its neighbours slides them out of its way -
 * because deciding where a step sits and deciding what colour it wears are
 * two different jobs, usually done at different times.
 *
 * Kept out of the settings tab so the same editor can be opened from a
 * property later without the tab in between.
 */

import { App, Setting, setIcon } from "obsidian";
import type { I18n } from "../../i18n/i18n";
import { ColorPickerModal } from "../modals/color-picker";
import type { ColorHost } from "./setting-helpers";
import { hexToRgb } from "../../utils/color";
import type { DateConfig } from "../../core/calendar";
import { formatEdge, parseEdge } from "../../utils/palette-date";
import { renderFinishRules } from "./finish-rules";
import {
  colorAt, defaultWheel, edgeContested, ensureDominance, insertStep, midpointBlend, moveColor,
  moveEdge, positionalBlend, removeStep, setDominant, stepsValid,
  type Palette, type ScaleStep,
} from "../../utils/palette";

/** How many samples the preview strip draws. */
const PREVIEW_STEPS = 48;

/** A compact colour button: the swatch is the picker. */
function swatch(host: ColorHost, row: HTMLElement, get: () => string, set: (v: string) => void): void {
  const sw = row.createSpan({ cls: "ep-swatch ep-pal-swatch" });
  const paint = (): void => {
    const v = get();
    sw.setCssStyles({ background: hexToRgb(v) ? v : "transparent" });
    sw.toggleClass("ep-swatch-empty", !hexToRgb(v));
  };
  paint();
  sw.setAttr("role", "button");
  sw.tabIndex = 0;
  const open = (): void =>
    new ColorPickerModal(host, get() || "#888888", (hex) => {
      set(hex);
      paint();
    }).open();
  sw.onclick = open;
  sw.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  };
}

/**
 * An edge of the scale: a number, or - where the palette is written over a
 * calendar - a date in that property's own format, stored as the integer
 * behind it.
 */
function numField(
  row: HTMLElement,
  value: number | undefined,
  cls: string,
  on: (n: number) => void,
  cal?: DateConfig
): HTMLInputElement {
  const input = row.createEl("input", { cls: "ep-edit-input " + cls });
  if (cal) {
    input.type = "text";
    input.value = formatEdge(value, cal);
    input.placeholder = cal.format;
    input.addEventListener("change", () => {
      const n = parseEdge(input.value, cal);
      if (n !== undefined) on(n);
    });
    return input;
  }
  input.type = "number";
  input.value = value === undefined || !Number.isFinite(value) ? "" : String(value);
  input.addEventListener("change", () => {
    const n = Number(input.value);
    if (Number.isFinite(n)) on(n);
  });
  return input;
}

/** What the palette gives across the stretch it covers, drawn as a strip. */
function preview(host: HTMLElement, p: Palette): void {
  const bar = host.createDiv({ cls: "ep-pal-preview" });
  const span = { min: 0, max: 100 };
  const stops: string[] = [];
  for (let i = 0; i <= PREVIEW_STEPS; i++) {
    const t = i / PREVIEW_STEPS;
    // Bands and stops are read on their own scale; the wheel on 0-100.
    const at = p.mode === "wheel" ? span.min + t * (span.max - span.min) : valueAt(p, t);
    const c = colorAt(p, at, span);
    stops.push(`${c ?? "transparent"} ${Math.round(t * 100)}%`);
  }
  bar.setCssStyles({ background: `linear-gradient(to right, ${stops.join(", ")})` });
}

/** The value `t` of the way along whatever the palette is spread over. */
function valueAt(p: Palette, t: number): number {
  const xs = (p.steps ?? []).flatMap((r) => [r.from, r.to]);
  if (!xs.length) return t;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  return min + t * (max - min || 1);
}

export interface PaletteEditorCtx {
  app: App;
  i18n: I18n;
  colors: ColorHost;
  /**
   * The colours are somebody else's - a property borrowing its palette's
   * while writing a scale of its own. They are shown, since a scale with no
   * colours beside it is a column of numbers, but not touched.
   */
  colorsReadOnly?: boolean;
  /** Persist and redraw. */
  save: () => void;
  /** Rebuild the editor (a mode change swaps every control below it). */
  redraw: () => void;
  /** The date properties a palette can borrow a calendar from. */
  dateProps?: () => { key: string; cfg: DateConfig }[];
}

/** The calendar this palette writes its edges in, if it writes dates. */
function calendarOf(p: Palette, ctx: PaletteEditorCtx): DateConfig | undefined {
  if (p.scale !== "date") return undefined;
  const all = ctx.dateProps?.() ?? [];
  return all.find((d) => d.key === (p.dateProp ?? "").toLowerCase())?.cfg ?? all[0]?.cfg;
}

/** Draw the whole editor for `p` into `c`. */
export function renderPaletteEditor(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const save = ctx.save;
  preview(c, p);

  new Setting(c).setName(t("palette.mode")).setDesc(t("palette.modeDesc")).addDropdown((dd) => {
    for (const m of ["wheel", "bands", "semantic"]) dd.addOption(m, t("palette.mode." + m));
    dd.setValue(p.mode);
    dd.onChange((v) => {
      p.mode = v as Palette["mode"];
      if (p.mode === "wheel" && !p.wheel) p.wheel = defaultWheel();
      save();
      ctx.redraw();
    });
  });

  if (p.mode === "wheel") renderWheel(c, p, ctx);
  if (p.mode === "bands") renderScale(c, p, ctx);
  const dates = ctx.dateProps?.() ?? [];
  if (dates.length && p.mode !== "semantic") {
    new Setting(c).setName(t("palette.scale")).setDesc(t("palette.scaleDesc")).addDropdown((dd) => {
      dd.addOption("", t("palette.scale.number"));
      for (const d of dates) dd.addOption(d.key, t("palette.scale.date", { key: d.key }));
      dd.setValue(p.scale === "date" ? p.dateProp ?? dates[0].key : "");
      dd.onChange((v) => {
        p.scale = v ? "date" : undefined;
        p.dateProp = v || undefined;
        ctx.save();
        ctx.redraw();
      });
    });
  }
  if (p.mode !== "wheel") {
    new Setting(c).setName(t("palette.arc")).setDesc(t("palette.arcDesc")).addDropdown((dd) => {
      dd.addOption("short", t("palette.arc.short"));
      dd.addOption("long", t("palette.arc.long"));
      dd.setValue(p.arc ?? "short");
      dd.onChange((v) => {
        p.arc = v === "long" ? "long" : undefined;
        save();
        ctx.redraw();
      });
    });
  }
  renderWords(c, p, ctx);
  renderFinishes(c, p, ctx);
}

/**
 * What a value wearing this palette is MADE of.
 *
 * Kept with the palette rather than only on the property, because a palette
 * is a look and a look is a colour and a material both: point a property at
 * "Threat" and it should arrive foiled without anybody saying so again. A
 * property may still name its own, and then it wears those instead.
 */
function renderFinishes(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  new Setting(c).setName(t("palette.finishes")).setDesc(t("palette.finishesDesc"));
  renderFinishRules(c, ctx.i18n, p.finishes ?? [], (next) => {
    p.finishes = next.length ? next : undefined;
    ctx.save();
    ctx.redraw();
  });
}

/** The wheel: where the sweep starts, how far it goes, and how it looks. */
function renderWheel(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const w = (p.wheel ??= defaultWheel());
  const slider = (name: string, desc: string, min: number, max: number, step: number, get: () => number, set: (n: number) => void) =>
    new Setting(c).setName(name).setDesc(desc).addSlider((sl) => {
      sl.setLimits(min, max, step)
        .setValue(get())
        .setDynamicTooltip()
        .onChange((v) => {
          set(v);
          ctx.save();
          ctx.redraw();
        });
    });
  slider(t("palette.wheelStart"), t("palette.wheelStartDesc"), 0, 360, 1, () => w.start, (v) => (w.start = v));
  slider(t("palette.wheelSpread"), t("palette.wheelSpreadDesc"), 0, 720, 5, () => w.spread, (v) => (w.spread = v));
  slider(t("palette.wheelLight"), t("palette.wheelLightDesc"), 20, 95, 1, () => Math.round(w.lightness * 100), (v) => (w.lightness = v / 100));
  slider(t("palette.wheelChroma"), t("palette.wheelChromaDesc"), 0, 37, 1, () => Math.round(w.chroma * 100), (v) => (w.chroma = v / 100));
  new Setting(c).setName(t("palette.wheelReverse")).setDesc(t("palette.wheelReverseDesc")).addToggle((tg) => {
    tg.setValue(w.reverse === true).onChange((v) => {
      w.reverse = v || undefined;
      ctx.save();
      ctx.redraw();
    });
  });
}

/**
 * The scale: stops and bands down one column, the colours they wear down the
 * other.
 *
 * Written as a plain grid rather than as `Setting` rows, because the colours
 * have to be able to move past each other: a dragged colour slides its
 * neighbours out of its way, which needs cells that can be transformed
 * independently of the numbers beside them.
 */
export function renderScale(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const cal = calendarOf(p, ctx);
  // Every shared edge is owned by exactly one band before anything is drawn,
  // so the ticks below can be radios: there is always one to be checked.
  const settled = ensureDominance((p.steps ??= []));
  if (JSON.stringify(settled) !== JSON.stringify(p.steps)) {
    p.steps = settled;
    ctx.save();
  }
  const steps = (p.steps ??= []);
  const colors = (p.colors ??= []);
  // A colour for every step, whatever the data arrived looking like.
  while (colors.length < steps.length) colors.push("#888888");
  new Setting(c).setName(t("palette.scaleName")).setDesc(t("palette.scaleDesc2"));

  /** Write the steps back, refusing a layout the renderer could not read. */
  const write = (next: ScaleStep[]): void => {
    if (!stepsValid(next)) {
      // The editor refuses an overlap rather than leaving the renderer to
      // guess which band a value belongs to.
      ctx.redraw();
      return;
    }
    p.steps = ensureDominance(next);
    ctx.save();
    ctx.redraw();
  };
  const put = (both: { steps: ScaleStep[]; colors: string[] }): void => {
    p.steps = both.steps;
    p.colors = both.colors;
    ctx.save();
    ctx.redraw();
  };

  const grid = c.createDiv({ cls: "ep-scale" });
  /** The colour cells, in order - the drag needs to see all of them. */
  const cells: HTMLElement[] = [];

  /** The two buttons that put a new step in at `at`. */
  const insertBar = (at: number): void => {
    const bar = grid.createDiv({ cls: "ep-scale-ins" });
    const add = (kind: "point" | "band", label: string, tip: string): void => {
      const b = bar.createEl("button", { cls: "ep-scale-add", text: label });
      b.setAttr("aria-label", tip);
      b.setAttr("title", tip);
      b.onclick = () => put(insertStep(steps, colors, at, kind, p.arc ?? "short"));
    };
    add("point", t("palette.addPoint"), t("palette.addPointTip"));
    add("band", t("palette.addBand"), t("palette.addBandTip"));
  };

  insertBar(0);
  steps.forEach((r, i) => {
    const row = grid.createDiv({ cls: "ep-scale-row" });
    const vals = row.createDiv({ cls: "ep-scale-vals" });
    vals.createSpan({ cls: "ep-scale-kind", text: r.point ? t("palette.point") : t("palette.band") });
    if (r.point) {
      numField(vals, r.from, cal ? "ep-pal-date" : "ep-pal-num", (n) => write(moveEdge(steps, i, "from", n, false)), cal);
    } else {
      edgeBox(vals, r, "from", i, p, ctx);
      numField(vals, r.from, cal ? "ep-pal-date" : "ep-pal-num", (n) => write(moveEdge(steps, i, "from", n, p.linked === true)), cal);
      vals.createSpan({ cls: "ep-pal-dash", text: "-" });
      numField(vals, r.to, cal ? "ep-pal-date" : "ep-pal-num", (n) => write(moveEdge(steps, i, "to", n, p.linked === true)), cal);
      edgeBox(vals, r, "to", i, p, ctx);
    }
    iconButton(vals, "x", t("palette.remove"), () => put(removeStep(steps, colors, i)));

    const cell = row.createDiv({ cls: "ep-scale-color" });
    cells.push(cell);
    if (ctx.colorsReadOnly) {
      // Borrowed, so shown and not touched: which colour a step wears is the
      // palette's business, and where the step sits is this property's.
      const sw = cell.createSpan({ cls: "ep-swatch ep-pal-swatch ep-scale-borrowed" });
      const c2 = colors[i] ?? "";
      sw.setCssStyles({ background: hexToRgb(c2) ? c2 : "transparent" });
      sw.toggleClass("ep-swatch-empty", !hexToRgb(c2));
      sw.setAttr("title", t("palette.colorBorrowed"));
      insertBar(i + 1);
      return;
    }
    const grip = cell.createSpan({ cls: "ep-scale-grip", text: "::" });
    grip.setAttr("aria-label", t("palette.colorMove"));
    grip.setAttr("title", t("palette.colorMove"));
    grip.tabIndex = 0;
    swatch(ctx.colors, cell, () => colors[i] ?? "#888888", (v) => {
      colors[i] = v;
      ctx.save();
      ctx.redraw();
    });
    const blend = (icon: string, tip: string, calc: () => string | undefined): void =>
      void iconButton(cell, icon, tip, () => {
        const v = calc();
        if (!v) return;
        colors[i] = v;
        ctx.save();
        ctx.redraw();
      });
    blend("equal", t("palette.blendMid"), () => midpointBlend(colors, i, p.arc ?? "short"));
    blend("move-horizontal", t("palette.blendPos"), () => positionalBlend(steps, colors, i, p.arc ?? "short"));
    wireColorDrag(grip, cells, i, (to) => {
      p.colors = moveColor(colors, i, to);
      ctx.save();
      ctx.redraw();
    });
    grip.onkeydown = (e) => {
      const by = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      if (!by) return;
      e.preventDefault();
      p.colors = moveColor(colors, i, i + by);
      ctx.save();
      ctx.redraw();
    };
    insertBar(i + 1);
  });

  new Setting(c).setName(t("palette.units")).setDesc(t("palette.unitsDesc")).addDropdown((dd) => {
    dd.addOption("value", t("palette.units.value"));
    dd.addOption("percent", t("palette.units.percent"));
    dd.setValue(p.relative ? "percent" : "value");
    dd.onChange((v) => {
      p.relative = v === "percent" ? true : undefined;
      ctx.save();
      ctx.redraw();
    });
  });
  new Setting(c).setName(t("palette.linked")).setDesc(t("palette.linkedDesc")).addToggle((tg) => {
    tg.setValue(p.linked === true).onChange((v) => {
      p.linked = v || undefined;
      ctx.save();
    });
  });
  new Setting(c).setName(t("palette.outside")).setDesc(t("palette.outsideDesc")).addDropdown((dd) => {
    dd.addOption("none", t("palette.outside.none"));
    dd.addOption("clamp", t("palette.outside.clamp"));
    dd.setValue(p.outside ?? "none");
    dd.onChange((v) => {
      p.outside = v === "clamp" ? "clamp" : undefined;
      ctx.save();
      ctx.redraw();
    });
  });
  new Setting(c).setName(t("palette.gaps")).setDesc(t("palette.gapsDesc")).addDropdown((dd) => {
    dd.addOption("none", t("palette.gaps.none"));
    dd.addOption("blend", t("palette.gaps.blend"));
    dd.setValue(p.gaps ?? "none");
    dd.onChange((v) => {
      p.gaps = v === "blend" ? "blend" : undefined;
      ctx.save();
      ctx.redraw();
    });
  });
}

/**
 * Drag one colour up or down the column.
 *
 * The cells are moved by transform while the pointer is down - the ones being
 * passed slide into the space the dragged cell leaves - and nothing is
 * written until it is let go, so a drag that ends up where it started costs
 * nothing. Where it lands is decided by which cell's middle is nearest, so
 * the rows do not have to be the same height.
 */
function wireColorDrag(
  grip: HTMLElement,
  cells: HTMLElement[],
  index: number,
  commit: (to: number) => void
): void {
  grip.addEventListener("pointerdown", (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const startY = e.clientY;
    const mids = cells.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    const me = cells[index];
    if (!me) return;
    let to = index;
    me.addClass("is-dragging");
    try { grip.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    const move = (ev: PointerEvent): void => {
      const dy = ev.clientY - startY;
      const here = mids[index] + dy;
      let best = index;
      let bestGap = Infinity;
      mids.forEach((m, j) => {
        const gap = Math.abs(m - here);
        if (gap < bestGap) {
          bestGap = gap;
          best = j;
        }
      });
      to = best;
      me.setCssStyles({ transform: `translateY(${dy}px)` });
      cells.forEach((el, j) => {
        if (j === index) return;
        const passed = to > index ? j > index && j <= to : j < index && j >= to;
        const shift = passed ? mids[to > index ? j - 1 : j + 1] - mids[j] : 0;
        el.setCssStyles({ transform: shift ? `translateY(${shift}px)` : "" });
      });
    };
    const end = (ev: PointerEvent): void => {
      grip.removeEventListener("pointermove", move);
      grip.removeEventListener("pointerup", end);
      grip.removeEventListener("pointercancel", end);
      try { grip.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      me.removeClass("is-dragging");
      for (const el of cells) el.setCssStyles({ transform: "" });
      if (to !== index) commit(to);
    };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  });
}

/**
 * The tick that decides which band takes a value sitting on a shared edge.
 *
 * A radio rather than a checkbox, and deliberately: the edges meeting on one
 * number are a single choice with one answer. Unticking the ticked one would
 * leave the value belonging to nobody, so it cannot be done - picking another
 * edge is how you change your mind. An edge with a stop standing on it is not
 * offered at all: the stop names that value outright, and nothing a band says
 * about its own edge can outrank that.
 */
function edgeBox(box: HTMLElement, r: ScaleStep, edge: "from" | "to", i: number, p: Palette, ctx: PaletteEditorCtx): void {
  const steps = p.steps ?? [];
  if (!edgeContested(steps, i, edge)) return;
  const at = edge === "from" ? r.from : r.to;
  const cb = box.createEl("input", { cls: "ep-pal-dom" });
  cb.type = "radio";
  // One group per meeting point, so the browser itself keeps it to one.
  cb.name = `ep-dom-${p.id}-${at}`;
  cb.checked = (edge === "from" ? r.domFrom : r.domTo) === true;
  cb.setAttr("aria-label", ctx.i18n.t("palette.dominant"));
  cb.setAttr("title", ctx.i18n.t("palette.dominant"));
  cb.onchange = () => {
    p.steps = setDominant(steps, i, edge, true);
    ctx.save();
    ctx.redraw();
  };
}

/** Words with colours of their own - the first place a text value looks. */
function renderWords(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const words = (p.words ??= []);
  new Setting(c).setName(t("palette.words")).setDesc(t("palette.wordsDesc"));
  const rows = c.createDiv({ cls: "ep-mini-list" });
  words.forEach((w, i) => {
    const row = new Setting(rows).setClass("ep-mini-row");
    const box = row.controlEl;
    const input = box.createEl("input", { cls: "ep-edit-input ep-pal-word" });
    input.type = "text";
    input.value = w.word;
    input.addEventListener("change", () => {
      w.word = input.value.trim();
      ctx.save();
    });
    swatch(ctx.colors, box, () => w.color, (v) => {
      w.color = v;
      ctx.save();
    });
    row.addExtraButton((b) =>
      b.setIcon("x").setTooltip(t("palette.remove")).onClick(() => {
        words.splice(i, 1);
        ctx.save();
        ctx.redraw();
      })
    );
  });
  new Setting(rows).setClass("ep-mini-row").addButton((b) =>
    b.setButtonText(t("palette.wordAdd")).onClick(() => {
      words.push({ word: "", color: "#888888" });
      ctx.save();
      ctx.redraw();
    })
  );
  if (p.mode === "semantic")
    new Setting(c).setName(t("palette.fallback")).setDesc(t("palette.fallbackDesc")).addDropdown((dd) => {
      dd.addOption("none", t("palette.fallback.none"));
      dd.addOption("hash", t("palette.fallback.hash"));
      dd.setValue(p.fallback === "hash" ? "hash" : "none");
      dd.onChange((v) => {
        p.fallback = v === "hash" ? "hash" : undefined;
        ctx.save();
      });
    });
}

/** A small icon button, for the palette list's own controls. */
export function iconButton(host: HTMLElement, icon: string, label: string, on: () => void): HTMLElement {
  const b = host.createSpan({ cls: "ep-icon-btn" });
  setIcon(b, icon);
  b.setAttr("aria-label", label);
  b.setAttr("title", label);
  b.tabIndex = 0;
  b.onclick = on;
  b.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      on();
    }
  };
  return b;
}
