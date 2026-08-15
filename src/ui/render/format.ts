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

import type { Entry, FinishRule, FormatRule } from "../../core/model";
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
  const found = (view.settings.palettes ?? []).find((p) => p.id === rule.palette);
  if (!found || !rule.scale?.steps?.length) return found;
  // The property has a scale of its own. It keeps the palette's COLOURS and
  // everything else about it - which is the point: one palette, read against
  // whatever range this particular property happens to have. A scale with
  // more steps than the palette has colours runs round them again rather than
  // leaving its last steps uncoloured.
  const colors = found.colors ?? [];
  const steps = rule.scale.steps;
  return {
    ...found,
    steps,
    relative: rule.scale.relative,
    colors: colors.length ? steps.map((_, i) => colors[i % colors.length]) : colors,
  };
}

/**
 * The finishes in force: the property's own, else the palette's.
 *
 * A palette is a look, and a look is a colour and a material both - so a
 * property that says nothing about finishes wears what its palette wears.
 */
export function finishesFor(rule: FormatRule | undefined, palette: Palette | undefined): FinishRule[] | undefined {
  return rule?.finishes?.length ? rule.finishes : palette?.finishes;
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

/**
 * Take every trace of a previous pass off `el` - except the finish, which is
 * handed over rather than snatched away (see {@link wearFinish}).
 */
function clear(el: HTMLElement): void {
  el.removeClass("ep-fmt", "ep-fmt-text", "ep-fmt-chip", "ep-fmt-card");
  el.setCssProps({ "--ep-fmt-bg": "", "--ep-fmt-fg": "" });
}

/** How long a finish takes to fade out before the next one fades in. */
const FADE_MS = 180;

/**
 * How far along the sheet a piece cut out of it is moved. Enough that a chip
 * is plainly its own piece of material and not a hole through to the row;
 * little enough that the two still look like the same stuff.
 */
const NUDGE_PX = 9;

/** What each element is currently wearing, and any change in flight. */
interface Worn {
  id?: string;
  timer?: number;
}
const worn = new WeakMap<HTMLElement, Worn>();

/**
 * Put a finish on `el`, or take one off, without either popping into being.
 *
 * A value crossing from one band into another changes what it is MADE of, and
 * a material does not appear instantly - so the old one fades out, the class
 * is swapped while nothing can be seen of it, and the new one fades in. It
 * matters most exactly where it is most likely to be seen: dragging a slider
 * across a boundary, where the change would otherwise flicker at every
 * crossing.
 */
function wearFinish(el: HTMLElement, id: string | undefined): void {
  const state = worn.get(el) ?? {};
  worn.set(el, state);
  if (state.id === id) return;
  if (state.timer) window.clearTimeout(state.timer);
  const swap = (): void => {
    state.timer = undefined;
    el.removeClass("ep-fin");
    for (const f of FINISHES) el.removeClass(finishClass(f));
    if (id) el.addClass("ep-fin", finishClass(id));
    state.id = id;
    // Next frame, so the browser has drawn the swap at nothing before it is
    // asked to bring it up.
    window.requestAnimationFrame(() => el.setCssProps({ "--ep-fin-mount": id ? "1" : "" }));
  };
  el.setCssProps({ "--ep-fin-mount": "0" });
  // Nothing to fade out of: the swap can happen at once and only fade in.
  if (!state.id) swap();
  else state.timer = window.setTimeout(swap, FADE_MS);
}

/**
 * Lay the finishes of `parts` across `sheet` - the row they belong to.
 *
 * The layers are grown to the row and clipped back to each part (see the
 * stylesheet), so what is measured here is simply how far each part sits
 * inside the row. Done a frame later, because the row has only just been
 * drawn and asking now would measure the last one.
 */
function layAcross(sheet: HTMLElement | null | undefined, dressed: HTMLElement[]): void {
  if (!sheet) return;
  const parts = dressed.filter((el) => el !== sheet);
  if (!dressed.length) {
    sheet.removeClass("ep-fin-sheet");
    return;
  }
  window.requestAnimationFrame(() => {
    if (!sheet.isConnected) return;
    const box = sheet.getBoundingClientRect();
    if (box.width === 0) return;
    let any = false;
    for (const el of dressed) {
      if (!el.isConnected) continue;
      const own = el.getBoundingClientRect();
      if (own.width === 0) continue;
      const style = getComputedStyle(el);
      // A layer sits inside the border, so a chip's rim would be the one part
      // of it wearing nothing. The stylesheet grows the layer by this and
      // clips it back, which puts the material right out to the edge.
      const edge = style.borderTopWidth;
      // The clip has to be the part's own shape, corners included, or a pill
      // chip would show a square edge of the sheet at each end.
      const round = style.borderTopLeftRadius;
      const part = el !== sheet;
      if (part) any = true;
      el.setCssProps({
        "--ep-edge": edge && edge !== "0px" ? edge : "",
        "--ep-span-round": round && round !== "0px" ? round : "",
        "--ep-span-t": part ? Math.max(0, Math.round(own.top - box.top)) + "px" : "",
        "--ep-span-l": part ? Math.max(0, Math.round(own.left - box.left)) + "px" : "",
        "--ep-span-b": part ? Math.max(0, Math.round(box.bottom - own.bottom)) + "px" : "",
        "--ep-span-r": part ? Math.max(0, Math.round(box.right - own.right)) + "px" : "",
        // A piece cut out of a sheet is moved a little along it, so a chip
        // lying on a row of the same material still reads as a separate piece
        // rather than as a window onto what is behind it.
        "--ep-nudge": part ? NUDGE_PX + "px" : "",
      });
    }
    // The lamp lights a sheet as one thing, so every chip on a row shares a
    // highlight rather than each carrying its own.
    sheet.toggleClass("ep-fin-sheet", any && parts.length > 0);
  });
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
  wearFinish(el, finish && !(target === "text" && NEEDS_FILL.has(finish)) ? finish : undefined);
  if (target === "text") {
    el.setCssProps({ "--ep-fmt-fg": color });
    return;
  }
  const fg = contrast && contrast !== "auto" ? contrast : readableOn(color);
  el.setCssProps({ "--ep-fmt-bg": color, "--ep-fmt-fg": fg });
}

/**
 * A value being changed, before it is a value.
 *
 * A slider mid-drag and a field mid-typing have not written anything to the
 * note yet, so nothing reads back the number under the reader's finger. The
 * control announces it instead, on an event that rises to the row, and the
 * row recolours from it: the colour follows the drag rather than arriving
 * once it is let go.
 */
export const PREVIEW_EVENT = "ep-preview";

/** Announce the value a control is showing right now. */
export function previewValue(el: HTMLElement | null | undefined, value: unknown): void {
  el?.dispatchEvent(new CustomEvent(PREVIEW_EVENT, { detail: { value }, bubbles: true }));
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
  /** Everything that ended up wearing a finish, to be laid across the row. */
  const dressed: HTMLElement[] = [];
  const wear = (
    el: HTMLElement,
    color: string,
    at: "text" | "chip" | "card",
    finish: string | undefined
  ): void => {
    paint(el, color, at, rule?.contrast, finish);
    if (finish) dressed.push(el);
  };
  if (!rule || !palette) {
    // Nothing formats this any more: whatever it was wearing fades off it.
    for (const el of [els.wrap, els.val, ...(els.chips ?? [])]) if (el) wearFinish(el, undefined);
    layAcross(els.wrap, []);
    return;
  }
  const target = targetOf(rule);

  // A list colours its chips one by one - each chip is its own value - and
  // gives the row or the text the blend of them.
  if (els.chips?.length && Array.isArray(raw)) {
    els.chips.forEach((chip, i) => {
      const item = raw[i];
      const fin = pickFinish(finishesFor(rule, palette), item);
      const c = fin?.color ?? colorOfWith(view, entry, palette, item);
      if (c) wear(chip, c, target === "text" ? "text" : "chip", fin?.finish);
      else wearFinish(chip, undefined);
    });
  }

  const fin = pickFinish(finishesFor(rule, palette), raw);
  const color = fin?.color ?? colorOfWith(view, entry, palette, raw);
  if (!color) {
    for (const el of [els.wrap, els.val]) if (el) wearFinish(el, undefined);
    layAcross(els.wrap, dressed);
    return;
  }
  if (target === "card") {
    if (els.val) wearFinish(els.val, undefined);
    if (els.wrap) wear(els.wrap, color, "card", fin?.finish);
  } else if (target === "chip" && els.chips?.length) {
    // Chips have been painted individually; the row itself wears nothing.
    if (els.wrap) wearFinish(els.wrap, undefined);
    if (els.val) wearFinish(els.val, undefined);
  } else if (els.val) {
    if (els.wrap) wearFinish(els.wrap, undefined);
    wear(els.val, color, target, fin?.finish);
  }
  // Whatever is wearing a finish wears the SAME sheet of it: the row's, not
  // its own. A list of chips is one sheet with chips cut out of it.
  layAcross(els.wrap, dressed);
}
