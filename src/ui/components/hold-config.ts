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
 *
 * Mobile has one gesture, not four: a long press is *both* a hold and the
 * platform's context-menu trigger, so a single press would otherwise fire two
 * mappings at once. Touch devices therefore route every long press through
 * the "right click and hold" mapping and swallow the native context menu -
 * see {@link mobileGestures} and the settings tab's disclaimer.
 */

import { Menu, Platform, setIcon, TFile } from "obsidian";
import type { ViewCtx, OptionsCtx } from "../../core/context";
import { Entry, Section, sectionMode } from "../../core/model";
import * as ops from "../../core/layout-ops";
import { openEntryMenu } from "../menus/entry-menu";
import { renderEntryOptionsBody } from "../modals/entry-options";
import { showMenuAt } from "../menus/show";

export type EntryInteraction = "menu" | "settings" | "focus" | "none";

/** The four mappable gestures on a property. */
export type GestureKind = "click" | "hold" | "right" | "rightHold";

const DEFAULT_HOLD_MS = 500;
const MOVE_TOLERANCE = 8;
/** A press shorter than this never shows the ring - it is just a click. */
const RING_DELAY_MS = 140;

interface InteractionSettings {
  clickAction?: string;
  holdAction?: string;
  rightClickAction?: string;
  rightHoldAction?: string;
  holdMs?: number;
}

const DEFAULTS: Record<GestureKind, EntryInteraction> = {
  click: "none", // clicks belong to the value editors
  hold: "settings",
  right: "menu",
  rightHold: "settings", // same as a left hold - the property settings
};

/** The configured action for a gesture (with sensible defaults). */
export function interactionFor(settings: InteractionSettings, kind: GestureKind): EntryInteraction {
  const v =
    kind === "click" ? settings.clickAction
    : kind === "hold" ? settings.holdAction
    : kind === "right" ? settings.rightClickAction
    : settings.rightHoldAction;
  return v === "menu" || v === "settings" || v === "focus" || v === "none" ? v : DEFAULTS[kind];
}

/**
 * Whether this platform collapses the four gestures into one long press.
 * Touch has no separate right button, and the webview raises `contextmenu`
 * for the same press that charges our hold.
 */
export function mobileGestures(): boolean {
  return Platform.isMobile;
}

/**
 * The gesture whose mapping actually applies to `kind` on this platform.
 * On mobile a plain hold and a "right click" are the same long press, so both
 * resolve to the right-click-and-hold mapping and nothing fires twice.
 */
export function effectiveGesture(kind: GestureKind, mobile = mobileGestures()): GestureKind {
  return mobile && (kind === "hold" || kind === "right") ? "rightHold" : kind;
}

/** Configured hold duration in ms (default 500). */
export function holdMsOf(settings: InteractionSettings): number {
  const n = Number(settings.holdMs);
  return Number.isFinite(n) && n >= 100 ? Math.min(5000, n) : DEFAULT_HOLD_MS;
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
  const pop = openPopup;
  openPopup = null;
  if (!pop) return;
  // Mirror the open animation on the way out (shared .ep-closing keyframes);
  // the element is detached once it finishes, or immediately when animations
  // are off (reduced motion emits no animationend).
  pop.addClass("ep-closing");
  let removed = false;
  const drop = (): void => {
    if (removed) return;
    removed = true;
    pop.remove();
  };
  pop.addEventListener("animationend", drop, { once: true });
  window.setTimeout(drop, 200);
}

/**
 * Layers a settings row legitimately opens *outside* the popup element:
 * autocomplete lists, Obsidian menus, modals (the icon picker, prompts,
 * confirmations) and notices. A press in one of these belongs to the popup's
 * own workflow, so it must not be read as "clicked away".
 */
const OUTSIDE_LAYERS =
  ".ep-popup, .suggestion-container, .menu, .modal-container, .prompt, .notice, .notice-container";

