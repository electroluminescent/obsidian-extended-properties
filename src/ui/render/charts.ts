/**
 * SVG renderers for the inline charts (roadmap G2).
 *
 * Thin DOM layer over the pure geometry in `utils/chart.ts`. Built with
 * `createElementNS` (no `innerHTML`), themed entirely through `--ep-*` CSS
 * classes, and accessible: every chart is `role="img"` with an `aria-label`
 * and a visually-hidden text fallback listing the data.
 *
 * Every chart takes the box it is drawn into. A chart given more room draws
 * its geometry at that size rather than being stretched to it: bars keep their
 * gaps and corners, a line keeps its weight, a bar keeps its round ends. The
 * default box is the one line of text these started life as.
 *
 * Charts can also name what they show: axis labels (the property behind each
 * value) and value labels (the number itself). Labels take their room out of
 * the box before the geometry is worked out, so nothing is drawn over, and a
 * label too long for the space it has is cut short rather than overlapping its
 * neighbour.
 */

import {
  barLayout, barLayoutH, clampFrac, fitText, pointsAttr, radarPoints, ringPoints, sparklinePath, textWidth,
} from "../../utils/chart";
import { fmtNum } from "../../utils/misc";

const NS = "http://www.w3.org/2000/svg";

/** The box a chart is drawn into, in the units its geometry is worked out in. */
export interface ChartBox {
  w: number;
  h: number;
}

/** What a chart may say about the values it draws. */
export interface ChartLabels {
  /** The property behind each value, in order. */
  labels?: string[];
  /** Name each value's axis. */
  axis?: boolean;
  /** Print the values themselves. */
  nums?: boolean;
}

/** What each chart is drawn at when nobody has given it a size. */
const DEFAULTS: Record<string, ChartBox> = {
  spark: { w: 64, h: 16 },
  bar: { w: 64, h: 16 },
  radar: { w: 64, h: 64 },
  progress: { w: 64, h: 10 },
};

/** The box to draw `kind` in: what was asked for, else its usual size. */
export function chartBox(kind: string, box?: ChartBox): ChartBox {
  const def = DEFAULTS[kind] ?? DEFAULTS.spark;
  const w = Math.round(box?.w ?? 0);
  const h = Math.round(box?.h ?? 0);
  return { w: w > 0 ? w : def.w, h: h > 0 ? h : def.h };
}

/** Label size for a box: legible on a big chart, unobtrusive on a small one. */
function labelSize(box: ChartBox): number {
  return Math.max(5, Math.min(13, Math.min(box.h * 0.28, box.w * 0.09)));
}

function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = activeDocument.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}

interface TextOpts {
  x: number;
  y: number;
  fs: number;
  cls: string;
  anchor?: "start" | "middle" | "end";
}

/** One piece of chart text, positioned by its baseline. */
function label(svg: SVGElement, text: string, o: TextOpts): void {
  if (!text) return;
  const t = svgEl("text", {
    x: o.x,
    y: o.y,
    class: o.cls,
    "font-size": o.fs,
    "text-anchor": o.anchor ?? "middle",
  });
  t.textContent = text;
  svg.appendChild(t);
}

