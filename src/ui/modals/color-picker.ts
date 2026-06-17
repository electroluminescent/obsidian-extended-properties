/**
 * Multi-space color picker (RGB / HSL / OKLCH / OKLab).
 *
 * Each space renders gradient sliders per channel; HSL and OKLab add a 2D
 * canvas field. OKLCH/OKLab tracks dim out-of-gamut regions. The chosen
 * space persists as the user's default. Saves a `#rrggbb` hex string.
 */

import { Modal, setIcon, Setting } from "obsidian";
import {
  COLOR_SPACES, ColorSpace, Rgb,
  gradientStops, hexToRgb, hslToRgb, inGamutLin,
  oklabToLin, oklabToRgb, oklchToLin, oklchToRgb,
  rgbToHex, rgbToHsl, rgbToOklab, rgbToOklch,
} from "../../utils/color";
import { clamp } from "../../utils/misc";
import type { ColorHost } from "../components/setting-helpers";
import { asMobileSheet } from "../components/long-press";

/** Long channel names for slider tooltips, keyed by i18n suffix. */
const CHANNEL_NAMES: Record<string, string> = {
  R: "colorPicker.red", G: "colorPicker.green", B: "colorPicker.blue",
  H: "colorPicker.hue", S: "colorPicker.saturation", L: "colorPicker.lightness",
  C: "colorPicker.chroma", a: "colorPicker.labA", b: "colorPicker.labB",
};

export class ColorPickerModal extends Modal {
  private rgb: Rgb;
  private space: ColorSpace;
  private preview!: HTMLElement;
  private hexInput!: HTMLInputElement;
  private body!: HTMLElement;
  private lastIdx?: number;
  private lastBodyH?: number;

  constructor(private host: ColorHost, initial: string, private onSubmit: (hex: string) => void) {
    super(host.app);
    this.rgb = hexToRgb(initial) ?? { r: 136, g: 136, b: 136 };
    this.space = host.getColorSpace();
  }