/** Layers that consume Escape themselves before the popup should see it. */
const OWN_ESCAPE =
  ".modal-container, .suggestion-container, .menu, .ep-popup:not(.ep-entrysettings)";

/**
 * Whether a press or key really landed away from the popup.
 *
 * Two cases are deliberately *not* "away": the extra layers above, and the
 * native `<select>` list. The browser draws that list outside the page, so the
 * press that picks an option is reported against the document rather than the
 * select - dismissing on it would close the popup every time a dropdown is
 * used. While a select inside the popup holds focus, a press with no element
 * of its own belongs to that list.
 */
export function outsidePopup(pop: HTMLElement, target: EventTarget | null, doc: Document): boolean {
  if (!(target instanceof Node)) return false;
  if (pop.contains(target)) return false;
  if (target.instanceOf(HTMLElement) && target.closest(OUTSIDE_LAYERS)) return false;
  const active = doc.activeElement;
  const onSelect = !!active?.instanceOf(HTMLSelectElement) && pop.contains(active);
  if (onSelect && (target === doc.body || target === doc.documentElement)) return false;
  return true;
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
  // ep-compactopts strips descriptions and stacks each row's control under
  // its name, so everything fits the menu width with no horizontal scroll.
  const pop = doc.body.createDiv({ cls: "ep-popup ep-entrysettings ep-options ep-compactopts" });
  // On mobile this popup stands in for the context menu, so it presents the
  // way menus do there: a sheet along the bottom edge, not a cursor popover.
  const sheet = mobileGestures();
  if (sheet) pop.addClass("ep-entrysettings-sheet");
  openPopup = pop;
  // Icon toolbar: the regular context menu's actions, one button each.
  const bar = pop.createDiv({ cls: "ep-entrysettings-bar" });
  const tool = (icon: string, label: string, run: () => void): void => {
    const b = bar.createEl("button", { cls: "ep-entrysettings-tool" });
    setIcon(b, icon);
    b.setAttr("aria-label", label);
    b.setAttr("title", label);
    b.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      run();
    };
  };
  const t = view.i18n.t.bind(view.i18n);
  // Escape hatch to the full settings page (descriptions, wide controls).
  tool("settings", t("entry.menu.configure", { name: (entry.alias as string) || view.defaultLabelFor(entry) }), () => {
    closeSettingsPopup();
    view.openEntryOptions(section, entry);
  });
  if (entry.kind === "prop" && entry.key) {
    const key = entry.key;
    const hidden = view.hide.isHidden(key);
    tool(hidden ? "eye" : "eye-off",
      hidden ? t("entry.menu.showInObsidian", { key }) : t("entry.menu.hideFromObsidian", { key }),
      () => {
        view.hide.toggle(key);
        closeSettingsPopup();
      });
    tool("eraser", t("entry.menu.clearValue", { key }), () => {
      view.note.set(file, key, undefined);
      closeSettingsPopup();
    });
    // The value type's own menu actions (edit value, pick a color, add an
    // item, roll ...) are the one part of the context menu that has no
    // equivalent row in the settings body, so they hang off a button here -
    // the popup can then stand in for the menu completely.
    const typeDef = view.registries.valueTypes.get(view.resolveType(entry));
    const contribute = typeDef?.menuItems;
    if (contribute) {
      tool("wand", t("entry.menu.valueActions", { key }), () => {
        const menu = new Menu();
        contribute(menu, { view, file, section, entry }, { x, y });
        closeSettingsPopup();
        showMenuAt(menu, { x, y }, doc);
      });
    }
  }
  const mode = sectionMode(section);
  const kindDef = view.registries.entryKinds.get(entry.kind);
  if ((mode === "grid" || mode === "columns") && !kindDef?.wide) {
    const cols = section.columns || 1;
    const idx = section.entries.indexOf(entry);
    if (idx >= 0) {
      const structural = (icon: string, label: string, act: () => void): void =>
        tool(icon, label, () => {
          act();
          view.saveLayout();
          view.rerender();
          closeSettingsPopup();
        });
      if (mode === "grid")
        structural("rows-3", t("grid.removeRow"), () => ops.removeRowAt(section, Math.floor(idx / cols)));
      structural("columns-3", mode === "grid" ? t("grid.removeColumn") : t("grid.removeAColumn"),
        () => ops.removeColumnAt(section, idx % cols, mode === "grid"));
    }
  }
  tool("trash", t("entry.menu.remove"), () => {
    view.removeEntry(section, entry);
    closeSettingsPopup();
  });
  const body = pop.createDiv({ cls: "ep-entrysettings-body" });
  const build = (): void => {
    // Rows rebuild in place (a rename, a data-type change): keep the reader
    // where they were instead of snapping back to the top, which reads as the
    // popup having closed and reopened.
    const scroll = body.scrollTop;
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
    // Descriptions are hidden for compactness (CSS) - surface them as
    // tooltips so hovering a row still explains it.
    for (const item of body.findAll(".setting-item")) {
      const desc = item.querySelector<HTMLElement>(".setting-item-description")?.textContent?.trim();
      const name = item.querySelector<HTMLElement>(".setting-item-name")?.textContent?.trim() ?? "";
      if (desc) item.setAttr("title", name ? name + " - " + desc : desc);
    }
    if (scroll) body.scrollTop = scroll;
  };
  build();
  // Clamp near the cursor once sized. The mobile sheet is placed by CSS.
  const place = (): void => {
    if (sheet) return;
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    const left = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    const top = Math.max(8, Math.min(y + 6, window.innerHeight - h - 8));
    pop.setCssStyles({ left: left + "px", top: top + "px" });
  };
  place();
  window.requestAnimationFrame(place);
  const onDown = (ev: PointerEvent): void => {
    if (!outsidePopup(pop, ev.target, doc)) return;
    closeSettingsPopup();
  };
  const onKey = (ev: KeyboardEvent): void => {
    if (ev.key !== "Escape") return;
    // A modal, suggestion list or menu opened from a row owns Escape first -
    // it closes, and the popup it was opened from stays put.
    if (!outsidePopup(pop, ev.target, doc)) return;
    if (doc.querySelector(OWN_ESCAPE)) return;
    closeSettingsPopup();
  };
  doc.addEventListener("pointerdown", onDown, true);
  doc.addEventListener("keydown", onKey, true);
  popupCleanup = () => {
    doc.removeEventListener("pointerdown", onDown, true);
    doc.removeEventListener("keydown", onKey, true);
  };
}

