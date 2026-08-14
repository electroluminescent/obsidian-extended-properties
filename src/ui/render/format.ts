/**
 * Conditional formatting: putting a palette's colour on what is drawn.
 *
 * The arithmetic is in `utils/palette` and knows nothing about the DOM; this
 * is the one place that turns a value into styles, so the sidebar, the type
 * table and inline chips all colour a property the same way.
 *
 * A colour lands in one of three places, chosen per property:
 *   text - the value's own text takes the colour
 *   chip - the value sits in a tinted pill
 *   card - the whole row is tinted
 * Where there is a fill behind text, the foreground is picked by measured
 * contrast rather than hoped for, unless the property names one.
 *
 * Everything is handed over as `--ep-fmt-*` custom properties, so themes and
 * Style Settings can still reach it and `forced-colors` can drop the lot.
 */

import type { Entry, FormatRule } from "../../core/model";
import type { ViewCtx } from "../../core/context";
import { modifierInfo } from "../../core/influences";
import type { Palette, Span } from "../../utils/palette";
import { blendColors, colorAt, colorForText, readableOn } from "../../utils/palette";
import { pickFinish } from "../../utils/finish";
import { FINISHES, finishClass, NEEDS_FILL } from "./finishes";

/** Value types whose values are numbers, whatever they read as. */
const NUMERIC = new Set(["number", "decimal", "formula", "derived", "unit", "rating", "date", "datetime"]);

/**
 * The value a property is coloured by.
 *
 * Not always the one in the note: a derived property is worked out rather
 * than stored, and a number shown through a unit factor is coloured by what
 * the reader sees, since that is what the palette's edges were typed in.
 */
export function formatValue(view: ViewCtx, entry: Entry): unknown {
  const key = entry.key ?? "";
  const type = view.resolveType(entry);
  if (type === "derived") return modifierInfo(view, entry).value;
  const raw = view.note.raw[key];
  const factor = Number(entry.unitFactor);
  if (typeof raw === "number" && factor > 0 && factor !== 1) return raw * factor;
  return raw;
}

/** The rule in force for an entry: its own, else the one its key carries. */
export function ruleFor(view: ViewCtx, entry: Entry): FormatRule | undefined {
  const own = entry.format;
  if (own) return own.off ? undefined : own;
  const key = (entry.key ?? "").toLowerCase();
  const shared = key ? view.settings.formatProps?.[key] : undefined;
  return shared && !shared.off ? shared : undefined;
}

/** The palette a rule names, if the vault still holds it. */
export function paletteFor(view: ViewCtx, rule: FormatRule | undefined): Palette | undefined {
  if (!rule?.palette) return undefined;
  return (view.settings.palettes ?? []).find((p) => p.id === rule.palette);
}

/**
 * The stretch of values a wheel is spread over: what the property says, then
 * what the vault holds for it, and 0-1 when it says nothing at all.
 */
function spanFor(view: ViewCtx, entry: Entry): Span {
  const vault = entry.min === undefined || entry.max === undefined ? view.props.numberRange(entry.key ?? "") : null;
  const min = entry.min ?? vault?.min ?? 0;
  const max = entry.max ?? vault?.max ?? 1;
  return max > min ? { min, max } : { min, max: min + 1 };
}

/** The values a text property offers, which double as its scale. */
function allowedOf(entry: Entry): string[] | undefined {
  return entry.constraints?.allowed;
}

/**
 * The colour one value takes. A list has no single value, so it takes the
 * blend of its items - which is what a card or a line of text can show of it.
 */
export function colorOf(view: ViewCtx, entry: Entry, raw: unknown): string | undefined {
  const rule = ruleFor(view, entry);
  const palette = paletteFor(view, rule);
  if (!palette) return undefined;
  return colorOfWith(view, entry, palette, raw);
}

