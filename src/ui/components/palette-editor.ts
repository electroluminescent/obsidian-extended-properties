/**
 * The editor for one palette: how a value becomes a colour.
 *
 * Four ways of saying it, and the editor shows only the one in use - a wheel
 * swept across the property's range, stops blended between, bands with edges
 * you can pin to each other, or words with colours of their own. Above them
 * all, a strip of what the palette actually produces, because a list of
 * numbers and hexes tells you nothing about what you will see.
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
import {
  colorAt, defaultWheel, ensureDominance, moveEdge, rangesValid, setDominant,
  type ColorRange, type Palette,
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
    const at = p.mode === "wheel" ? span.min + t * (span.max - span.min) : scaleOf(p, t);
    const c = colorAt(p, at, span);
    stops.push(`${c ?? "transparent"} ${Math.round(t * 100)}%`);
  }
  bar.setCssStyles({ background: `linear-gradient(to right, ${stops.join(", ")})` });
}

/** The value `t` of the way along whatever the palette is spread over. */
function scaleOf(p: Palette, t: number): number {
  const xs =
    p.mode === "points"
      ? (p.points ?? []).map((x) => x.at)
      : (p.ranges ?? []).flatMap((r) => [r.from, r.to]);
  if (!xs.length) return t;
  const min = Math.min(...xs);
  const max = Math.max(...xs);
  return min + t * (max - min || 1);
}

export interface PaletteEditorCtx {
  app: App;
  i18n: I18n;
  colors: ColorHost;
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
    for (const m of ["wheel", "points", "ranges", "semantic"]) dd.addOption(m, t("palette.mode." + m));
    dd.setValue(p.mode);
    dd.onChange((v) => {
      p.mode = v as Palette["mode"];
      if (p.mode === "wheel" && !p.wheel) p.wheel = defaultWheel();
      save();
      ctx.redraw();
    });
  });

  if (p.mode === "wheel") renderWheel(c, p, ctx);
  if (p.mode === "points") renderPoints(c, p, ctx);
  if (p.mode === "ranges") renderRanges(c, p, ctx);
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

/** The stops: a colour pinned to a value, blended between. */
function renderPoints(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const cal = calendarOf(p, ctx);
  const pts = (p.points ??= []);
  new Setting(c).setName(t("palette.points")).setDesc(t("palette.pointsDesc"));
  const rows = c.createDiv({ cls: "ep-mini-list" });
  pts.forEach((pt, i) => {
    const row = new Setting(rows).setClass("ep-mini-row");
    const box = row.controlEl;
    numField(box, pt.at, cal ? "ep-pal-date" : "ep-pal-num", (n) => {
      pt.at = n;
      ctx.save();
      ctx.redraw();
    }, cal);
    swatch(ctx.colors, box, () => pt.color, (v) => {
      pt.color = v;
      ctx.save();
      ctx.redraw();
    });
    row.addExtraButton((b) =>
      b.setIcon("x").setTooltip(t("palette.remove")).onClick(() => {
        pts.splice(i, 1);
        ctx.save();
        ctx.redraw();
      })
    );
  });
  new Setting(rows).setClass("ep-mini-row").addButton((b) =>
    b.setButtonText(t("palette.pointAdd")).onClick(() => {
      const last = pts[pts.length - 1];
      pts.push({ at: last ? last.at + 10 : 0, color: last?.color ?? "#888888" });
      ctx.save();
      ctx.redraw();
    })
  );
}

/** The bands: flat colour between two edges, with the edge rules. */
function renderRanges(c: HTMLElement, p: Palette, ctx: PaletteEditorCtx): void {
  const t = ctx.i18n.t.bind(ctx.i18n);
  const cal = calendarOf(p, ctx);
  // Every shared edge is owned by exactly one band before anything is drawn,
  // so the ticks below can be radios: there is always one to be checked.
  const settled = ensureDominance(p.ranges ??= []);
  if (JSON.stringify(settled) !== JSON.stringify(p.ranges)) {
    p.ranges = settled;
    ctx.save();
  }
  const rs = (p.ranges ??= []);
  new Setting(c).setName(t("palette.ranges")).setDesc(t("palette.rangesDesc"));
  const write = (next: ColorRange[]): void => {
    if (!rangesValid(next)) {
      // The editor refuses an overlap rather than leaving the renderer to
      // guess which band a value belongs to.
      ctx.redraw();
      return;
    }
    p.ranges = ensureDominance(next);
    ctx.save();
    ctx.redraw();
  };
  const rows = c.createDiv({ cls: "ep-mini-list" });
  rs.forEach((r, i) => {
    const row = new Setting(rows).setClass("ep-mini-row");
    const box = row.controlEl;
    edgeBox(box, r, "from", i, p, ctx);
    numField(box, r.from, cal ? "ep-pal-date" : "ep-pal-num", (n) => write(moveEdge(rs, i, "from", n, p.linked === true)), cal);
    box.createSpan({ cls: "ep-pal-dash", text: "-" });
    numField(box, r.to, cal ? "ep-pal-date" : "ep-pal-num", (n) => write(moveEdge(rs, i, "to", n, p.linked === true)), cal);
    edgeBox(box, r, "to", i, p, ctx);
    swatch(ctx.colors, box, () => r.color, (v) => {
      r.color = v;
      ctx.save();
      ctx.redraw();
    });
    row.addExtraButton((b) =>
      b.setIcon("x").setTooltip(t("palette.remove")).onClick(() => write(rs.filter((_, j) => j !== i)))
    );
  });
  new Setting(rows).setClass("ep-mini-row").addButton((b) =>
    b.setButtonText(t("palette.rangeAdd")).onClick(() => {
      const last = rs[rs.length - 1];
      const from = last ? last.to : 0;
      write([...rs, { from, to: from + 10, color: last?.color ?? "#888888" }]);
    })
  );
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
 * The tick that decides which band takes a value sitting on a shared edge.
 *
 * A radio rather than a checkbox, and deliberately: the edges meeting on one
 * number are a single choice with one answer. Unticking the ticked one would
 * leave the value belonging to nobody, so it cannot be done - picking another
 * edge is how you change your mind.
 */
function edgeBox(box: HTMLElement, r: ColorRange, edge: "from" | "to", i: number, p: Palette, ctx: PaletteEditorCtx): void {
  const rs = p.ranges ?? [];
  const at = edge === "from" ? r.from : r.to;
  const shared = rs.some((o, j) => j !== i && (o.from === at || o.to === at));
  if (!shared) return;
  const cb = box.createEl("input", { cls: "ep-pal-dom" });
  cb.type = "radio";
  // One group per meeting point, so the browser itself keeps it to one.
  cb.name = `ep-dom-${p.id}-${at}`;
  cb.checked = (edge === "from" ? r.domFrom : r.domTo) === true;
  cb.setAttr("aria-label", ctx.i18n.t("palette.dominant"));
  cb.setAttr("title", ctx.i18n.t("palette.dominant"));
  cb.onchange = () => {
    p.ranges = setDominant(rs, i, edge, true);
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
