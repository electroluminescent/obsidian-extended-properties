/**
 * Touch parity for right-click menus (roadmap E2).
 *
 * Phones have no right-click, so every context menu needs a long-press path.
 * Rather than refactor each menu builder, {@link longPressContextMenu}
 * synthesizes a `contextmenu` event at the press point - the element's existing
 * `oncontextmenu` / `addEventListener("contextmenu")` handler fires unchanged
 * and shows its menu at the touch location.
 */

import { Modal, Platform } from "obsidian";

export interface LongPressOptions {
  /** Hold duration before firing (ms). */
  ms?: number;
  /** Movement tolerance before the press is treated as a scroll/drag (px). */
  moveTol?: number;
}

/**
 * Fire `fn(x, y)` when `el` is pressed and held without moving (touch/pen).
 * Mouse input is ignored - desktop already has right-click. Returns a disposer.
 */
export function onLongPress(
  el: HTMLElement,
  fn: (x: number, y: number) => void,
  o: LongPressOptions = {}
): () => void {
  const ms = o.ms ?? 500;
  const tol = o.moveTol ?? 10;
  let timer = 0;
  let sx = 0;
  let sy = 0;
  let fired = false;

  const clear = (): void => {
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
  };
  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === "mouse") return;
    sx = e.clientX;
    sy = e.clientY;
    fired = false;
    clear();
    timer = window.setTimeout(() => {
      timer = 0;
      fired = true;
      fn(sx, sy);
    }, ms);
  };
  const onMove = (e: PointerEvent): void => {
    if (timer && (Math.abs(e.clientX - sx) > tol || Math.abs(e.clientY - sy) > tol)) clear();
  };
  // Some mobile webviews fire touchmove (not pointermove) while scrolling.
  const onTouchMove = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (timer && t && (Math.abs(t.clientX - sx) > tol || Math.abs(t.clientY - sy) > tol)) clear();
  };
  const onUp = (): void => clear();
  // Swallow the click that the OS dispatches after a long-press.
  const onClick = (e: MouseEvent): void => {
    if (fired) {
      e.preventDefault();
      e.stopPropagation();
      fired = false;
    }
  };

  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("touchmove", onTouchMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);
  el.addEventListener("pointerleave", onUp);
  el.addEventListener("scroll", onUp, true);
  el.addEventListener("click", onClick, true);
  return () => {
    clear();
    el.removeEventListener("pointerdown", onDown);
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("pointerup", onUp);
    el.removeEventListener("pointercancel", onUp);
    el.removeEventListener("pointerleave", onUp);
    el.removeEventListener("scroll", onUp, true);
    el.removeEventListener("click", onClick, true);
  };
}

/** Long-press `el` to fire its existing `contextmenu` handler at the touch point. */
export function longPressContextMenu(el: HTMLElement): () => void {
  return onLongPress(el, (x, y) =>
    el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: x, clientY: y }))
  );
}

/** On mobile, present a modal as a bottom sheet (larger, anchored to the bottom). */
export function asMobileSheet(modal: Modal): void {
  if (Platform.isMobile) modal.modalEl.addClass("ep-mobile-sheet");
}

/**
 * Swallow the click that ends a scroll/drag gesture inside `root`, so dragging
 * to scroll on a touch screen never accidentally toggles a checkbox, nudges a
 * stepper, fires a roll, or edits a value.
 *
 * All listeners are capture-phase: when `root` is an ancestor of the control,
 * stopping propagation prevents the event reaching it; when `root` *is* the
 * control (an inline chip), `stopImmediatePropagation` blocks its own handler.
 * Movement is detected from pointer/touch deltas and from `pointercancel`
 * (which fires when the browser hands the gesture off to native scrolling).
 */
export function guardScrollTaps(root: HTMLElement, tol = 10): () => void {
  let sx = 0;
  let sy = 0;
  let moved = false;
  const start = (x: number, y: number): void => {
    sx = x;
    sy = y;
    moved = false;
  };
  const move = (x: number, y: number): void => {
    if (!moved && (Math.abs(x - sx) > tol || Math.abs(y - sy) > tol)) moved = true;
  };
  const onPointerDown = (e: PointerEvent): void => start(e.clientX, e.clientY);
  const onPointerMove = (e: PointerEvent): void => move(e.clientX, e.clientY);
  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (t) start(t.clientX, t.clientY);
  };
  const onTouchMove = (e: TouchEvent): void => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  };
  const onCancel = (): void => {
    moved = true;
  };
  const onClick = (e: MouseEvent): void => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      moved = false;
    }
  };
  root.addEventListener("pointerdown", onPointerDown, true);
  root.addEventListener("pointermove", onPointerMove, true);
  root.addEventListener("touchstart", onTouchStart, true);
  root.addEventListener("touchmove", onTouchMove, true);
  root.addEventListener("pointercancel", onCancel, true);
  root.addEventListener("click", onClick, true);
  return () => {
    root.removeEventListener("pointerdown", onPointerDown, true);
    root.removeEventListener("pointermove", onPointerMove, true);
    root.removeEventListener("touchstart", onTouchStart, true);
    root.removeEventListener("touchmove", onTouchMove, true);
    root.removeEventListener("pointercancel", onCancel, true);
    root.removeEventListener("click", onClick, true);
  };
}
