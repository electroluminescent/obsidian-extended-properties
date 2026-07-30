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

import { setIcon, TFile } from "obsidian";
import type { ViewCtx, OptionsCtx } from "../../core/context";
import { Entry, Section, sectionMode } from "../../core/model";
import * as ops from "../../core/layout-ops";
import { openEntryMenu } from "../menus/entry-menu";
import { renderEntryOptionsBody } from "../modals/entry-options";

export type EntryInteraction = "menu" | "settings" | "focus" | "none";

/** The four mappable gestures on a property. */
export type GestureKind = "click" | "hold" | "right" | "rightHold";

const DEFAULT_HOLD_MS = 500;
const MOVE_TOLERANCE = 8;

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
  rightHold: "menu",
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
  if (action === "none") {
    return;
  } else if (action === "focus") {
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
  let ring: HTMLElement | null = null;
  let raf = 0;
  let start = 0;
  let sx = 0;
  let sy = 0;
  let holding = false;
  let heldButton = 0;
  /** Set when a hold fired, so the following click/contextmenu is swallowed. */
  let consumed = false;

  const stop = (keepFocus: boolean): void => {
    if (!holding) return;
    holding = false;
    window.cancelAnimationFrame(raf);
    ring?.remove();
    ring = null;
    if (!keepFocus) wrap.removeClass("ep-holdfocus");
  };

  // Right-click: the hold variant fires from the timer, so a plain
  // contextmenu only runs when no right-hold already did.
  wrap.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (consumed) {
      consumed = false;
      return;
    }
    runInteraction(interactionFor(view.settings, "right"), wrap, view, file, section, entry, e.clientX, e.clientY);
  });

  // Plain click on the entry body (never on a control, which owns its click).
  wrap.addEventListener("click", (e: MouseEvent) => {
    if (consumed) {
      consumed = false;
      return;
    }
    if (onControl(e.target)) return;
    const action = interactionFor(view.settings, "click");
    if (action === "none") return;
    e.preventDefault();
    e.stopPropagation();
    runInteraction(action, wrap, view, file, section, entry, e.clientX, e.clientY);
  });

  wrap.addEventListener("pointerdown", (e: PointerEvent) => {
    if (holding || (e.button !== 0 && e.button !== 2) || onControl(e.target)) return;
    const kind: GestureKind = e.button === 2 ? "rightHold" : "hold";
    if (interactionFor(view.settings, kind) === "none") return;
    holding = true;
    heldButton = e.button;
    consumed = false;
    start = performance.now();
    sx = e.clientX;
    sy = e.clientY;
    // The charging ring hugs the cursor; the property lights up while held.
    ring = activeDocument.body.createDiv({ cls: "ep-holdring" });
    ring.setCssStyles({ left: e.clientX + "px", top: e.clientY + "px" });
    wrap.addClass("ep-holdfocus");
    const holdMs = holdMsOf(view.settings);
    const tick = (): void => {
      if (!holding) return;
      const p = Math.min(1, (performance.now() - start) / holdMs);
      ring?.setCssProps({ "--ep-hold": String(p) });
      if (p >= 1) {
        const action = interactionFor(view.settings, kind);
        stop(action === "focus" || action === "settings");
        if (action === "focus") focused = wrap; // ring already lit it
        consumed = true; // the release must not also fire click/contextmenu
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
  wrap.addEventListener("pointerup", (e: PointerEvent) => {
    if (holding && e.button === heldButton) stop(false);
  });
  for (const ev of ["pointercancel", "pointerleave"] as const) {
    wrap.addEventListener(ev, () => stop(false));
  }
}
