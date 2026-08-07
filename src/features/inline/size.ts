/**
 * Putting the configured shape (see `utils/inline-size`) on an inline piece.
 *
 * The arithmetic is pure and tested elsewhere; this is the DOM half - a class,
 * a custom property and a measured width, applied wherever a piece is built so
 * reading mode and Live Preview agree without either knowing about the other.
 *
 * Two things are easy to get wrong here and are handled once, in one place:
 *
 * - A share is a share OF THE TEXT COLUMN. The element a piece is put inside
 *   is an inline wrapper whose width is the piece's own, so measuring the
 *   immediate parent made every share come out too narrow and step up to the
 *   full width. {@link columnWidth} walks out to the first ancestor that lays
 *   out as a block - the paragraph, the table cell, the callout.
 * - A piece is justified by its WRAPPER, not by margins of its own. Auto
 *   margins would need the piece to be a block, which breaks the line it sits
 *   in and pushes the words around it; a text-align on the wrapper moves the
 *   piece without touching anything else.
 */

import type { EPSettings } from "../../core/model";
import { isBoxed, isShaped, resolveLines, resolveWidth, type InlineSize } from "../../utils/inline-size";

/** How this kind of piece is set to be drawn, if it is set at all. */
export function inlineSizeOf(settings: EPSettings, kind: string): InlineSize | undefined {
  return settings.inline?.[kind];
}

/** Whether this kind is drawn in a card. */
export function inlineBoxed(settings: EPSettings, kind: string): boolean {
  return isBoxed(inlineSizeOf(settings, kind), kind);
}

/**
 * The width of the text column `el` sits in: the content width of the first
 * ancestor that is not an inline box. Zero when nothing has been laid out yet.
 */
export function columnWidth(el: HTMLElement): number {
  for (let p = el.parentElement; p; p = p.parentElement) {
    const cs = getComputedStyle(p);
    if (cs.display.startsWith("inline") && cs.display !== "inline-block") continue;
    const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const w = p.clientWidth - (Number.isFinite(pad) ? pad : 0);
    if (w > 0) return w;
  }
  return 0;
}

/** Justify a piece from its wrapper, so nothing around it is moved. */
function alignHost(el: HTMLElement, align: string | undefined): void {
  const host = el.parentElement;
  if (!host) return;
  host.removeClass("ep-inline-host-left", "ep-inline-host-center", "ep-inline-host-right");
  if (!align) return;
  host.addClass("ep-inline-host", `ep-inline-host-${align}`);
}

/**
 * Shape `el` the way `kind` is configured. A piece nobody has sized is left
 * exactly as it was - flowing inside the sentence it was written in.
 *
 * The column can only be measured once the piece is in the document, so
 * `onFit` is called again on the next frame with the box as it finally
 * measured - which is how a chart draws its geometry at the size it ended up
 * rather than stretching to it.
 */
export function applyInlineSize(
  el: HTMLElement,
  settings: EPSettings,
  kind: string,
  onFit?: () => void
): void {
  const size = inlineSizeOf(settings, kind);
  if (isBoxed(size, kind) && kind !== "vals") el.addClass("ep-inline-boxed");
  if (!isShaped(size)) return;
  el.addClass("ep-inline-sized");
  const lines = resolveLines(size);
  if (lines !== undefined) el.setCssProps({ "--ep-inline-lines": String(lines) });
  const fit = (): void => {
    if (!el.isConnected) return;
    alignHost(el, size?.align);
    const w = resolveWidth(size, columnWidth(el));
    if (w.css) {
      el.setCssStyles({ width: w.css });
      el.addClass("ep-inline-wide"); // a width of its own also gets the floor
    }
    onFit?.();
  };
  fit();
  window.requestAnimationFrame(fit);
}
