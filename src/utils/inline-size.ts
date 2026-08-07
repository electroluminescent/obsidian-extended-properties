/**
 * How big an inline piece is drawn in a note body, and where it sits on the
 * line.
 *
 * A chip written into prose gets one line's worth of room by default, which is
 * fine for a value and useless for a radar chart. Each kind of inline piece
 * carries its own height (in lines), width and justification, set once in the
 * plugin settings and applied wherever that kind is drawn - reading mode and
 * Live Preview alike.
 *
 * Widths are written as a share of the text column - full, half, quarter - or
 * as a number of pixels. A share that would come out too narrow to read steps
 * up to the next largest share instead, so a quarter-width card in a narrow
 * pane becomes a half-width one rather than an unreadable sliver.
 *
 * Pure: geometry only, no DOM.
 */

/** Every inline piece that can be sized, in the order the settings list them. */
export const INLINE_KINDS = ["roll", "prop", "val", "vals", "spark", "bar", "radar", "progress"] as const;
export type InlineKind = (typeof INLINE_KINDS)[number];

/** The shares a width may be written as, largest first. */
export const SPAN_SHARES: { id: string; share: number }[] = [
  { id: "full", share: 1 },
  { id: "half", share: 0.5 },
  { id: "quarter", share: 0.25 },
];

/** Narrower than this and an inline piece stops being worth drawing. */
export const MIN_INLINE_PX = 150;

/** Lines are a whole number, and there is no sense past a screenful. */
export const MAX_INLINE_LINES = 24;

/** How one kind of inline piece is drawn. */
export interface InlineSize {
  /** Lines of text tall. Unset or 1 = the single line it always took. */
  lines?: number;
  /** "full" | "half" | "quarter" | "custom", or unset for the natural width. */
  span?: string;
  /** Width in pixels, used when `span` is "custom". */
  width?: number;
  /** "left" | "center" | "right", or unset to sit in the text as it falls. */
  align?: string;
  /**
   * Draw the piece in a card - the bordered, tinted box a `vals:` card has
   * always had. Unset means the kind's own habit (see {@link isBoxed}).
   */
  box?: boolean;
  /**
   * Which way the piece runs, where that means anything: bars stand up
   * ("vertical", the default) or lie down ("horizontal").
   */
  dir?: string;
  /** Name the property behind each value along the chart's axis. */
  axisLabels?: boolean;
  /** Print the values themselves on the chart. */
  valueLabels?: boolean;
}

/** The pieces that draw data, and so can name what they draw. */
export const CHART_KINDS: ReadonlySet<string> = new Set(["spark", "bar", "radar", "progress"]);

/** Whether this piece is drawn lying down. */
export function isHorizontal(size: InlineSize | undefined): boolean {
  return size?.dir === "horizontal";
}

/**
 * The kinds drawn in a box of their own unless told otherwise: the value
 * card's border and fill, and the pill a roll or value chip has always worn.
 * Turning the switch off takes the box away; turning it on gives one to a
 * kind that never had one.
 */
const BOXED_BY_DEFAULT: ReadonlySet<string> = new Set(["vals", "roll", "val"]);

/** Whether this kind is drawn in a card, its own habit unless overridden. */
export function isBoxed(size: InlineSize | undefined, kind: string): boolean {
  return size?.box ?? BOXED_BY_DEFAULT.has(kind);
}

/** Whether a card is this kind's habit, so only a change need be stored. */
export function boxedByDefault(kind: string): boolean {
  return BOXED_BY_DEFAULT.has(kind);
}

/** A width worked out for a particular column, ready to put on an element. */
export interface ResolvedWidth {
  /** The CSS width, or undefined to leave the piece its natural size. */
  css?: string;
  /** The share actually used, after any stepping up. */
  span?: string;
  /** Whether a share was widened because it would have been unreadable. */
  stepped: boolean;
}

/**
 * What `size` comes to in a column `columnPx` wide.
 *
 * A share too narrow to read takes the next largest instead, and a full width
 * that is still too narrow is simply the full width - there is nothing wider
 * to give it. A custom width is taken as written but never below the minimum,
 * since a number typed by hand is a request, not a measurement.
 *
 * A column of zero (nothing measured yet) leaves shares alone: the element
 * will be laid out by CSS, and the minimum width holds the floor.
 */
export function resolveWidth(size: InlineSize | undefined, columnPx = 0): ResolvedWidth {
  const span = size?.span;
  if (!span || span === "auto") return { stepped: false };
  if (span === "custom") {
    const px = Number(size?.width);
    if (!(px > 0)) return { stepped: false };
    const used = Math.max(px, MIN_INLINE_PX);
    return { css: `${used}px`, span: "custom", stepped: used !== px };
  }
  let i = SPAN_SHARES.findIndex((s) => s.id === span);
  if (i < 0) return { stepped: false };
  const asked = i;
  // Step up while the share would be too narrow to read.
  while (i > 0 && columnPx > 0 && columnPx * SPAN_SHARES[i].share < MIN_INLINE_PX) i--;
  const s = SPAN_SHARES[i];
  return { css: `${s.share * 100}%`, span: s.id, stepped: i !== asked };
}

/** The height `size` asks for, in lines, or undefined for the usual one. */
export function resolveLines(size: InlineSize | undefined): number | undefined {
  const n = Math.floor(Number(size?.lines));
  if (!Number.isFinite(n) || n <= 1) return undefined;
  return Math.min(n, MAX_INLINE_LINES);
}

/**
 * Whether a piece has been given a shape of its own - a height, a width or a
 * justification - and so has to be laid out as a block rather than flowing
 * inside the sentence it sits in.
 */
export function isShaped(size: InlineSize | undefined): boolean {
  return resolveLines(size) !== undefined || !!resolveWidth(size).css || !!size?.align;
}
