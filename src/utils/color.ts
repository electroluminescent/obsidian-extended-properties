/**
 * Color math used by the color value type and the color picker modal.
 *
 * All conversions operate on sRGB in the 0–255 range. OKLab/OKLCH conversions
 * go through linear-light sRGB and can produce out-of-gamut values; use
 * {@link inGamutLin} to detect those (the picker renders them translucent).
 */

import { clamp } from "./misc";

export type ColorSpace = "RGB" | "HSL" | "OKLCH" | "OKLab";

export const COLOR_SPACES: ColorSpace[] = ["RGB", "HSL", "OKLCH", "OKLab"];

export interface Rgb { r: number; g: number; b: number }

/** Parse `#rgb` / `#rrggbb` (leading `#` optional). Returns null when invalid. */
export function hexToRgb(hex: string): Rgb | null {
  let h = (hex || "").trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

/** Serialize RGB (clamped) to a `#rrggbb` string. */
export function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

/** sRGB channel (0–255) → linear light (0–1). */
function srgbToLin(c: number): number {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear light (0–1) → sRGB channel (0–255, clamped). */
function linToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
  return clamp(v * 255, 0, 255);
}

export interface LinRgb { lr: number; lg: number; lb: number }

export function rgbToOklab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  const lr = srgbToLin(r), lg = srgbToLin(g), lb = srgbToLin(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

export function oklabToLin(L: number, a: number, b: number): LinRgb {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return {
    lr: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    lg: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    lb: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  };
}

export function oklabToRgb(L: number, a: number, b: number): Rgb {
  const c = oklabToLin(L, a, b);
  return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) };
}

export function rgbToOklch(r: number, g: number, b: number): { L: number; C: number; H: number } {
  const o = rgbToOklab(r, g, b);
  const C = Math.sqrt(o.a * o.a + o.b * o.b);
  let H = (Math.atan2(o.b, o.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: o.L, C, H };
}

export function oklchToLin(L: number, C: number, H: number): LinRgb {
  const hr = (H * Math.PI) / 180;
  return oklabToLin(L, C * Math.cos(hr), C * Math.sin(hr));
}

export function oklchToRgb(L: number, C: number, H: number): Rgb {
  const c = oklchToLin(L, C, H);
  return { r: linToSrgb(c.lr), g: linToSrgb(c.lg), b: linToSrgb(c.lb) };
}

/** Whether a linear-light color sits inside the sRGB gamut (small tolerance). */
export function inGamutLin(c: LinRgb): boolean {
  const e = 0.0015;
  return c.lr >= -e && c.lr <= 1 + e && c.lg >= -e && c.lg <= 1 + e && c.lb >= -e && c.lb <= 1 + e;
}

/**
 * Build a CSS `linear-gradient` by sampling a color ramp.
 * Out-of-gamut samples are rendered translucent so slider tracks can show
 * which parts of an OKLCH/OKLab axis are unreachable in sRGB.
 */
export function gradientStops(samples: number, at: (t: number) => { rgb: Rgb; oog: boolean }): string {
  const stops: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const { rgb, oog } = at(t);
    const pct = Math.round(t * 100);
    const r = Math.round(rgb.r), g = Math.round(rgb.g), b = Math.round(rgb.b);
    stops.push((oog ? `rgba(${r},${g},${b},0.15)` : `rgb(${r},${g},${b})`) + ` ${pct}%`);
  }
  return `linear-gradient(to right, ${stops.join(", ")})`;
}
