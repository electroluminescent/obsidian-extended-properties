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
 */

import { barLayout, barLayoutH, clampFrac, pointsAttr, radarPoints, ringPoints, sparklinePath } from "../../utils/chart";

const NS = "http://www.w3.org/2000/svg";

/** The box a chart is drawn into, in the units its geometry is worked out in. */
export interface ChartBox {
  w: number;
  h: number;
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

function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = activeDocument.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
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

export function renderSparkline(parent: HTMLElement, values: number[], opts: { aria: string; box?: ChartBox }): void {
  const { w, h } = chartBox("spark", opts.box);
  const svg = frame(parent, w, h, opts.aria);
  // The line keeps its weight whatever the box, so a tall chart is not a fat one.
  const pad = Math.max(2, Math.min(w, h) * 0.06);
  svg.appendChild(svgEl("path", { d: sparklinePath(values, w, h, pad), class: "ep-chart-line", fill: "none" }));
}

export function renderBars(
  parent: HTMLElement,
  values: number[],
  opts: { aria: string; box?: ChartBox; horizontal?: boolean }
): void {
  const asked = chartBox("bar", opts.box);
  // Standing up without a box of its own, the width follows the number of bars.
  const w = opts.box?.w || opts.horizontal ? asked.w : Math.max(24, values.length * 8);
  const h = asked.h;
  const svg = frame(parent, w, h, opts.aria);
  // A gap proportional to the bar, so bars neither merge nor become slivers.
  const across = opts.horizontal ? h : w;
  const gap = Math.max(1, Math.min(8, across / Math.max(1, values.length) / 6));
  const bars = opts.horizontal ? barLayoutH(values, w, h, gap) : barLayout(values, w, h, gap);
  for (const r of bars)
    svg.appendChild(
      svgEl("rect", {
        x: r.x,
        y: r.y,
        width: r.w,
        height: r.h,
        rx: Math.min(2, Math.min(r.w, r.h) / 4),
        class: "ep-chart-bar",
      })
    );
}

export function renderRadar(
  parent: HTMLElement,
  values: number[],
  _labels: string[],
  opts: { aria: string; max?: number; box?: ChartBox }
): void {
  const box = chartBox("radar", opts.box);
  // A radar is round: it takes the largest square the box holds.
  const s = Math.max(24, Math.min(box.w, box.h));
  const c = s / 2;
  const r = c * 0.82;
  const max = opts.max && opts.max > 0 ? opts.max : Math.max(1, ...values);
  const svg = frame(parent, s, s, opts.aria);
  // outer ring + axes
  const ring = ringPoints(values.length, c, c, r);
  svg.appendChild(svgEl("polygon", { points: pointsAttr(ring), class: "ep-chart-grid", fill: "none" }));
  for (const p of ring) svg.appendChild(svgEl("line", { x1: c, y1: c, x2: p.x, y2: p.y, class: "ep-chart-grid" }));
  // data area
  svg.appendChild(svgEl("polygon", { points: pointsAttr(radarPoints(values, max, c, c, r)), class: "ep-chart-area" }));
}

export function renderProgress(
  parent: HTMLElement,
  value: number,
  max: number,
  opts: { label: string; box?: ChartBox }
): void {
  const { w, h } = chartBox("progress", opts.box);
  const svg = frame(parent, w, h, opts.label);
  const r = h / 2;
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width: w, height: h, rx: r, class: "ep-chart-track" }));
  const fw = clampFrac(value, max) * w;
  if (fw > 0)
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: Math.max(fw, r), height: h, rx: r, class: "ep-chart-fill" }));
}
