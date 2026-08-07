/**
 * Pure geometry for the inline charts (roadmap G2).
 *
 * These functions turn numeric series into SVG coordinates - a sparkline path,
 * bar rectangles, radar points, a progress fraction. They are deliberately
 * Obsidian- and DOM-free so the maths is unit-tested directly; the thin DOM
 * renderer in `ui/render/charts.ts` turns the output into `<svg>` elements.
 */

export interface Extent {
  min: number;
  max: number;
}

/** Min/max of a series, with safe fallbacks for empty or flat input. */
export function extent(values: number[]): Extent {
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (Number.isFinite(v)) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  if (!Number.isFinite(min)) return { min: 0, max: 1 };
  if (min === max) return { min: min - 1, max: max + 1 }; // flat: center the line
  return { min, max };
}

/** SVG path `d` for a sparkline of `values` over a `w`x`h` box (top-left origin). */
export function sparklinePath(values: number[], w: number, h: number, pad = 1): string {
  if (values.length === 0) return "";
  const { min, max } = extent(values);
  const n = values.length;
  const span = max - min;
  const x = (i: number) => (n === 1 ? w / 2 : pad + (i * (w - 2 * pad)) / (n - 1));
  const y = (v: number) => h - pad - ((v - min) / span) * (h - 2 * pad);
  let d = "";
  values.forEach((v, i) => {
    d += (i === 0 ? "M" : "L") + x(i).toFixed(2) + " " + y(v).toFixed(2) + (i < n - 1 ? " " : "");
  });
  return d;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Bar rectangles for `values` over a `w`x`h` box, scaled to the largest value
 * (which therefore fills the height). Negative values clamp to a zero-height
 * bar; bars grow up from the baseline.
 */
export function barLayout(values: number[], w: number, h: number, gap = 1): Rect[] {
  const n = values.length;
  if (n === 0) return [];
  const peak = Math.max(0, ...values.map((v) => (Number.isFinite(v) ? v : 0)));
  const base = peak <= 0 ? 1 : peak;
  const bw = Math.max(0, (w - gap * (n - 1)) / n);
  return values.map((v, i) => {
    const bh = Math.max(0, (Math.max(Number.isFinite(v) ? v : 0, 0) / base) * h);
    return { x: i * (bw + gap), y: h - bh, w: bw, h: bh };
  });
}

/**
 * The same bars lying down: one row per value, each growing rightwards from
 * the left edge. It is {@link barLayout} over a box turned on its side, with
 * the rectangles turned back - so both directions share one piece of
 * arithmetic and cannot drift apart.
 */
export function barLayoutH(values: number[], w: number, h: number, gap = 1): Rect[] {
  return barLayout(values, h, w, gap).map((r) => ({ x: 0, y: r.x, w: r.h, h: r.w }));
}

export interface Pt {
  x: number;
  y: number;
}

/**
 * Points for an N-axis radar: axis `i` starts at the top and goes clockwise;
 * each value's radius is `(v/max)` of `r`, clamped to `[0,1]`.
 */
export function radarPoints(values: number[], max: number, cx: number, cy: number, r: number): Pt[] {
  const n = values.length;
  return values.map((v, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const frac = max > 0 && Number.isFinite(v) ? Math.max(0, Math.min(1, v / max)) : 0;
    return { x: cx + frac * r * Math.cos(ang), y: cy + frac * r * Math.sin(ang) };
  });
}

/** The outer ring (all axes at full radius) for an N-axis radar. */
export function ringPoints(n: number, cx: number, cy: number, r: number): Pt[] {
  return radarPoints(new Array<number>(n).fill(1), 1, cx, cy, r);
}

/** `"x,y x,y ..."` for an SVG `<polygon points>` / `<polyline>`. */
export function pointsAttr(pts: Pt[]): string {
  return pts.map((p) => p.x.toFixed(2) + "," + p.y.toFixed(2)).join(" ");
}

/**
 * Roughly how wide `text` draws at font size `fs`, in the same units as the
 * chart's geometry. SVG cannot be measured before it is in the document, and a
 * label only needs to know whether it will fit - half a character either way
 * changes nothing.
 */
export function textWidth(text: string, fs: number): number {
  return text.length * fs * 0.55;
}

/** `text` cut down until it fits `max` units at `fs`, with an ellipsis for what went. */
export function fitText(text: string, max: number, fs: number): string {
  if (max <= 0) return "";
  if (textWidth(text, fs) <= max) return text;
  const room = Math.floor(max / (fs * 0.55)) - 1;
  return room > 0 ? text.slice(0, room) + "…" : "";
}

/** Fraction of `max` filled by `value`, clamped to `[0,1]` (0 when max <= 0). */
export function clampFrac(value: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value / max));
}
