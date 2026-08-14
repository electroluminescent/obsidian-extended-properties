/**
 * Palettes: turning a value into a colour.
 *
 * A palette says how numbers (and, through their allowed values, words) become
 * colours - as a hue swept round a wheel, as stops blended between, or as flat
 * bands with blends only where you ask for them. Every blend travels through
 * OKLCH, so a mix of two colours passes through the colours between them
 * rather than through the grey that sRGB interpolation finds.
 *
 * Pure arithmetic: no DOM, no Obsidian. The rendering half lives in
 * `ui/render/format.ts`, and the editor invariants (linked edges, no
 * overlaps) are here too so the settings UI and the renderer cannot disagree
 * about what a palette means.
 */

import { hexToRgb, oklchToRgb, rgbToHex, rgbToOklab, rgbToOklch, oklabToRgb } from "./color";
import { semanticColor } from "./semantic";

/** How a palette turns a value into a colour. */
export type PaletteMode = "wheel" | "points" | "ranges" | "semantic";

/** The colour circle, swept from `start` across `spread` degrees. */
export interface WheelPalette {
  /** Hue the property's smallest value takes, in degrees. */
  start: number;
  /** How far round the circle the range travels (may exceed 360). */
  spread: number;
  /** OKLCH lightness, 0-1. */
  lightness: number;
  /** OKLCH chroma, 0-0.4 in practice. */
  chroma: number;
  /** Sweep the other way round the circle. */
  reverse?: boolean;
}

/** One colour pinned to one value; between two of them the colour blends. */
export interface ColorPoint {
  at: number;
  color: string;
}

/** A band of values that all take one colour. */
export interface ColorRange {
  from: number;
  to: number;
  color: string;
  /** This range wins a value that lands exactly on its lower edge. */
  domFrom?: boolean;
  /** ...and on its upper edge. */
  domTo?: boolean;
}

/** A word the user has given a colour of its own. */
export interface WordColor {
  word: string;
  color: string;
}

export interface Palette {
  id: string;
  name: string;
  mode: PaletteMode;
  /** Which way round the circle a blend travels between two hues. */
  arc?: "short" | "long";
  wheel?: WheelPalette;
  points?: ColorPoint[];
  ranges?: ColorRange[];
  /** Ranges: moving one edge moves its neighbour with it. */
  linked?: boolean;
  /** What a value outside every range takes. */
  outside?: "none" | "clamp";
  /** What a value in the gap between two ranges takes. */
  gaps?: "blend" | "none";
  words?: WordColor[];
  /** Where a word not in the list is looked for next. */
  fallback?: "table" | "hash" | "none";
  /**
   * What the numbers in this palette mean. "date" writes and reads them as
   * dates under `dateProp`'s calendar - the colour engine still sees plain
   * numbers, since that is what a date is stored as.
   */
  scale?: "number" | "date";
  /** The date property whose calendar the edges are written in. */
  dateProp?: string;
}

/** The stretch of values a palette is spread over. */
export interface Span {
  min: number;
  max: number;
}

/** A wheel palette drawn over nothing in particular. */
export function defaultWheel(): WheelPalette {
  return { start: 250, spread: 250, lightness: 0.72, chroma: 0.13 };
}

// -- colour arithmetic ------------------------------------------------------

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Hex -> OKLCH, or null where the text is not a colour. */
export function toOklch(hex: string): { L: number; C: number; H: number } | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToOklch(rgb.r, rgb.g, rgb.b) : null;
}

/** OKLCH -> hex, gamut-clipped by the conversion. */
export function fromOklch(L: number, C: number, H: number): string {
  const { r, g, b } = oklchToRgb(clamp01(L), Math.max(0, C), ((H % 360) + 360) % 360);
  return rgbToHex(r, g, b);
}

/**
 * The hue `t` of the way from `a` to `b`. The short way round unless asked
 * otherwise - and a colour with no chroma has no hue worth travelling from,
 * so it borrows its partner's.
 */
function mixHue(a: { C: number; H: number }, b: { C: number; H: number }, t: number, arc: "short" | "long"): number {
  if (a.C < 1e-4) return b.H;
  if (b.C < 1e-4) return a.H;
  let d = ((b.H - a.H) % 360 + 360) % 360; // 0..360, counter-clockwise
  if (arc === "short" ? d > 180 : d <= 180) d -= 360;
  return a.H + d * t;
}

/** Blend two colours through OKLCH; `t` is how far from `a` to `b`. */
export function mixColors(a: string, b: string, t: number, arc: "short" | "long" = "short"): string {
  const ca = toOklch(a);
  const cb = toOklch(b);
  if (!ca || !cb) return ca ? a : b;
  const u = clamp01(t);
  return fromOklch(ca.L + (cb.L - ca.L) * u, ca.C + (cb.C - ca.C) * u, mixHue(ca, cb, u, arc));
}