/** As {@link colorOf}, for a palette already in hand. */
export function colorOfWith(view: ViewCtx, entry: Entry, palette: Palette, raw: unknown): string | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (Array.isArray(raw)) {
    const each = raw
      .map((v) => colorOfWith(view, entry, palette, v))
      .filter((c): c is string => !!c);
    return each.length ? blendColors(each) : undefined;
  }
  if (typeof raw === "number") return colorAt(palette, raw, spanFor(view, entry));
  const text = String(raw);
  const type = view.resolveType(entry);
  if (NUMERIC.has(type)) {
    const n = Number(text);
    return Number.isFinite(n) ? colorAt(palette, n, spanFor(view, entry)) : undefined;
  }
  return colorForText(palette, text, allowedOf(entry));
}

/** Where a rule puts its colour. */
function targetOf(rule: FormatRule): "text" | "chip" | "card" {
  return rule.target === "card" || rule.target === "chip" ? rule.target : "text";
}

/** Take every trace of a previous pass off `el`. */
function clear(el: HTMLElement): void {
  el.removeClass("ep-fmt", "ep-fmt-text", "ep-fmt-chip", "ep-fmt-card", "ep-fin");
  for (const id of FINISHES) el.removeClass(finishClass(id));
  el.setCssProps({ "--ep-fmt-bg": "", "--ep-fmt-fg": "" });
}

/**
 * Dress `el` in `color` the way `target` asks for. Text takes the colour
 * itself; a chip or a card takes it as a fill, with a foreground that can be
 * read on it.
 */
export function paint(
  el: HTMLElement,
  color: string,
  target: "text" | "chip" | "card",
  contrast?: string,
  finish?: string
): void {
  el.addClass("ep-fmt", `ep-fmt-${target}`);
  // A finish needs something to lie on: on bare text, the ones that cut an
  // edge or weave a surface have nothing to work with.
  if (finish && !(target === "text" && NEEDS_FILL.has(finish))) el.addClass("ep-fin", finishClass(finish));
  if (target === "text") {
    el.setCssProps({ "--ep-fmt-fg": color });
    return;
  }
  const fg = contrast && contrast !== "auto" ? contrast : readableOn(color);
  el.setCssProps({ "--ep-fmt-bg": color, "--ep-fmt-fg": fg });
}

/** The elements a row offers up for colouring. */
export interface FormatTargets {
  /** The whole row. */
  wrap?: HTMLElement | null;
  /** The value's own cell. */
  val?: HTMLElement | null;
  /** Each chip of a list, in the order the values are held. */
  chips?: HTMLElement[];
}

/**
 * Colour a rendered row from its value.
 *
 * Called after the value type has drawn itself, and again whenever the value
 * changes. A property nobody has formatted is left exactly as it was.
 */
export function applyFormat(view: ViewCtx, entry: Entry, raw: unknown, els: FormatTargets): void {
  const rule = ruleFor(view, entry);
  const palette = paletteFor(view, rule);
  for (const el of [els.wrap, els.val]) if (el) clear(el);
  for (const chip of els.chips ?? []) clear(chip);
  if (!rule || !palette) return;
  const target = targetOf(rule);

  // A list colours its chips one by one - each chip is its own value - and
  // gives the row or the text the blend of them.
  if (els.chips?.length && Array.isArray(raw)) {
    els.chips.forEach((chip, i) => {
      const item = raw[i];
      const fin = pickFinish(rule.finishes, item);
      const c = fin?.color ?? colorOfWith(view, entry, palette, item);
      if (c) paint(chip, c, target === "text" ? "text" : "chip", rule.contrast, fin?.finish);
    });
  }

  const fin = pickFinish(rule.finishes, raw);
  const color = fin?.color ?? colorOfWith(view, entry, palette, raw);
  if (!color) return;
  if (target === "card") {
    if (els.wrap) paint(els.wrap, color, "card", rule.contrast, fin?.finish);
    return;
  }
  // Chips have been painted individually; a single value paints its cell.
  if (target === "chip" && els.chips?.length) return;
  if (els.val) paint(els.val, color, target, rule.contrast, fin?.finish);
}
