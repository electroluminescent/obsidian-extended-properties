/**
 * SVG renderers for the inline charts (roadmap G2).
 *
 * Thin DOM layer over the pure geometry in `utils/chart.ts`. Built with
 * `createElementNS` (no `innerHTML`), themed entirely through `--ep-*` CSS
 * classes, and accessible: every chart is `role="img"` with an `aria-label`
 * and a visually-hidden text fallback listing the data.
 */

import { barLayout, clampFrac, pointsAttr, radarPoints, ringPoints, sparklinePath } from "../../utils/chart";

const NS = "http://www.w3.org/2000/svg";

function svgEl(tag: string, attrs: Record<string, string | number>): SVGElement {
  const e = document.createElementNS(NS, tag);
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

export function renderSparkline(parent: HTMLElement, values: number[], opts: { aria: string }): void {
  const w = 64;
  const h = 16;
  const svg = frame(parent, w, h, opts.aria);
  svg.appendChild(svgEl("path", { d: sparklinePath(values, w, h, 2), class: "ep-chart-line", fill: "none" }));
}

export function renderBars(parent: HTMLElement, values: number[], opts: { aria: string }): void {
  const w = Math.max(24, values.length * 8);
  const h = 16;
  const svg = frame(parent, w, h, opts.aria);
  for (const r of barLayout(values, w, h, 1.5))
    svg.appendChild(svgEl("rect", { x: r.x, y: r.y, width: r.w, height: r.h, rx: 1, class: "ep-chart-bar" }));
}

export function renderRadar(parent: HTMLElement, values: number[], _labels: string[], opts: { aria: string; max?: number }): void {
  const s = 64;
  const c = s / 2;
  const r = 26;
  const max = opts.max && opts.max > 0 ? opts.max : Math.max(1, ...values);
  const svg = frame(parent, s, s, opts.aria);
  // outer ring + axes
  const ring = ringPoints(values.length, c, c, r);
  svg.appendChild(svgEl("polygon", { points: pointsAttr(ring), class: "ep-chart-grid", fill: "none" }));
  for (const p of ring) svg.appendChild(svgEl("line", { x1: c, y1: c, x2: p.x, y2: p.y, class: "ep-chart-grid" }));
  // data area
  svg.appendChild(svgEl("polygon", { points: pointsAttr(radarPoints(values, max, c, c, r)), class: "ep-chart-area" }));
}

export function renderProgress(parent: HTMLElement, value: number, max: number, opts: { label: string }): void {
  const w = 64;
  const h = 10;
  const svg = frame(parent, w, h, opts.label);
  svg.appendChild(svgEl("rect", { x: 0, y: 0, width: w, height: h, rx: h / 2, class: "ep-chart-track" }));
  const fw = clampFrac(value, max) * w;
  if (fw > 0)
    svg.appendChild(svgEl("rect", { x: 0, y: 0, width: Math.max(fw, h / 2), height: h, rx: h / 2, class: "ep-chart-fill" }));
}