  onOpen(): void {
    asMobileSheet(this);
    const { contentEl } = this;
    const t = this.host.i18n.t.bind(this.host.i18n);
    contentEl.addClass("ep-colorpicker");
    contentEl.createEl("h3", { text: t("colorPicker.title") });

    const tabs = contentEl.createDiv({ cls: "ep-cp-tabs" });
    for (const sp of COLOR_SPACES) {
      const b = tabs.createEl("button", { cls: "ep-mode-btn", text: sp });
      if (sp === this.space) b.addClass("is-active");
      b.onclick = () => {
        this.space = sp;
        this.host.setColorSpace(sp);
        tabs.querySelectorAll("button").forEach((x) => x.removeClass("is-active"));
        b.addClass("is-active");
        this.renderContent();
      };
    }

    const bar = contentEl.createDiv({ cls: "ep-cp-bar" });
    this.preview = bar.createDiv({ cls: "ep-cp-preview" });
    if ((window as any).EyeDropper) {
      const ed = bar.createEl("button", { cls: "ep-icon-btn" });
      setIcon(ed, "pipette");
      ed.setAttr("title", t("colorPicker.eyedropper"));
      ed.onclick = async () => {
        try {
          const c = await new (window as any).EyeDropper().open();
          const rgb = hexToRgb(c.sRGBHex);
          if (rgb) {
            this.rgb = rgb;
            this.updatePreviewHex();
            this.renderContent();
          }
        } catch {
          /* user cancelled */
        }
      };
    }
    this.hexInput = bar.createEl("input");
    this.hexInput.type = "text";
    this.hexInput.addClass("ep-edit-input");
    this.hexInput.onchange = () => {
      const c = hexToRgb(this.hexInput.value);
      if (c) {
        this.rgb = c;
        this.updatePreviewHex();
        this.renderContent();
      }
    };

    this.body = contentEl.createDiv({ cls: "ep-cp-body" });
    this.updatePreviewHex();
    this.renderContent();

    new Setting(contentEl)
      .addButton((b) => b.setButtonText(t("common.cancel")).onClick(() => this.close()))
      .addButton((b) =>
        b.setButtonText(t("common.save")).setCta().onClick(() => {
          this.onSubmit(rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b));
          this.close();
        })
      );
  }

  private updatePreviewHex(): void {
    const hex = rgbToHex(this.rgb.r, this.rgb.g, this.rgb.b);
    this.preview.style.background = hex;
    if (this.hexInput) this.hexInput.value = hex;
  }

  /** One labelled gradient slider with a numeric input. */
  private gslider(
    parent: HTMLElement,
    label: string,
    min: number,
    max: number,
    step: number,
    val: number,
    grad: () => string,
    onInput: (v: number) => void
  ): { update: () => void; setValue: (v: number) => void } {
    const row = parent.createDiv({ cls: "ep-cp-channel" });
    const lbl = row.createSpan({ cls: "ep-cp-label", text: label });
    const nameKey = CHANNEL_NAMES[label];
    if (nameKey) lbl.setAttr("title", this.host.i18n.t(nameKey));
    const sw = row.createDiv({ cls: "ep-gslider" });
    const track = sw.createDiv({ cls: "ep-gtrack" });
    const thumb = sw.createDiv({ cls: "ep-gthumb" });
    const num = row.createEl("input");
    num.type = "number";
    num.min = String(min);
    num.max = String(max);
    num.step = String(step);
    num.value = String(Math.round(val * 1000) / 1000);
    num.addClass("ep-edit-input");

    let cur = val;
    const place = () => {
      const t = max > min ? (cur - min) / (max - min) : 0;
      thumb.style.left = clamp(t, 0, 1) * 100 + "%";
    };
    const update = () => {
      track.style.background = grad();
    };
    const setVal = (v: number, fire: boolean) => {
      cur = clamp(v, min, max);
      num.value = String(Math.round(cur * 1000) / 1000);
      place();
      if (fire) onInput(cur);
    };
    const fromX = (clientX: number) => {
      const r = sw.getBoundingClientRect();
      const tt = clamp((clientX - r.left) / r.width, 0, 1);
      let v = min + tt * (max - min);
      if (step) v = Math.round(v / step) * step;
      setVal(v, true);
    };
    sw.addEventListener("pointerdown", (e: PointerEvent) => {
      sw.setPointerCapture(e.pointerId);
      fromX(e.clientX);
    });
    sw.addEventListener("pointermove", (e: PointerEvent) => {
      if (e.buttons) fromX(e.clientX);
    });
    num.addEventListener("change", () => setVal(Number(num.value), true));
    update();
    place();
    return { update, setValue: (v: number) => setVal(v, false) };
  }

  /** A 2D canvas field (e.g. saturation × lightness) with a draggable cursor. */
  private buildField(
    parent: HTMLElement,
    colorAt: (x: number, y: number) => Rgb,
    getXY: () => [number, number],
    setXY: (x: number, y: number) => void
  ): { paint: () => void; place: () => void } {
    const wrap = parent.createDiv({ cls: "ep-cp-field-wrap" });
    const canvas = wrap.createEl("canvas");
    canvas.width = 200;
    canvas.height = 170;
    canvas.addClass("ep-cp-field");
    const cursor = wrap.createDiv({ cls: "ep-cp-cursor" });
    const paint = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width, h = canvas.height;
      const img = ctx.createImageData(w, h);
      const d = img.data;
      for (let py = 0; py < h; py++) {
        const yy = py / (h - 1);
        for (let px = 0; px < w; px++) {
          const xx = px / (w - 1);
          const c = colorAt(xx, yy);
          const i = (py * w + px) * 4;
          d[i] = clamp(c.r, 0, 255);
          d[i + 1] = clamp(c.g, 0, 255);
          d[i + 2] = clamp(c.b, 0, 255);
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };
    const place = () => {
      const [x, y] = getXY();
      cursor.style.left = x * 100 + "%";
      cursor.style.top = y * 100 + "%";
    };
    const fromEv = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      setXY(clamp((e.clientX - r.left) / r.width, 0, 1), clamp((e.clientY - r.top) / r.height, 0, 1));
      place();
    };
    canvas.addEventListener("pointerdown", (e) => {
      canvas.setPointerCapture(e.pointerId);
      fromEv(e);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (e.buttons) fromEv(e);
    });
    paint();
    place();
    return { paint, place };
  }

  /** Rebuild the slider area for the active color space (with slide animation). */
  private renderContent(): void {
    const idx = COLOR_SPACES.indexOf(this.space);
    const dir = this.lastIdx === undefined ? 0 : idx > this.lastIdx ? 1 : idx < this.lastIdx ? -1 : 0;
    this.lastIdx = idx;
    this.body.empty();
    this.body.removeClass("ep-slide-r");
    this.body.removeClass("ep-slide-l");
    void this.body.offsetWidth;
    if (dir > 0) this.body.addClass("ep-slide-r");
    else if (dir < 0) this.body.addClass("ep-slide-l");

    const sliders: { update: () => void }[] = [];
    const refresh = () => {
      this.updatePreviewHex();
      sliders.forEach((s) => s.update());
    };

    if (this.space === "RGB") {
      const ch = { ...this.rgb };
      sliders.push(this.gslider(this.body, "R", 0, 255, 1, ch.r,
        () => gradientStops(16, (t) => ({ rgb: { r: t * 255, g: ch.g, b: ch.b }, oog: false })),
        (v) => { ch.r = v; this.rgb = { ...ch }; refresh(); }));
      sliders.push(this.gslider(this.body, "G", 0, 255, 1, ch.g,
        () => gradientStops(16, (t) => ({ rgb: { r: ch.r, g: t * 255, b: ch.b }, oog: false })),
        (v) => { ch.g = v; this.rgb = { ...ch }; refresh(); }));
      sliders.push(this.gslider(this.body, "B", 0, 255, 1, ch.b,
        () => gradientStops(16, (t) => ({ rgb: { r: ch.r, g: ch.g, b: t * 255 }, oog: false })),
        (v) => { ch.b = v; this.rgb = { ...ch }; refresh(); }));
    } else if (this.space === "HSL") {
      const ch = rgbToHsl(this.rgb.r, this.rgb.g, this.rgb.b);
      let field: { paint: () => void; place: () => void } | null = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" });
      const left = two.createDiv({ cls: "ep-cp-left" });
      const right = two.createDiv({ cls: "ep-cp-right" });
      const hS = this.gslider(right, "H", 0, 360, 1, ch.h,
        () => gradientStops(48, (t) => ({ rgb: hslToRgb(t * 360, ch.s, ch.l), oog: false })),
        (v) => { ch.h = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.paint(); refresh(); });
      const sS = this.gslider(right, "S", 0, 100, 1, ch.s,
        () => gradientStops(28, (t) => ({ rgb: hslToRgb(ch.h, t * 100, ch.l), oog: false })),
        (v) => { ch.s = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.place(); refresh(); });
      const lS = this.gslider(right, "L", 0, 100, 1, ch.l,
        () => gradientStops(28, (t) => ({ rgb: hslToRgb(ch.h, ch.s, t * 100), oog: false })),
        (v) => { ch.l = v; this.rgb = hslToRgb(ch.h, ch.s, ch.l); field?.place(); refresh(); });
      sliders.push(hS, sS, lS);
      field = this.buildField(left,
        (x, y) => hslToRgb(ch.h, x * 100, (1 - y) * 100),
        () => [ch.s / 100, 1 - ch.l / 100],
        (x, y) => {
          ch.s = x * 100;
          ch.l = (1 - y) * 100;
          this.rgb = hslToRgb(ch.h, ch.s, ch.l);
          sS.setValue(ch.s);
          lS.setValue(ch.l);
          refresh();
        });
    } else if (this.space === "OKLCH") {
      const ch = rgbToOklch(this.rgb.r, this.rgb.g, this.rgb.b);
      sliders.push(this.gslider(this.body, "L", 0, 1, 0.001, ch.L,
        () => gradientStops(56, (t) => ({ rgb: oklchToRgb(t, ch.C, ch.H), oog: !inGamutLin(oklchToLin(t, ch.C, ch.H)) })),
        (v) => { ch.L = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
      sliders.push(this.gslider(this.body, "C", 0, 0.4, 0.001, ch.C,
        () => gradientStops(56, (t) => ({ rgb: oklchToRgb(ch.L, t * 0.4, ch.H), oog: !inGamutLin(oklchToLin(ch.L, t * 0.4, ch.H)) })),
        (v) => { ch.C = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
      sliders.push(this.gslider(this.body, "H", 0, 360, 1, ch.H,
        () => gradientStops(64, (t) => ({ rgb: oklchToRgb(ch.L, ch.C, t * 360), oog: !inGamutLin(oklchToLin(ch.L, ch.C, t * 360)) })),
        (v) => { ch.H = v; this.rgb = oklchToRgb(ch.L, ch.C, ch.H); refresh(); }));
    } else {
      const ch = rgbToOklab(this.rgb.r, this.rgb.g, this.rgb.b);
      let field: { paint: () => void; place: () => void } | null = null;
      const two = this.body.createDiv({ cls: "ep-cp-2col" });
      const left = two.createDiv({ cls: "ep-cp-left" });
      const right = two.createDiv({ cls: "ep-cp-right" });
      const lS = this.gslider(right, "L", 0, 1, 0.001, ch.L,
        () => gradientStops(56, (t) => ({ rgb: oklabToRgb(t, ch.a, ch.b), oog: !inGamutLin(oklabToLin(t, ch.a, ch.b)) })),
        (v) => { ch.L = v; this.rgb = oklabToRgb(ch.L, ch.a, ch.b); field?.paint(); refresh(); });
      sliders.push(lS);
      field = this.buildField(left,
        (x, y) => oklabToRgb(ch.L, x * 0.8 - 0.4, (1 - y) * 0.8 - 0.4),
        () => [(ch.a + 0.4) / 0.8, 1 - (ch.b + 0.4) / 0.8],
        (x, y) => {
          ch.a = x * 0.8 - 0.4;
          ch.b = (1 - y) * 0.8 - 0.4;
          this.rgb = oklabToRgb(ch.L, ch.a, ch.b);
          refresh();
        });
    }

    // Animate height differences between spaces.
    const newH = this.body.scrollHeight;
    if (this.lastBodyH !== undefined && this.lastBodyH !== newH) {
      this.body.style.height = this.lastBodyH + "px";
      void this.body.offsetWidth;
      this.body.style.height = newH + "px";
      const done = () => {
        this.body.style.height = "auto";
        this.body.removeEventListener("transitionend", done);
      };
      this.body.addEventListener("transitionend", done);
    }
    this.lastBodyH = newH;
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