// -- routing -----------------------------------------------------------------


/** Per-action handlers a surface supplies to {@link wireGestures}. */
export interface GestureHandlers {
  menu: (x: number, y: number) => void;
  settings?: (x: number, y: number) => void;
  focus?: () => void;
}

/**
 * Wire the four mappable gestures onto any element (sidebar entries, inline
 * cards, inline chips). Actions the surface can't provide fall back to its
 * menu, so a mapping never leaves a gesture dead.
 */
export function wireGestures(
  el: HTMLElement,
  settings: InteractionSettings,
  handlers: GestureHandlers
): void {
  const mobile = mobileGestures();
  /** The mapping that applies to a gesture here (see {@link effectiveGesture}). */
  const actionFor = (kind: GestureKind): EntryInteraction =>
    interactionFor(settings, effectiveGesture(kind, mobile));

  const run = (action: EntryInteraction, x: number, y: number): void => {
    if (action === "none") return;
    if (action === "focus") {
      if (handlers.focus) handlers.focus();
      else focusEntry(el);
      return;
    }
    if (action === "settings") {
      if (handlers.settings) {
        handlers.focus ? handlers.focus() : focusEntry(el);
        handlers.settings(x, y);
      } else {
        handlers.menu(x, y);
      }
      return;
    }
    handlers.menu(x, y);
  };

  let ring: HTMLElement | null = null;
  let raf = 0;
  let start = 0;
  let sx = 0;
  let sy = 0;
  let holding = false;
  let heldButton = 0;
  let consumed = false;
  /** Document-level release listeners, so a release anywhere cancels. */
  let detach: (() => void) | null = null;

  const stop = (keepFocus: boolean): void => {
    if (!holding) return;
    holding = false;
    window.cancelAnimationFrame(raf);
    ring?.remove();
    ring = null;
    detach?.();
    detach = null;
    if (!keepFocus) el.removeClass("ep-holdfocus");
  };

  el.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (consumed) {
      consumed = false;
      return;
    }
    // On touch this event *is* the long press our own timer already owns:
    // swallowing it keeps one press to one action.
    if (mobile) return;
    run(actionFor("right"), e.clientX, e.clientY);
  });

  el.addEventListener("click", (e: MouseEvent) => {
    if (consumed) {
      consumed = false;
      return;
    }
    if (onControl(e.target)) return;
    const action = actionFor("click");
    if (action === "none") return;
    e.preventDefault();
    e.stopPropagation();
    run(action, e.clientX, e.clientY);
  });

  el.addEventListener("pointerdown", (e: PointerEvent) => {
    if (holding || (e.button !== 0 && e.button !== 2) || onControl(e.target)) return;
    const kind: GestureKind = e.button === 2 ? "rightHold" : "hold";
    if (actionFor(kind) === "none") return;
    holding = true;
    heldButton = e.button;
    consumed = false;
    start = performance.now();
    sx = e.clientX;
    sy = e.clientY;
    const holdMs = holdMsOf(settings);
    // A release anywhere (outside the element, over a popup, after the
    // pointer left) must cancel the hold - not only a release on the
    // element itself, which is how a quick click could still charge.
    const doc = el.ownerDocument;
    const onRelease = (): void => stop(false);
    doc.addEventListener("pointerup", onRelease, true);
    doc.addEventListener("pointercancel", onRelease, true);
    detach = () => {
      doc.removeEventListener("pointerup", onRelease, true);
      doc.removeEventListener("pointercancel", onRelease, true);
    };
    const tick = (): void => {
      if (!holding) return;
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / holdMs);
      // The ring (and the focus glow) only appear once the press has
      // outlasted a normal click, so clicking never looks like holding.
      if (!ring && elapsed >= RING_DELAY_MS) {
        ring = activeDocument.body.createDiv({ cls: "ep-holdring" });
        ring.setCssStyles({ left: sx + "px", top: sy + "px" });
        el.addClass("ep-holdfocus");
      }
      ring?.setCssProps({ "--ep-hold": String(p) });
      if (p >= 1) {
        const action = actionFor(kind);
        stop(action === "focus" || action === "settings");
        if (action === "focus") focused = el;
        consumed = true;
        run(action, sx, sy);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
  });
  el.addEventListener("pointermove", (e: PointerEvent) => {
    if (!holding) return;
    if (Math.hypot(e.clientX - sx, e.clientY - sy) > MOVE_TOLERANCE) stop(false);
  });
  el.addEventListener("pointerup", (e: PointerEvent) => {
    if (holding && e.button === heldButton) stop(false);
  });
  for (const ev of ["pointercancel", "pointerleave"] as const) {
    el.addEventListener(ev, () => stop(false));
  }
}

/** Whether a press began on an interactive control (never start a hold there). */
function onControl(t: EventTarget | null): boolean {
  return (
    t instanceof Node &&
    t.instanceOf(HTMLElement) &&
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
  wireGestures(wrap, view.settings, {
    menu: (x, y) =>
      openEntryMenu(new MouseEvent("contextmenu", { clientX: x, clientY: y, bubbles: true }), view, file, section, entry),
    settings: (x, y) => openEntrySettingsPopup(view, file, section, entry, x, y),
  });
}