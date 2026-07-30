/**
 * Entry interaction routing: right-click and press-and-hold on a property
 * are user-mappable (settings.rightClickAction / holdAction) to one of
 *
 *  - "menu"     - the regular entry context menu;
 *  - "settings" - a scrollable popup at the cursor hosting the property's
 *                 full settings page (renderEntryOptionsBody);
 *  - "focus"    - highlight the entry (cleared by the next click elsewhere).
 *
 * The hold shows a circular progress ring around the cursor and focuses the
 * property while it charges; after HOLD_MS it fires the configured action.
 * Pointer events cover mouse and touch alike; moving more than a few pixels
 * (a scroll or drag) cancels the hold.
 */

import { TFile } from "obsidian";
import type { ViewCtx, OptionsCtx } from "../../core/context";
import type { Entry, Section } from "../../core/model";
import { openEntryMenu } from "../menus/entry-menu";
import { renderEntryOptionsBody } from "../modals/entry-options";

export type EntryInteraction = "menu" | "settings" | "focus";

const HOLD_MS = 1000;
const MOVE_TOLERANCE = 8;

/** The configured action for an interaction (with sensible defaults). */
export function interactionFor(
  settings: { rightClickAction?: string; holdAction?: string },
  kind: "right" | "hold"
): EntryInteraction {
  const v = kind === "right" ? settings.rightClickAction : settings.holdAction;
  return v === "menu" || v === "settings" || v === "focus" ? v : kind === "right" ? "menu" : "settings";
}

// -- focus -------------------------------------------------------------------

let focused: HTMLElement | null = null;

/** Highlight an entry until the next pointer-down lands outside it. */
export function focusEntry(wrap: HTMLElement): void {
  if (focused && focused !== wrap) focused.removeClass("ep-holdfocus");
  focused = wrap;
  wrap.addClass("ep-holdfocus");
  wrap.scrollIntoView({ block: "nearest" });
  const doc = wrap.ownerDocument;
  const clear = (ev: PointerEvent): void => {
    if (ev.target instanceof Node && wrap.contains(ev.target)) return;
    wrap.removeClass("ep-holdfocus");
    if (focused === wrap) focused = null;
    doc.removeEventListener("pointerdown", clear, true);
  };
  doc.addEventListener("pointerdown", clear, true);
}

// -- the settings popup ------------------------------------------------------

let openPopup: HTMLElement | null = null;
let popupCleanup: (() => void) | null = null;

function closeSettingsPopup(): void {
  popupCleanup?.();
  popupCleanup = null;
  openPopup?.remove();
  openPopup = null;
}

/**
 * A scrollable popup at (x, y) hosting the property's full settings page -
 * the same body the options modal renders, ported to the cursor.
 */
export function openEntrySettingsPopup(
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry,
  x: number,
  y: number
): void {
  closeSettingsPopup();
  const doc = activeDocument;
  const pop = doc.body.createDiv({ cls: "ep-popup ep-entrysettings ep-options" });
  openPopup = pop;
  const body = pop.createDiv({ cls: "ep-entrysettings-body" });
  const build = (): void => {
    body.empty();
    const octx: OptionsCtx = {
      view,
      file,
      section,
      entry,
      container: body,
      changed: () => {
        view.saveLayout();
        view.rerender();
      },
      redraw: build,
    };
    renderEntryOptionsBody(octx, closeSettingsPopup, closeSettingsPopup);
  };
  build();
  // Clamp near the cursor once sized.
  const place = (): void => {
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    const top = Math.max(8, Math.min(y + 6, window.innerHeight - h - 8));
    pop.setCssStyles({ left: left + "px", top: top + "px" });
  };
  place();
  window.requestAnimationFrame(place);
  const onDown = (ev: PointerEvent): void => {
    if (ev.target instanceof Node && pop.contains(ev.target)) return;
    // Suggestion popovers (autocomplete) live outside the popup - keep it
    // open while the pointer lands on one of them.
    if (ev.target instanceof HTMLElement && ev.target.closest(".suggestion-container")) return;
    closeSettingsPopup();
  };
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key === "Escape") closeSettingsPopup();
  };
  doc.addEventListener("pointerdown", onDown, true);
  doc.addEventListener("keydown", onKey, true);
  popupCleanup = () => {
    doc.removeEventListener("pointerdown", onDown, true);
    doc.removeEventListener("keydown", onKey, true);
  };
}

// -- routing -----------------------------------------------------------------

function runInteraction(
  action: EntryInteraction,
  wrap: HTMLElement,
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry,
  x: number,
  y: number
): void {
  if (action === "focus") {
    focusEntry(wrap);
  } else if (action === "settings") {
    focusEntry(wrap);
    openEntrySettingsPopup(view, file, section, entry, x, y);
  } else {
    openEntryMenu(new MouseEvent("contextmenu", { clientX: x, clientY: y, bubbles: true }), view, file, section, entry);
  }
}

/** Whether a press began on an interactive control (never start a hold there). */
function onControl(t: EventTarget | null): boolean {
  return (
    t instanceof HTMLElement &&
    !!t.closest("input, button, textarea, select, a, .ep-editable, .ep-step-btn, .ep-rating-pip, .ep-slider2-knob, .ep-grip, .ep-menu-btn, .ep-era-chip")
  );
}

/**
 * Wire the entry's right-click and press-and-hold interactions. Replaces the
 * fixed context-menu handlers; the edit-mode "..." button keeps opening the
 * regular menu regardless of the mapping.
 */
export function wireEntryInteractions(
  wrap: HTMLElement,
  view: ViewCtx,
  file: TFile,
  section: Section,
  entry: Entry
): void {
  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    runInteraction(interactionFor(view.settings, "right"), wrap, view, file, section, entry, e.clientX, e.clientY);
  });

  let ring: HTMLElement | null = null;
  let raf = 0;
  let start = 0;
  let sx = 0;
  let sy = 0;
  let holding = false;

  const stop = (keepFocus: boolean): void => {
    if (!holding) return;
    holding = false;
    window.cancelAnimationFrame(raf);
    ring?.remove();
    ring = null;
    if (!keepFocus) wrap.removeClass("ep-holdfocus");
  };

  wrap.addEventListener("pointerdown", (e: PointerEvent) => {
    if (holding || e.button !== 0 || onControl(e.target)) return;
    holding = true;
    start = performance.now();
    sx = e.clientX;
    sy = e.clientY;
    // The charging ring hugs the cursor; the property lights up while held.
    ring = activeDocument.body.createDiv({ cls: "ep-holdring" });
    ring.setCssStyles({ left: e.clientX + "px", top: e.clientY + "px" });
    wrap.addClass("ep-holdfocus");
    const tick = (): void => {
      if (!holding) return;
      const p = Math.min(1, (performance.now() - start) / HOLD_MS);
      ring?.setCssProps({ "--ep-hold": String(p) });
      if (p >= 1) {
        const action = interactionFor(view.settings, "hold");
        stop(action === "focus" || action === "settings");
        if (action === "focus") focused = wrap; // ring already lit it
        runInteraction(action, wrap, view, file, section, entry, sx, sy);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
  });
  wrap.addEventListener("pointermove", (e: PointerEvent) => {
    if (!holding) return;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_TOLERANCE) stop(false);
  });
  for (const ev of ["pointerup", "pointercancel", "pointerleave"] as const) {
    wrap.addEventListener(ev, () => stop(false));
  }
}
