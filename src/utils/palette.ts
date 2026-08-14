/**
 * Palettes: turning a value into a colour.
 *
 * A palette says how numbers (and, through their allowed values, words) become
 * colours - as a hue swept round a wheel, or as a scale of stops and bands:
 * a stop is one value wearing one colour, a band is a stretch of them, and
 * they sit on the same scale because they are the same thing at two widths.
 * Every blend travels through
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
export type PaletteMode = "wheel" | "bands" | "semantic";

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

/**
 * One step of a palette's scale.
 *
 * A band covers everything from `from` to `to`; a stop is the same thing with
 * no width (`from === to`, `point: true`), which is why one type describes
 * both - the colour engine hit-tests them identically, and a stop simply wins
 * any value it shares with a band.
 */
export interface ScaleStep {
  from: number;
  to: number;
  /** A stop: one value rather than a stretch of them. */
  point?: boolean;
  /** This band wins a value that lands exactly on its lower edge. */
  domFrom?: boolean;
  /** ...and on its upper edge. */
  domTo?: boolean;
}

/** One colour pinned to one value (pre-4.58 data; migrated to a scale). */
export interface ColorPoint {
  at: number;
  color: string;
}

/** A band of values that all take one colour (pre-4.58 data). */
export interface ColorRange {
  from: number;
  to: number;
  color: string;
  domFrom?: boolean;
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
  /** The scale: stops and bands, in value order. */
  steps?: ScaleStep[];
  /**
   * The colours the steps wear, paired by position.
   *
   * Kept apart from the steps deliberately: which colour a step wears and
   * where that step sits are two different decisions, and a colour order that
   * reads well ("cold to hot") is worth being able to hold still while the
   * numbers under it are moved about - or moved about itself while the
   * numbers hold still.
   */
  colors?: string[];
  /** @deprecated pre-4.58 stops; migrated into `steps`/`colors`. */
  points?: ColorPoint[];
  /** @deprecated pre-4.58 bands; migrated into `steps`/`colors`. */
  ranges?: ColorRange[];
  /** Bands: moving one edge moves its neighbour with it. */
  linked?: boolean;
  /** What a value outside the whole scale takes. */
  outside?: "none" | "clamp";
  /** What a value in the gap between two steps takes. */
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

/** A step's midpoint - the value it sits at, for a stop. */
export function centerOf(step: ScaleStep): number {
  return (step.from + step.to) / 2;
}

/** A step paired with the colour standing opposite it. */
export interface ScaleEntry {
  step: ScaleStep;
  color: string;
}

/**
 * The scale in value order, with each step's colour beside it.
 *
 * Steps and colours are stored as two lists paired by position, so this is
 * where the pairing is made - and where anything unusable (an edge that is
 * not a number, a step with no colour opposite it) is dropped, rather than
 * leaving the renderer to cope.
 */
export function scaleOf(p: Palette): ScaleEntry[] {
  const colors = p.colors ?? [];
  return (p.steps ?? [])
    .map((step, i) => ({ step, color: colors[i] ?? "" }))
    .filter((e) => Number.isFinite(e.step.from) && Number.isFinite(e.step.to) && !!e.color)
    .sort((a, b) => a.step.from - b.step.from || a.step.to - b.step.to);
}

/** The colour a wheel gives `v` over `span`. */
function wheelColor(w: WheelPalette, v: number, span: Span): string {
  const width = span.max - span.min;
  const t = width > 0 ? clamp01((v - span.min) / width) : 0;
  const hue = w.start + (w.reverse ? -1 : 1) * t * w.spread;
  return fromOklch(w.lightness, w.chroma, hue);
}

/**
 * The colour a scale of stops and bands gives `v`.
 *
 * Inside a step, its colour flat. Where two steps claim the same value a stop
 * takes it - a stop is a value picked out on purpose, which is a stronger
 * statement than a band's edge - and between two bands, whichever edge was
 * marked dominant. Beyond the ends and in the gaps between steps, whatever
 * the palette says to do there.
 */
function scaleColor(p: Palette, v: number): string | undefined {
  const all = scaleOf(p);
  if (!all.length) return undefined;
  const hits = all.filter((e) => v >= e.step.from && v <= e.step.to);
  if (hits.length === 1) return hits[0].color;
  if (hits.length > 1) {
    const stop = hits.find((e) => e.step.point);
    if (stop) return stop.color;
    const dom = hits.find((e) => (v === e.step.from && e.step.domFrom) || (v === e.step.to && e.step.domTo));
    return (dom ?? hits[0]).color;
  }
  // In no step at all: the nearest on each side decide between them. Reading
  // outwards like this (rather than walking neighbouring pairs) is what lets a
  // stop sit INSIDE a band without inventing a gap on either side of itself.
  let left: ScaleEntry | undefined;
  let right: ScaleEntry | undefined;
  for (const e of all) {
    if (e.step.to <= v && (!left || e.step.to > left.step.to)) left = e;
    if (e.step.from >= v && (!right || e.step.from < right.step.from)) right = e;
  }
  if (!left || !right) {
    if (p.outside !== "clamp") return undefined;
    return (left ?? right)?.color;
  }
  if (p.gaps !== "blend") return undefined;
  const width = right.step.from - left.step.to;
  return width <= 0
    ? right.color
    : mixColors(left.color, right.color, (v - left.step.to) / width, p.arc ?? "short");
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
    case "bands":
      return scaleColor(palette, v);
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
 * Whether the scale is laid out legally: bands sorted, and overlapping at
 * most on a shared edge. Stops are free to sit anywhere, inside a band
 * included - a value picked out of a stretch is a thing worth saying, and it
 * is never ambiguous, since a stop always wins the value it names.
 */
export function stepsValid(steps: ScaleStep[]): boolean {
  const bands = steps.filter((x) => !x.point).sort((a, b) => a.from - b.from);
  for (let i = 0; i < bands.length; i++) {
    if (bands[i].to < bands[i].from) return false;
    if (i > 0 && bands[i].from < bands[i - 1].to) return false;
  }
  return steps.every((x) => Number.isFinite(x.from) && Number.isFinite(x.to) && (!x.point || x.from === x.to));
}

/**
 * Move one edge of one step, carrying its neighbour when the steps are
 * linked: closing a gap on one side opens none on the other. A stop has no
 * width, so it moves whole. Returns a new list; the old one is left alone.
 */
export function moveEdge(
  steps: ScaleStep[],
  index: number,
  edge: "from" | "to",
  value: number,
  linked: boolean
): ScaleStep[] {
  const rs = steps.map((r) => ({ ...r }));
  const r = rs[index];
  if (!r || !Number.isFinite(value)) return rs;
  if (r.point) {
    r.from = value;
    r.to = value;
    return rs;
  }
  if (edge === "from") {
    r.from = Math.min(value, r.to);
    if (linked && rs[index - 1] && !rs[index - 1].point) rs[index - 1].to = r.from;
  } else {
    r.to = Math.max(value, r.from);
    if (linked && rs[index + 1] && !rs[index + 1].point) rs[index + 1].from = r.to;
  }
  return rs;
}

/** Read/write one edge's dominance flag. */
function domOf(r: ScaleStep, edge: "from" | "to"): boolean {
  return (edge === "from" ? r.domFrom : r.domTo) === true;
}
function setDom(r: ScaleStep, edge: "from" | "to", on: boolean): void {
  if (edge === "from") r.domFrom = on || undefined;
  else r.domTo = on || undefined;
}

/**
 * Whether an edge can be claimed at all: it must meet another band's edge,
 * and no stop may be standing on it. A stop takes the value it names outright
 * (see {@link scaleColor}), so a band bordering one has nothing to win there
 * and is not offered the choice.
 */
export function edgeContested(steps: ScaleStep[], index: number, edge: "from" | "to"): boolean {
  const me = steps[index];
  if (!me || me.point) return false;
  const at = edge === "from" ? me.from : me.to;
  if (steps.some((o, j) => j !== index && o.point && o.from === at)) return false;
  return steps.some((o, j) => j !== index && !o.point && (o.from === at || o.to === at));
}

/**
 * Settle the dominance flags: wherever two or more band edges meet on the
 * same number, exactly one of them owns it - never none, never two.
 *
 * A shared edge with nobody marked is a value with no answer, so one is
 * chosen: whichever was already marked, else the band that STARTS there, on
 * the reading that a boundary belongs to the band beginning at it. Flags on
 * edges that meet nothing, or that a stop stands on, are dropped - an edge
 * with nothing to win has no claim to make.
 */
export function ensureDominance(steps: ScaleStep[]): ScaleStep[] {
  const rs = steps.map((r) => ({ ...r }));
  const edges = new Map<number, { i: number; edge: "from" | "to" }[]>();
  rs.forEach((r, i) => {
    if (r.point) return;
    for (const edge of ["from", "to"] as const) {
      const at = edge === "from" ? r.from : r.to;
      const met = edges.get(at) ?? [];
      met.push({ i, edge });
      edges.set(at, met);
    }
  });
  for (const [at, met] of edges) {
    const stopped = rs.some((o) => o.point && o.from === at);
    if (met.length < 2 || stopped) {
      for (const e of met) setDom(rs[e.i], e.edge, false);
      continue;
    }
    const keep = met.find((e) => domOf(rs[e.i], e.edge)) ?? met.find((e) => e.edge === "from") ?? met[0];
    for (const e of met) setDom(rs[e.i], e.edge, e === keep);
  }
  for (const r of rs)
    if (r.point) {
      r.domFrom = undefined;
      r.domTo = undefined;
    }
  return rs;
}

/**
 * Mark one edge dominant, clearing the edge it shares its value with: two
 * edges at the same number cannot both win.
 */
export function setDominant(
  steps: ScaleStep[],
  index: number,
  edge: "from" | "to",
  on: boolean
): ScaleStep[] {
  const rs = steps.map((r) => ({ ...r }));
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

/** How far a new step reaches when it has to make room: a tenth of the scale. */
function stepWidth(steps: ScaleStep[]): number {
  if (!steps.length) return 10;
  const lo = Math.min(...steps.map((s) => s.from));
  const hi = Math.max(...steps.map((s) => s.to));
  return hi > lo ? (hi - lo) / 10 : 10;
}

/**
 * Put a new stop or band into the scale at `at`, with a colour blended from
 * the ones it lands between.
 *
 * Where the neighbours leave a gap, the new step takes it - which is the
 * usual case, and moves nothing. Where they touch, a band makes room for
 * itself and everything above it slides up by as much; a stop needs none,
 * since it has no width. The colour is the mix of the two it now sits
 * between, so an inserted step starts out belonging to the scale rather than
 * as a stranger in the middle of it.
 */
export function insertStep(
  steps: ScaleStep[],
  colors: string[],
  at: number,
  kind: "point" | "band",
  arc: "short" | "long" = "short"
): { steps: ScaleStep[]; colors: string[] } {
  const rs = steps.map((r) => ({ ...r }));
  const cs = [...colors];
  const i = Math.max(0, Math.min(at, rs.length));
  const prev = rs[i - 1];
  const next = rs[i];
  const width = stepWidth(rs);
  let made: ScaleStep;
  if (kind === "point") {
    const v = prev && next ? (prev.to + next.from) / 2 : prev ? prev.to + width : next ? next.from - width : 0;
    made = { from: v, to: v, point: true };
  } else if (prev && next && next.from > prev.to) {
    made = { from: prev.to, to: next.from };
  } else if (prev) {
    made = { from: prev.to, to: prev.to + width };
    // Nothing may overlap: everything above the new band moves up by its width.
    for (let j = i; j < rs.length; j++) {
      rs[j].from += width;
      rs[j].to += width;
    }
  } else if (next) {
    made = { from: next.from - width, to: next.from };
  } else {
    made = { from: 0, to: width };
  }
  const a = cs[i - 1];
  const b = cs[i];
  const color = a && b ? mixColors(a, b, 0.5, arc) : a || b || "#888888";
  rs.splice(i, 0, made);
  cs.splice(i, 0, color);
  return { steps: ensureDominance(rs), colors: cs };
}

/** Take a step and its colour out of the scale together. */
export function removeStep(
  steps: ScaleStep[],
  colors: string[],
  index: number
): { steps: ScaleStep[]; colors: string[] } {
  return {
    steps: ensureDominance(steps.filter((_, i) => i !== index)),
    colors: colors.filter((_, i) => i !== index),
  };
}

/**
 * Move one colour to another place in the list, the rest closing up behind it
 * and opening in front of it. The steps do not move: this is the whole point
 * of holding the two apart.
 */
export function moveColor(colors: string[], from: number, to: number): string[] {
  const cs = [...colors];
  if (from < 0 || from >= cs.length) return cs;
  const target = Math.max(0, Math.min(to, cs.length - 1));
  const [moved] = cs.splice(from, 1);
  cs.splice(target, 0, moved);
  return cs;
}

/** Halfway between the colours either side of `i`, ignoring where they sit. */
export function midpointBlend(colors: string[], i: number, arc: "short" | "long" = "short"): string | undefined {
  const a = colors[i - 1];
  const b = colors[i + 1];
  if (!a || !b) return a || b;
  return mixColors(a, b, 0.5, arc);
}

/**
 * The colour this row's own place on the scale asks for: the blend of the two
 * either side of it, weighted by how far along it sits between them. A stop
 * nine tenths of the way from one band to the next comes out nine tenths of
 * the way from one colour to the other.
 */
export function positionalBlend(
  steps: ScaleStep[],
  colors: string[],
  i: number,
  arc: "short" | "long" = "short"
): string | undefined {
  const a = colors[i - 1];
  const b = colors[i + 1];
  if (!a || !b) return a || b;
  const from = steps[i - 1];
  const here = steps[i];
  const to = steps[i + 1];
  if (!from || !here || !to) return mixColors(a, b, 0.5, arc);
  const width = centerOf(to) - centerOf(from);
  const t = width === 0 ? 0.5 : clamp01((centerOf(here) - centerOf(from)) / width);
  return mixColors(a, b, t, arc);
}