/**
 * The average of several colours, mixed in Oklab - which is what a list card
 * takes from its chips. Averaging in sRGB turns a red and a green into mud;
 * in Oklab it lands where the eye expects.
 */
export function blendColors(colors: string[]): string | undefined {
  let n = 0;
  let L = 0;
  let a = 0;
  let b = 0;
  for (const hex of colors) {
    const rgb = hexToRgb(hex);
    if (!rgb) continue;
    const lab = rgbToOklab(rgb.r, rgb.g, rgb.b);
    L += lab.L;
    a += lab.a;
    b += lab.b;
    n++;
  }
  if (!n) return undefined;
  const c = oklabToRgb(L / n, a / n, b / n);
  return rgbToHex(c.r, c.g, c.b);
}

/** Relative luminance (WCAG), for choosing text that can be read on a fill. */
function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const ch = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch(rgb.r) + 0.7152 * ch(rgb.g) + 0.0722 * ch(rgb.b);
}

/** Black or white, whichever can be read on `bg`. */
export function readableOn(bg: string): string {
  const l = luminance(bg);
  const onWhite = 1.05 / (l + 0.05);
  const onBlack = (l + 0.05) / 0.05;
  return onBlack >= onWhite ? "#000000" : "#ffffff";
}

// -- the modes --------------------------------------------------------------

/** Points in order, ignoring any that are not colours or not numbers. */
function sortedPoints(p: Palette): ColorPoint[] {
  return (p.points ?? []).filter((x) => Number.isFinite(x.at) && !!x.color).sort((a, b) => a.at - b.at);
}

/** Ranges in order, lowest first. */
export function sortedRanges(p: Palette): ColorRange[] {
  return (p.ranges ?? [])
    .filter((r) => Number.isFinite(r.from) && Number.isFinite(r.to) && !!r.color)
    .sort((a, b) => a.from - b.from || a.to - b.to);
}

/** The colour a wheel gives `v` over `span`. */
function wheelColor(w: WheelPalette, v: number, span: Span): string {
  const width = span.max - span.min;
  const t = width > 0 ? clamp01((v - span.min) / width) : 0;
  const hue = w.start + (w.reverse ? -1 : 1) * t * w.spread;
  return fromOklch(w.lightness, w.chroma, hue);
}

/** The colour a set of stops gives `v`: flat outside them, blended between. */
function pointColor(p: Palette, v: number): string | undefined {
  const pts = sortedPoints(p);
  if (!pts.length) return undefined;
  if (v <= pts[0].at) return pts[0].color;
  const last = pts[pts.length - 1];
  if (v >= last.at) return last.color;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (v > b.at) continue;
    const width = b.at - a.at;
    return width <= 0 ? b.color : mixColors(a.color, b.color, (v - a.at) / width, p.arc ?? "short");
  }
  return last.color;
}

/**
 * The colour a set of bands gives `v`.
 *
 * Inside a band, its colour flat. On an edge two bands share, whichever edge
 * was marked dominant - and the lower band otherwise, so the answer never
 * depends on the order they were written in. Between bands and beyond the
 * ends, whatever the palette says to do there.
 */
function rangeColor(p: Palette, v: number): string | undefined {
  const rs = sortedRanges(p);
  if (!rs.length) return undefined;
  const hits = rs.filter((r) => v >= Math.min(r.from, r.to) && v <= Math.max(r.from, r.to));
  if (hits.length === 1) return hits[0].color;
  if (hits.length > 1) {
    const dominant = hits.find((r) => (v === r.from && r.domFrom) || (v === r.to && r.domTo));
    return (dominant ?? hits[0]).color;
  }
  const first = rs[0];
  const last = rs[rs.length - 1];
  if (v < first.from || v > last.to) return p.outside === "clamp" ? (v < first.from ? first.color : last.color) : undefined;
  if (p.gaps !== "blend") return undefined;
  for (let i = 1; i < rs.length; i++) {
    const a = rs[i - 1];
    const b = rs[i];
    if (v <= a.to || v >= b.from) continue;
    const width = b.from - a.to;
    return width <= 0 ? b.color : mixColors(a.color, b.color, (v - a.to) / width, p.arc ?? "short");
  }
  return undefined;
}

/**
 * What colour `palette` gives the number `v`, or undefined where it gives
 * none (a value outside every band, a palette with nothing in it).
 *
 * `span` is the stretch the property covers - its own min/max, or the range
 * of its values across the vault - and only the wheel needs it.
 */
export function colorAt(palette: Palette, v: number, span?: Span): string | undefined {
  if (!Number.isFinite(v)) return undefined;
  switch (palette.mode) {
    case "wheel":
      return span ? wheelColor(palette.wheel ?? defaultWheel(), v, span) : undefined;
    case "points":
      return pointColor(palette, v);
    case "ranges":
      return rangeColor(palette, v);
    default:
      return undefined;
  }
}

