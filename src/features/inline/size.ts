/**
 * Putting the configured shape (see `utils/inline-size`) on an inline piece.
 *
 * The arithmetic is pure and tested elsewhere; this is the DOM half - a class,
 * a custom property and a measured width, applied wherever a piece is built so
 * reading mode and Live Preview agree without either knowing about the other.
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
 * Shape `el` the way `kind` is configured. A piece nobody has sized is left
 * exactly as it was - flowing inside the sentence it was written in.
 *
 * The width of a share depends on the column the piece sits in, which is only
 * knowable once it is in the document, so `onFit` is called again on the next
 * frame with the box as it finally measured - which is how a chart draws its
 * geometry at the size it ended up rather than stretching to it.
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
  if (size?.align) el.addClass(`ep-inline-${size.align}`);
  const fit = (): void => {
    if (!el.isConnected) return;
    const column = el.parentElement?.getBoundingClientRect().width ?? 0;
    const w = resolveWidth(size, column);
    if (w.css) {
      el.setCssStyles({ width: w.css });
      el.addClass("ep-inline-wide"); // a width of its own also gets the floor
    }
    onFit?.();
  };
  fit();
  window.requestAnimationFrame(fit);
}