/** Create the `<svg>` frame + a screen-reader-only text fallback. */
function frame(parent: HTMLElement, w: number, h: number, aria: string): SVGElement {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${w} ${h}`,
    class: "ep-chart-svg",
    role: "img",
    "aria-label": aria,
    preserveAspectRatio: "xMidYMid meet",
  });
  parent.appendChild(svg);
  parent.createSpan({ cls: "ep-sr-only", text: aria });
  return svg;
}

/** The name for value `i`, or "" where none was given. */
const nameAt = (o: ChartLabels, i: number): string => (o.axis ? (o.labels?.[i] ?? "") : "");

export function renderSparkline(
  parent: HTMLElement,
  values: number[],
  opts: { aria: string; box?: ChartBox } & ChartLabels
): void {
  const box = chartBox("spark", opts.box);
  const { w } = box;
  const fs = labelSize(box);
  const top = opts.nums ? fs * 1.3 : 0;
  const bottom = opts.axis ? fs * 1.3 : 0;
  const h = Math.max(4, box.h - top - bottom);
  const svg = frame(parent, w, box.h, opts.aria);
  // The line keeps its weight whatever the box, so a tall chart is not a fat one.
  const pad = Math.max(2, Math.min(w, h) * 0.06);
  const path = svgEl("path", { d: sparklinePath(values, w, h, pad), class: "ep-chart-line", fill: "none" });
  if (top) path.setAttribute("transform", `translate(0 ${top})`);
  svg.appendChild(path);
  if (!opts.nums && !opts.axis) return;
  const n = values.length;
  const step = n > 1 ? (w - 2 * pad) / (n - 1) : 0;
  const room = n > 1 ? step : w;
  values.forEach((v, i) => {
    const x = n === 1 ? w / 2 : pad + i * step;
    if (opts.nums) label(svg, fitText(fmtNum(v), room, fs), { x, y: top - fs * 0.35, fs, cls: "ep-chart-num" });
    if (opts.axis)
      label(svg, fitText(nameAt(opts, i), room, fs), { x, y: box.h - fs * 0.3, fs, cls: "ep-chart-axis" });
  });
}

export function renderBars(
  parent: HTMLElement,
  values: number[],
  opts: { aria: string; box?: ChartBox; horizontal?: boolean } & ChartLabels
): void {
  const asked = chartBox("bar", opts.box);
  // Standing up without a box of its own, the width follows the number of bars.
  const w = opts.box?.w || opts.horizontal ? asked.w : Math.max(24, values.length * 8);
  const h = asked.h;
  const fs = labelSize({ w, h });
  const svg = frame(parent, w, h, opts.aria);
  const names = values.map((_, i) => nameAt(opts, i));

  if (opts.horizontal) {
    // Names sit in a gutter on the left, values just past the end of each bar.
    const widest = Math.max(0, ...names.map((s) => textWidth(s, fs)));
    const left = opts.axis ? Math.min(w * 0.35, widest + fs * 0.4) : 0;
    const right = opts.nums ? Math.min(w * 0.25, fs * 2.6) : 0;
    const inner = Math.max(4, w - left - right);
    const gap = Math.max(1, Math.min(8, h / Math.max(1, values.length) / 6));
    barLayoutH(values, inner, h, gap).forEach((r, i) => {
      svg.appendChild(
        svgEl("rect", {
          x: left,
          y: r.y,
          width: r.w,
          height: r.h,
          rx: Math.min(2, Math.min(r.w, r.h) / 4),
          class: "ep-chart-bar",
        })
      );
      const mid = r.y + r.h / 2 + fs * 0.35;
      if (opts.axis) label(svg, fitText(names[i], left - fs * 0.3, fs), { x: left - fs * 0.3, y: mid, fs, cls: "ep-chart-axis", anchor: "end" });
      if (opts.nums)
        label(svg, fmtNum(values[i]), { x: left + r.w + fs * 0.3, y: mid, fs, cls: "ep-chart-num", anchor: "start" });
    });
    return;
  }

  // Standing up: values overhead, names underfoot.
  const top = opts.nums ? fs * 1.3 : 0;
  const bottom = opts.axis ? fs * 1.3 : 0;
  const inner = Math.max(4, h - top - bottom);
  const gap = Math.max(1, Math.min(8, w / Math.max(1, values.length) / 6));
  barLayout(values, w, inner, gap).forEach((r, i) => {
    svg.appendChild(
      svgEl("rect", {
        x: r.x,
        y: r.y + top,
        width: r.w,
        height: r.h,
        rx: Math.min(2, Math.min(r.w, r.h) / 4),
        class: "ep-chart-bar",
      })
    );
    const mid = r.x + r.w / 2;
    if (opts.nums) label(svg, fitText(fmtNum(values[i]), r.w + gap, fs), { x: mid, y: top - fs * 0.35, fs, cls: "ep-chart-num" });
    if (opts.axis) label(svg, fitText(names[i], r.w + gap, fs), { x: mid, y: h - fs * 0.3, fs, cls: "ep-chart-axis" });
  });
}

export function renderRadar(
  parent: HTMLElement,
  values: number[],
  labels: string[],
  opts: { aria: string; max?: number; box?: ChartBox } & ChartLabels
): void {
  const box = chartBox("radar", opts.box);
  // A radar is round: it takes the largest square the box holds.
  const s = Math.max(24, Math.min(box.w, box.h));
  const c = s / 2;
  const fs = labelSize({ w: s, h: s });
  const named = opts.axis || opts.nums;
  // Labels live outside the ring, so the ring gives up room for them.
  const r = c * (named ? 0.66 : 0.82);
  const max = opts.max && opts.max > 0 ? opts.max : Math.max(1, ...values);
  const svg = frame(parent, s, s, opts.aria);
  // outer ring + axes
  const ring = ringPoints(values.length, c, c, r);
  svg.appendChild(svgEl("polygon", { points: pointsAttr(ring), class: "ep-chart-grid", fill: "none" }));
  for (const p of ring) svg.appendChild(svgEl("line", { x1: c, y1: c, x2: p.x, y2: p.y, class: "ep-chart-grid" }));
  // data area
  svg.appendChild(svgEl("polygon", { points: pointsAttr(radarPoints(values, max, c, c, r)), class: "ep-chart-area" }));
  if (!named) return;
  // A label sits just past its axis, leaning away from the middle.
  ring.forEach((p, i) => {
    const dx = p.x - c;
    const dy = p.y - c;
    const out = 1 + (fs * 0.7) / Math.max(1, r);
    const x = c + dx * out;
    const y = c + dy * out + fs * 0.35;
    const anchor = Math.abs(dx) < r * 0.25 ? "middle" : dx > 0 ? "start" : "end";
    const room = anchor === "middle" ? s * 0.4 : Math.max(fs * 2, (anchor === "start" ? s - x : x) - fs * 0.2);
    const name = opts.axis ? fitText(labels[i] ?? "", room, fs) : "";
    const num = opts.nums ? fmtNum(values[i]) : "";
    const both = name && num ? `${name} ${num}` : name || num;
    label(svg, fitText(both, room, fs), { x, y, fs, cls: opts.axis ? "ep-chart-axis" : "ep-chart-num", anchor });
  });
}

export function renderProgress(
  parent: HTMLElement,
  value: number,
  max: number,
  opts: { label: string; box?: ChartBox; name?: string } & ChartLabels
): void {
  const box = chartBox("progress", opts.box);
  const { w } = box;
  const fs = labelSize({ w, h: Math.max(box.h, 12) });
  const named = opts.axis || opts.nums;
  // The name and the reading share a line above the bar.
  const top = named ? fs * 1.35 : 0;
  const h = Math.max(3, box.h - top);
  const svg = frame(parent, w, box.h, opts.label);
  const r = h / 2;
  const track = svgEl("rect", { x: 0, y: top, width: w, height: h, rx: r, class: "ep-chart-track" });
  svg.appendChild(track);
  const fw = clampFrac(value, max) * w;
  if (fw > 0)
    svg.appendChild(
      svgEl("rect", { x: 0, y: top, width: Math.max(fw, r), height: h, rx: r, class: "ep-chart-fill" })
    );
  if (!named) return;
  const reading = `${fmtNum(value)} / ${fmtNum(max)}`;
  const numW = opts.nums ? textWidth(reading, fs) : 0;
  if (opts.axis)
    label(svg, fitText(opts.name ?? opts.labels?.[0] ?? "", w - numW - fs * 0.6, fs), {
      x: 0,
      y: top - fs * 0.4,
      fs,
      cls: "ep-chart-axis",
      anchor: "start",
    });
  if (opts.nums) label(svg, reading, { x: w, y: top - fs * 0.4, fs, cls: "ep-chart-num", anchor: "end" });
}