/**
 * What colour a word takes: the one it was given, else - for a value type
 * with a list of allowed values - its position in that list read as a number.
 * (The wider vocabulary arrives with the semantic mode.)
 */
export function colorForText(palette: Palette, text: string, allowed?: string[]): string | undefined {
  const v = text.trim();
  if (!v) return undefined;
  const own = (palette.words ?? []).find((w) => w.word.trim().toLowerCase() === v.toLowerCase());
  if (own) return own.color;
  if (palette.mode === "semantic") {
    const w = palette.wheel;
    return semanticColor(v, { fallback: palette.fallback, lightness: w?.lightness, chroma: w?.chroma });
  }
  const list = (allowed ?? []).map((s) => s.trim().toLowerCase());
  const i = list.indexOf(v.toLowerCase());
  if (i < 0) return undefined;
  return colorAt(palette, i, { min: 0, max: Math.max(1, list.length - 1) });
}

// -- editor invariants ------------------------------------------------------

/**
 * Whether the bands are laid out legally: sorted, and overlapping at most on
 * a shared edge. The editor refuses anything else rather than leaving the
 * renderer to guess.
 */
export function rangesValid(ranges: ColorRange[]): boolean {
  const rs = [...ranges].sort((a, b) => a.from - b.from);
  for (let i = 0; i < rs.length; i++) {
    if (rs[i].to < rs[i].from) return false;
    if (i > 0 && rs[i].from < rs[i - 1].to) return false;
  }
  return true;
}

/**
 * Move one edge of one band, carrying its neighbour when the bands are
 * linked: closing a gap on one side opens none on the other. Returns a new
 * list; the old one is left alone.
 */
export function moveEdge(
  ranges: ColorRange[],
  index: number,
  edge: "from" | "to",
  value: number,
  linked: boolean
): ColorRange[] {
  const rs = ranges.map((r) => ({ ...r }));
  const r = rs[index];
  if (!r || !Number.isFinite(value)) return rs;
  if (edge === "from") {
    r.from = Math.min(value, r.to);
    if (linked && rs[index - 1]) rs[index - 1].to = r.from;
  } else {
    r.to = Math.max(value, r.from);
    if (linked && rs[index + 1]) rs[index + 1].from = r.to;
  }
  return rs;
}

/** Read/write one edge's dominance flag. */
function domOf(r: ColorRange, edge: "from" | "to"): boolean {
  return (edge === "from" ? r.domFrom : r.domTo) === true;
}
function setDom(r: ColorRange, edge: "from" | "to", on: boolean): void {
  if (edge === "from") r.domFrom = on || undefined;
  else r.domTo = on || undefined;
}

/**
 * Settle the dominance flags: wherever two or more edges meet on the same
 * number, exactly one of them owns it - never none, never two.
 *
 * A shared edge with nobody marked is a value with no answer, so one is
 * chosen: whichever was already marked, else the band that STARTS there, on
 * the reading that a boundary belongs to the band beginning at it. Flags left
 * behind on edges that no longer share a value are dropped, since an edge
 * nothing meets has nothing to win.
 */
export function ensureDominance(ranges: ColorRange[]): ColorRange[] {
  const rs = ranges.map((r) => ({ ...r }));
  const edges = new Map<number, { i: number; edge: "from" | "to" }[]>();
  rs.forEach((r, i) => {
    for (const edge of ["from", "to"] as const) {
      const at = edge === "from" ? r.from : r.to;
      const at2 = edges.get(at) ?? [];
      at2.push({ i, edge });
      edges.set(at, at2);
    }
  });
  for (const met of edges.values()) {
    if (met.length < 2) {
      for (const e of met) setDom(rs[e.i], e.edge, false);
      continue;
    }
    const keep = met.find((e) => domOf(rs[e.i], e.edge)) ?? met.find((e) => e.edge === "from") ?? met[0];
    for (const e of met) setDom(rs[e.i], e.edge, e === keep);
  }
  return rs;
}

/**
 * Mark one edge dominant, clearing the edge it shares its value with: two
 * edges at the same number cannot both win.
 */
export function setDominant(
  ranges: ColorRange[],
  index: number,
  edge: "from" | "to",
  on: boolean
): ColorRange[] {
  const rs = ranges.map((r) => ({ ...r }));
  const me = rs[index];
  if (!me) return rs;
  const at = edge === "from" ? me.from : me.to;
  setDom(me, edge, on);
  if (on)
    rs.forEach((other, i) => {
      if (i === index) return;
      if (other.from === at) other.domFrom = undefined;
      if (other.to === at) other.domTo = undefined;
    });
  // Never leave a shared edge with nobody speaking for it.
  return ensureDominance(rs);
}
